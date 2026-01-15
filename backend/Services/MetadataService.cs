using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using System.Net;
using System.Text;

namespace RecipeManager.Api.Services;

/// <summary>
/// Fetches and parses recipe metadata using an HTML parser (AngleSharp) to reliably handle varied markup.
/// </summary>
public class MetadataService : IMetadataService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MetadataService> _logger;
    private const int MaxContentLength = 5 * 1024 * 1024; // 5MB max

    public MetadataService(IHttpClientFactory httpClientFactory, ILogger<MetadataService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<RecipeMetadata?> FetchMetadataAsync(string url)
    {
        try
        {
            // Validate URL
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                _logger.LogWarning("Invalid URL: {Url}", url);
                return null;
            }

            var client = _httpClientFactory.CreateClient("MetadataClient");

            // Create request with headers to mimic a browser
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; RecipeManagerBot/1.0)");
            request.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml");

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            // Check content type
            var contentType = response.Content.Headers.ContentType?.MediaType?.ToLowerInvariant();
            if (contentType != null && !contentType.Contains("text/html") && !contentType.Contains("application/xhtml"))
            {
                _logger.LogWarning("Non-HTML content type: {ContentType}", contentType);
                return null;
            }

            // Check content length
            var contentLength = response.Content.Headers.ContentLength;
            if (contentLength.HasValue && contentLength.Value > MaxContentLength)
            {
                _logger.LogWarning("Content too large: {ContentLength} bytes", contentLength.Value);
                return null;
            }

            response.EnsureSuccessStatusCode();

            var html = await response.Content.ReadAsStringAsync();

            var contentBytes = Encoding.UTF8.GetByteCount(html);
            if (contentBytes > MaxContentLength)
            {
                _logger.LogWarning("Content too large after download: {ContentLength} bytes", contentBytes);
                return null;
            }

            // Parse metadata
            var metadata = ParseMetadata(html, uri);
            return metadata;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error fetching metadata from {Url}", url);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout fetching metadata from {Url}", url);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching metadata from {Url}", url);
            return null;
        }
    }

    private RecipeMetadata ParseMetadata(string html, Uri baseUri)
    {
        var parser = new HtmlParser();
        var document = parser.ParseDocument(html);
        var metaTags = document.Head?.QuerySelectorAll("meta") ?? document.QuerySelectorAll("meta");

        // Extract Open Graph tags first (preferred)
        var ogTitle = ExtractMetaContent(metaTags, "og:title");
        var ogDescription = ExtractMetaContent(metaTags, "og:description");
        var ogImage = ExtractMetaContent(metaTags, "og:image");
        var ogSiteName = ExtractMetaContent(metaTags, "og:site_name");

        // Fallback to standard HTML tags if OG tags not found
        var title = ogTitle ?? ExtractTitle(document);
        var description = ogDescription ?? ExtractMetaContent(metaTags, "description");
        var image = ogImage;

        // Make image URL absolute if it's relative
        if (!string.IsNullOrEmpty(image) && Uri.TryCreate(image, UriKind.RelativeOrAbsolute, out var imageUri))
        {
            if (!imageUri.IsAbsoluteUri)
            {
                image = new Uri(baseUri, imageUri).ToString();
            }
        }

        // Use site name from OG or fallback to domain name
        var siteName = ogSiteName ?? baseUri.Host;

        return new RecipeMetadata(
            Title: TruncateString(title, 500),
            Description: TruncateString(description, 500),
            ImageUrl: TruncateString(image, 2000),
            SiteName: TruncateString(siteName, 256)
        );
    }

    private string? ExtractMetaContent(IEnumerable<IElement> metaTags, string property)
    {
        foreach (var meta in metaTags)
        {
            var propertyValue = meta.GetAttribute("property");
            var nameValue = meta.GetAttribute("name");

            if (string.Equals(propertyValue, property, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(nameValue, property, StringComparison.OrdinalIgnoreCase))
            {
                var content = meta.GetAttribute("content");
                if (!string.IsNullOrWhiteSpace(content))
                {
                    return DecodeHtml(content);
                }
            }
        }

        return null;
    }

    private string? ExtractTitle(IHtmlDocument document)
    {
        if (!string.IsNullOrWhiteSpace(document.Title))
        {
            return DecodeHtml(document.Title);
        }

        var titleElement = document.QuerySelector("title");
        var content = titleElement?.TextContent;
        return string.IsNullOrWhiteSpace(content) ? null : DecodeHtml(content);
    }

    private string? DecodeHtml(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        return WebUtility.HtmlDecode(text)?.Trim();
    }

    private string? TruncateString(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= maxLength ? value : value.Substring(0, maxLength);
    }
}
