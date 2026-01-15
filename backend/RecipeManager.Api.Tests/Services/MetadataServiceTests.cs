using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RecipeManager.Api.Services;
using RecipeManager.Api.Utilities;

namespace RecipeManager.Api.Tests.Services;

[TestFixture]
public class MetadataServiceTests
{
    private Mock<IHttpClientFactory> _httpClientFactory = null!;
    private Mock<ILogger<MetadataService>> _logger = null!;
    private MetadataService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _httpClientFactory = new Mock<IHttpClientFactory>();
        _logger = new Mock<ILogger<MetadataService>>();
    }

    [Test]
    public async Task FetchMetadataAsync_UsesOpenGraphTags_WhenPresent()
    {
        var html = """
            <html><head>
              <meta property='og:title' content='Test &amp; Title'>
              <meta property='og:description' content='Great &quot;description&quot;'>
              <meta property='og:image' content='https://cdn.example.com/img.png'>
              <meta property='og:site_name' content='Example CDN'>
            </head></html>
        """;

        SetupClient(_ => CreateResponse(html));

        var result = await _service.FetchMetadataAsync("https://example.com/post");

        result.Should().NotBeNull();
        result!.Title.Should().Be("Test & Title");
        result.Description.Should().Be(@"Great ""description""");
        result.ImageUrl.Should().Be("https://cdn.example.com/img.png");
        result.SiteName.Should().Be("Example CDN");
    }

    [Test]
    public async Task FetchMetadataAsync_FallsBackToStandardMetaAndTitle()
    {
        var html = """
            <html><head>
                <title>Plain Title</title>
                <meta name='description' content='Simple description'>
            </head></html>
        """;

        SetupClient(_ => CreateResponse(html));

        var result = await _service.FetchMetadataAsync("https://example.com/page");

        result.Should().NotBeNull();
        result!.Title.Should().Be("Plain Title");
        result.Description.Should().Be("Simple description");
        result.SiteName.Should().Be("example.com");
    }

    [Test]
    public async Task FetchMetadataAsync_MakesRelativeImageAbsolute()
    {
        var html = """
            <html><head>
              <meta property='og:title' content='Image Test'>
              <meta property='og:image' content='/images/photo.jpg'>
            </head></html>
        """;

        SetupClient(_ => CreateResponse(html));

        var result = await _service.FetchMetadataAsync("https://example.com/post");

        result.Should().NotBeNull();
        result!.ImageUrl.Should().Be("https://example.com/images/photo.jpg");
    }

    [Test]
    public async Task FetchMetadataAsync_DecodesEntitiesFromTitleFallback()
    {
        var html = """
            <html><head><title>Recipe &amp; Co.</title></head></html>
        """;

        SetupClient(_ => CreateResponse(html));

        var result = await _service.FetchMetadataAsync("https://example.com/page");

        result.Should().NotBeNull();
        result!.Title.Should().Be("Recipe & Co.");
    }

    [Test]
    public async Task FetchMetadataAsync_ReturnsNull_WhenContentExceedsLimitWithoutHeader()
    {
        var oversizedText = new string('a', MetadataConstants.MaxContentLength + 10);
        var html = $"<html><body>{oversizedText}</body></html>";

        SetupClient(_ => CreateResponse(html, setContentLength: false));

        var result = await _service.FetchMetadataAsync("https://example.com/large");

        result.Should().BeNull();
    }

    private void SetupClient(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
    {
        var handler = new FakeHttpMessageHandler(responseFactory);
        var client = new HttpClient(handler);
        _httpClientFactory.Setup(x => x.CreateClient("MetadataClient")).Returns(client);
        _service = new MetadataService(_httpClientFactory.Object, _logger.Object);
    }

    private static HttpResponseMessage CreateResponse(string html, bool setContentLength = true, long? contentLengthOverride = null)
    {
        HttpContent content;
        if (setContentLength)
        {
            content = new StringContent(html, Encoding.UTF8, "text/html");
            if (contentLengthOverride.HasValue)
            {
                content.Headers.ContentLength = contentLengthOverride;
            }
        }
        else
        {
            content = new StreamContent(new MemoryStream(Encoding.UTF8.GetBytes(html)));
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/html");
            if (contentLengthOverride.HasValue)
            {
                content.Headers.ContentLength = contentLengthOverride;
            }
        }

        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = content
        };
    }

    private sealed class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _responseFactory;

        public FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        {
            _responseFactory = responseFactory;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_responseFactory(request));
        }
    }
}
