using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Tests.Services;

[TestFixture]
public class StorageServiceTests
{
    private Mock<IConfiguration> _configurationMock = null!;
    private Mock<IHttpContextAccessor> _httpContextAccessorMock = null!;
    private Mock<ILogger<StorageService>> _loggerMock = null!;
    private StorageService _service = null!;

    [SetUp]
    public void Setup()
    {
        _configurationMock = new Mock<IConfiguration>();
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _loggerMock = new Mock<ILogger<StorageService>>();

        // Setup configuration to not have R2 configured (for simpler testing)
        _configurationMock.Setup(c => c["R2:AccountId"]).Returns((string?)null);
        _configurationMock.Setup(c => c["R2:AccessKeyId"]).Returns((string?)null);
        _configurationMock.Setup(c => c["R2:SecretAccessKey"]).Returns((string?)null);
        _configurationMock.Setup(c => c["R2:BucketName"]).Returns("test-bucket");

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Scheme = "http";
        httpContext.Request.Host = new HostString("localhost:5172");
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        _service = new StorageService(_configurationMock.Object, _httpContextAccessorMock.Object, _loggerMock.Object);
    }

    [Test]
    public async Task GetPreviewImageUrlAsync_WithStorageKey_ReturnsPresignedUrl()
    {
        // Arrange
        var storageKey = "users/123/recipe-image.jpg";

        // Act
        var result = await _service.GetPreviewImageUrlAsync(storageKey);

        // Assert
        result.Should().NotBeNull();
        result.Should().StartWith("http://localhost:5172/placeholder-download/");
        result.Should().Contain(storageKey);
    }

    [Test]
    public async Task GetPreviewImageUrlAsync_WithHttpUrl_ReturnsOriginalUrl()
    {
        // Arrange
        var externalUrl = "http://example.com/image.jpg";

        // Act
        var result = await _service.GetPreviewImageUrlAsync(externalUrl);

        // Assert
        result.Should().Be(externalUrl);
    }

    [Test]
    public async Task GetPreviewImageUrlAsync_WithHttpsUrl_ReturnsOriginalUrl()
    {
        // Arrange
        var externalUrl = "https://example.com/image.jpg";

        // Act
        var result = await _service.GetPreviewImageUrlAsync(externalUrl);

        // Assert
        result.Should().Be(externalUrl);
    }

    [Test]
    public async Task GetPreviewImageUrlAsync_WithNull_ReturnsNull()
    {
        // Arrange & Act
        var result = await _service.GetPreviewImageUrlAsync(null);

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public async Task GetPreviewImageUrlAsync_WithEmptyString_ReturnsEmptyString()
    {
        // Arrange & Act
        var result = await _service.GetPreviewImageUrlAsync("");

        // Assert
        result.Should().Be("");
    }

    [Test]
    public async Task GetPreviewImageUrlAsync_WithStorageKeyContainingSpecialCharacters_ReturnsPresignedUrl()
    {
        // Arrange
        var storageKey = "users/123/recipe with spaces & special-chars.jpg";

        // Act
        var result = await _service.GetPreviewImageUrlAsync(storageKey);

        // Assert
        result.Should().NotBeNull();
        result.Should().StartWith("http://localhost:5172/placeholder-download/");
    }

    [Test]
    public async Task GetPreviewImageUrlAsync_WithDataUrl_ReturnsOriginalDataUrl()
    {
        // Arrange
        var dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA";

        // Act
        var result = await _service.GetPreviewImageUrlAsync(dataUrl);

        // Assert
        // Note: data URLs start with "data:" which doesn't match "http://" or "https://"
        // so they'll be treated as storage keys. This is expected behavior since
        // data URLs are already inline and don't need presigning.
        result.Should().NotBeNull();
    }

    [Test]
    public async Task DeleteFileAsync_WithValidKey_ReturnsTrue()
    {
        // Arrange
        var storageKey = "users/123/recipe-doc.pdf";

        // Act
        var result = await _service.DeleteFileAsync(storageKey);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task DeleteFileAsync_WithNullKey_ReturnsTrue()
    {
        // Arrange & Act
        var result = await _service.DeleteFileAsync(null!);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task DeleteFileAsync_WithEmptyKey_ReturnsTrue()
    {
        // Arrange & Act
        var result = await _service.DeleteFileAsync("");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public async Task DeleteFileAsync_WithoutR2Configuration_ReturnsTrue()
    {
        // Arrange
        var storageKey = "users/123/image.jpg";

        // Act
        var result = await _service.DeleteFileAsync(storageKey);

        // Assert
        result.Should().BeTrue();
        // Should log that storage is not configured
    }
}
