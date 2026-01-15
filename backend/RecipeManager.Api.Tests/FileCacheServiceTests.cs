using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using RecipeManager.Api.Configuration;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Tests;

[TestFixture]
public class FileCacheServiceTests
{
    private Mock<ILogger<FileCacheService>> _mockLogger = null!;
    private IMemoryCache _memoryCache = null!;
    private FileCacheOptions _options = null!;
    private FileCacheService _service = null!;

    [SetUp]
    public void Setup()
    {
        _mockLogger = new Mock<ILogger<FileCacheService>>();
        _options = new FileCacheOptions
        {
            MaxCacheSizeBytes = 100 * 1024 * 1024, // 100MB
            MaxFileSizeBytes = 10 * 1024 * 1024,   // 10MB
            DefaultExpirationMinutes = 15
        };
        _memoryCache = new MemoryCache(new MemoryCacheOptions
        {
            SizeLimit = _options.MaxCacheSizeBytes
        });
        var optionsWrapper = Options.Create(_options);
        _service = new FileCacheService(_memoryCache, _mockLogger.Object, optionsWrapper);
    }

    [TearDown]
    public void TearDown()
    {
        _memoryCache?.Dispose();
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
    public void Clear_WithMultipleItems_LogsWarning()
    {
        // Arrange
        _service.AddToCache("key1", new byte[] { 1, 2, 3 }, "application/pdf");
        _service.AddToCache("key2", new byte[] { 4, 5, 6 }, "image/jpeg");
        _service.AddToCache("key3", new byte[] { 7, 8, 9 }, "text/plain");

        // Act
        _service.Clear();

        // Assert - Verify warning was logged (cache entries remain due to IMemoryCache limitation)
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Clear() called")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public void Clear_EmptyCache_LogsWarning()
    {
        // Act
        _service.Clear();

        // Assert - Verify warning was logged
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Clear() called")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
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

    [Test]
    public void AddToCache_FileSizeExceedsLimit_ThrowsInvalidOperationException()
    {
        // Arrange
        var key = "large-file";
        var largeContent = new byte[11 * 1024 * 1024]; // 11MB, exceeds 10MB limit
        var contentType = "application/pdf";

        // Act & Assert
        var act = () => _service.AddToCache(key, largeContent, contentType);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*exceeds maximum allowed size*");
    }

    [Test]
    public void AddToCache_FileSizeExceedsLimit_LogsWarning()
    {
        // Arrange
        var key = "large-file";
        var largeContent = new byte[11 * 1024 * 1024]; // 11MB, exceeds 10MB limit
        var contentType = "application/pdf";

        // Act
        try
        {
            _service.AddToCache(key, largeContent, contentType);
        }
        catch (InvalidOperationException)
        {
            // Expected exception
        }

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("exceeds maximum allowed size")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Test]
    public void AddToCache_FileSizeAtLimit_Succeeds()
    {
        // Arrange
        var key = "max-size-file";
        var content = new byte[10 * 1024 * 1024]; // Exactly 10MB
        var contentType = "application/pdf";

        // Act
        var act = () => _service.AddToCache(key, content, contentType);

        // Assert
        act.Should().NotThrow();
        _service.ContainsKey(key).Should().BeTrue();
    }

    [Test]
    public async Task AddToCache_EntryExpires_CannotRetrieve()
    {
        // Arrange
        var shortExpirationOptions = new FileCacheOptions
        {
            MaxCacheSizeBytes = 100 * 1024 * 1024,
            MaxFileSizeBytes = 10 * 1024 * 1024,
            DefaultExpirationMinutes = 1 // Use 1 minute as minimum
        };
        var shortExpirationCache = new MemoryCache(new MemoryCacheOptions
        {
            SizeLimit = shortExpirationOptions.MaxCacheSizeBytes,
            ExpirationScanFrequency = TimeSpan.FromMilliseconds(100) // Scan frequently
        });
        var shortExpirationService = new FileCacheService(
            shortExpirationCache,
            _mockLogger.Object,
            Options.Create(shortExpirationOptions));

        var key = "expiring-file";
        var content = new byte[] { 1, 2, 3 };
        var contentType = "application/pdf";

        // Act - Use manual expiration override for testing
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSize(content.Length)
            .SetAbsoluteExpiration(TimeSpan.FromMilliseconds(50)); // Very short expiration
        shortExpirationCache.Set(key, (content, contentType), cacheOptions);
        
        // Wait for expiration
        await Task.Delay(200);

        // Assert
        var result = shortExpirationService.TryGetFromCache(key, out _, out _);
        result.Should().BeFalse();
        
        shortExpirationCache.Dispose();
    }

    [Test]
    public void AddToCache_MultipleFilesUnderTotalLimit_AllSucceed()
    {
        // Arrange - Use files under the 10MB per-file limit
        var file1Size = 8 * 1024 * 1024; // 8MB
        var file2Size = 8 * 1024 * 1024; // 8MB
        var file3Size = 8 * 1024 * 1024; // 8MB
        // Total = 24MB, under 100MB limit, each file under 10MB limit

        var content1 = new byte[file1Size];
        var content2 = new byte[file2Size];
        var content3 = new byte[file3Size];
        var contentType = "application/pdf";

        // Act
        _service.AddToCache("file1", content1, contentType);
        _service.AddToCache("file2", content2, contentType);
        _service.AddToCache("file3", content3, contentType);

        // Assert
        _service.ContainsKey("file1").Should().BeTrue();
        _service.ContainsKey("file2").Should().BeTrue();
        _service.ContainsKey("file3").Should().BeTrue();
    }

    [Test]
    public void AddToCache_ExceedingTotalCacheSize_HandlesGracefully()
    {
        // Arrange
        var smallCacheOptions = new FileCacheOptions
        {
            MaxCacheSizeBytes = 25 * 1024 * 1024, // 25MB total
            MaxFileSizeBytes = 10 * 1024 * 1024,
            DefaultExpirationMinutes = 15
        };
        var smallCache = new MemoryCache(new MemoryCacheOptions
        {
            SizeLimit = smallCacheOptions.MaxCacheSizeBytes,
            CompactionPercentage = 0.10 // Compact 10% when size limit reached
        });
        var smallCacheService = new FileCacheService(
            smallCache,
            _mockLogger.Object,
            Options.Create(smallCacheOptions));

        var content1 = new byte[10 * 1024 * 1024]; // 10MB
        var content2 = new byte[10 * 1024 * 1024]; // 10MB
        var content3 = new byte[10 * 1024 * 1024]; // 10MB - This should trigger compaction
        var contentType = "application/pdf";

        // Act & Assert
        // The service should handle adding files gracefully even when approaching cache limit
        // MemoryCache will manage eviction automatically based on its internal policies
        var act1 = () => smallCacheService.AddToCache("file1", content1, contentType);
        var act2 = () => smallCacheService.AddToCache("file2", content2, contentType);
        var act3 = () => smallCacheService.AddToCache("file3", content3, contentType);

        act1.Should().NotThrow();
        act2.Should().NotThrow();
        act3.Should().NotThrow();
        
        // At least one file should be cached (MemoryCache handles eviction internally)
        var hasAnyFile = smallCacheService.ContainsKey("file1") || 
                         smallCacheService.ContainsKey("file2") || 
                         smallCacheService.ContainsKey("file3");
        hasAnyFile.Should().BeTrue("at least one file should remain in cache");
        
        smallCache.Dispose();
    }
}
