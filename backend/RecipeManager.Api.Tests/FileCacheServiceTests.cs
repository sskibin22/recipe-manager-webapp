using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Tests;

[TestFixture]
public class FileCacheServiceTests
{
    private Mock<ILogger<FileCacheService>> _mockLogger = null!;
    private FileCacheService _service = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<FileCacheService>>();
        _service = new FileCacheService(_mockLogger.Object);
    }

    [Test]
    public void AddToCache_ValidData_StoresFileInCache()
    {
        // Arrange
        var key = "test-key";
        var content = new byte[] { 1, 2, 3, 4, 5 };
        var contentType = "application/pdf";

        // Act
        _service.AddToCache(key, content, contentType);

        // Assert
        _service.ContainsKey(key).Should().BeTrue();
    }

    [Test]
    public void AddToCache_NullKey_ThrowsArgumentException()
    {
        // Arrange
        var content = new byte[] { 1, 2, 3 };
        var contentType = "application/pdf";

        // Act & Assert
        var act = () => _service.AddToCache(null!, content, contentType);
        act.Should().Throw<ArgumentException>()
            .WithParameterName("key");
    }

    [Test]
    public void AddToCache_EmptyKey_ThrowsArgumentException()
    {
        // Arrange
        var content = new byte[] { 1, 2, 3 };
        var contentType = "application/pdf";

        // Act & Assert
        var act = () => _service.AddToCache(string.Empty, content, contentType);
        act.Should().Throw<ArgumentException>()
            .WithParameterName("key");
    }

    [Test]
    public void AddToCache_NullContent_ThrowsArgumentException()
    {
        // Arrange
        var key = "test-key";
        var contentType = "application/pdf";

        // Act & Assert
        var act = () => _service.AddToCache(key, null!, contentType);
        act.Should().Throw<ArgumentException>()
            .WithParameterName("content");
    }

    [Test]
    public void AddToCache_EmptyContent_ThrowsArgumentException()
    {
        // Arrange
        var key = "test-key";
        var content = Array.Empty<byte>();
        var contentType = "application/pdf";

        // Act & Assert
        var act = () => _service.AddToCache(key, content, contentType);
        act.Should().Throw<ArgumentException>()
            .WithParameterName("content");
    }

    [Test]
    public void AddToCache_NullContentType_ThrowsArgumentException()
    {
        // Arrange
        var key = "test-key";
        var content = new byte[] { 1, 2, 3 };

        // Act & Assert
        var act = () => _service.AddToCache(key, content, null!);
        act.Should().Throw<ArgumentException>()
            .WithParameterName("contentType");
    }

    [Test]
    public void AddToCache_EmptyContentType_ThrowsArgumentException()
    {
        // Arrange
        var key = "test-key";
        var content = new byte[] { 1, 2, 3 };

        // Act & Assert
        var act = () => _service.AddToCache(key, content, string.Empty);
        act.Should().Throw<ArgumentException>()
            .WithParameterName("contentType");
    }

    [Test]
    public void TryGetFromCache_ExistingKey_ReturnsTrue()
    {
        // Arrange
        var key = "test-key";
        var expectedContent = new byte[] { 1, 2, 3, 4, 5 };
        var expectedContentType = "application/pdf";
        _service.AddToCache(key, expectedContent, expectedContentType);

        // Act
        var result = _service.TryGetFromCache(key, out var content, out var contentType);

        // Assert
        result.Should().BeTrue();
        content.Should().Equal(expectedContent);
        contentType.Should().Be(expectedContentType);
    }

    [Test]
    public void TryGetFromCache_NonExistingKey_ReturnsFalse()
    {
        // Arrange
        var key = "non-existing-key";

        // Act
        var result = _service.TryGetFromCache(key, out var content, out var contentType);

        // Assert
        result.Should().BeFalse();
        content.Should().BeEmpty();
        contentType.Should().BeEmpty();
    }

    [Test]
    public void TryGetFromCache_NullKey_ReturnsFalse()
    {
        // Act
        var result = _service.TryGetFromCache(null!, out var content, out var contentType);

        // Assert
        result.Should().BeFalse();
        content.Should().BeEmpty();
        contentType.Should().BeEmpty();
    }

    [Test]
    public void TryGetFromCache_EmptyKey_ReturnsFalse()
    {
        // Act
        var result = _service.TryGetFromCache(string.Empty, out var content, out var contentType);

        // Assert
        result.Should().BeFalse();
        content.Should().BeEmpty();
        contentType.Should().BeEmpty();
    }

    [Test]
    public void RemoveFromCache_ExistingKey_RemovesFile()
    {
        // Arrange
        var key = "test-key";
        var content = new byte[] { 1, 2, 3 };
        var contentType = "application/pdf";
        _service.AddToCache(key, content, contentType);

        // Act
        _service.RemoveFromCache(key);

        // Assert
        _service.ContainsKey(key).Should().BeFalse();
    }

    [Test]
    public void RemoveFromCache_NonExistingKey_DoesNothing()
    {
        // Arrange
        var key = "non-existing-key";

        // Act
        var act = () => _service.RemoveFromCache(key);

        // Assert
        act.Should().NotThrow();
    }

    [Test]
    public void RemoveFromCache_NullKey_DoesNothing()
    {
        // Act
        var act = () => _service.RemoveFromCache(null!);

        // Assert
        act.Should().NotThrow();
    }

    [Test]
    public void ContainsKey_ExistingKey_ReturnsTrue()
    {
        // Arrange
        var key = "test-key";
        var content = new byte[] { 1, 2, 3 };
        var contentType = "application/pdf";
        _service.AddToCache(key, content, contentType);

        // Act
        var result = _service.ContainsKey(key);

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ContainsKey_NonExistingKey_ReturnsFalse()
    {
        // Arrange
        var key = "non-existing-key";

        // Act
        var result = _service.ContainsKey(key);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void ContainsKey_NullKey_ReturnsFalse()
    {
        // Act
        var result = _service.ContainsKey(null!);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void Clear_WithMultipleItems_RemovesAllItems()
    {
        // Arrange
        _service.AddToCache("key1", new byte[] { 1, 2, 3 }, "application/pdf");
        _service.AddToCache("key2", new byte[] { 4, 5, 6 }, "image/jpeg");
        _service.AddToCache("key3", new byte[] { 7, 8, 9 }, "text/plain");

        // Act
        _service.Clear();

        // Assert
        _service.ContainsKey("key1").Should().BeFalse();
        _service.ContainsKey("key2").Should().BeFalse();
        _service.ContainsKey("key3").Should().BeFalse();
    }

    [Test]
    public void Clear_EmptyCache_DoesNothing()
    {
        // Act
        var act = () => _service.Clear();

        // Assert
        act.Should().NotThrow();
    }

    [Test]
    public void AddToCache_DuplicateKey_OverwritesExistingValue()
    {
        // Arrange
        var key = "test-key";
        var firstContent = new byte[] { 1, 2, 3 };
        var secondContent = new byte[] { 4, 5, 6 };
        var contentType = "application/pdf";

        // Act
        _service.AddToCache(key, firstContent, contentType);
        _service.AddToCache(key, secondContent, contentType);

        // Assert
        _service.TryGetFromCache(key, out var content, out _);
        content.Should().Equal(secondContent);
    }
}
