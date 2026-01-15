using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using RecipeManager.Api.Configuration;

namespace RecipeManager.Api.Services;

/// <summary>
/// In-memory implementation of file cache service for temporarily storing uploaded files
/// with size limits and automatic expiration
/// </summary>
public class FileCacheService : IFileCacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<FileCacheService> _logger;
    private readonly FileCacheOptions _options;

    public FileCacheService(
        IMemoryCache cache,
        ILogger<FileCacheService> logger,
        IOptions<FileCacheOptions> options)
    {
        _cache = cache;
        _logger = logger;
        _options = options.Value;
    }

    public void AddToCache(string key, byte[] content, string contentType)
    {
        if (string.IsNullOrEmpty(key))
        {
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));
        }

        if (content == null || content.Length == 0)
        {
            throw new ArgumentException("Content cannot be null or empty", nameof(content));
        }

        if (string.IsNullOrEmpty(contentType))
        {
            throw new ArgumentException("Content type cannot be null or empty", nameof(contentType));
        }

        // Check if file size exceeds maximum allowed
        if (content.Length > _options.MaxFileSizeBytes)
        {
            _logger.LogWarning(
                "File size {Size} bytes exceeds maximum allowed size of {MaxSize} bytes for key: {Key}",
                content.Length,
                _options.MaxFileSizeBytes,
                key);
            throw new InvalidOperationException(
                $"File size {content.Length} bytes exceeds maximum allowed size of {_options.MaxFileSizeBytes} bytes");
        }

        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetSize(content.Length)
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(_options.DefaultExpirationMinutes))
            .RegisterPostEvictionCallback((evictedKey, value, reason, state) =>
            {
                _logger.LogDebug(
                    "Cache entry evicted: {Key}, Reason: {Reason}",
                    evictedKey,
                    reason);
            });

        _cache.Set(key, (content, contentType), cacheEntryOptions);
        _logger.LogDebug(
            "Added file to cache with key: {Key}, size: {Size} bytes, expiration: {Expiration} minutes",
            key,
            content.Length,
            _options.DefaultExpirationMinutes);
    }

    public bool TryGetFromCache(string key, out byte[] content, out string contentType)
    {
        if (string.IsNullOrEmpty(key))
        {
            content = Array.Empty<byte>();
            contentType = string.Empty;
            return false;
        }

        if (_cache.TryGetValue(key, out (byte[] content, string contentType) cachedData))
        {
            content = cachedData.content;
            contentType = cachedData.contentType;
            _logger.LogDebug("Retrieved file from cache with key: {Key}", key);
            return true;
        }

        content = Array.Empty<byte>();
        contentType = string.Empty;
        return false;
    }

    public void RemoveFromCache(string key)
    {
        if (string.IsNullOrEmpty(key))
        {
            return;
        }

        _cache.Remove(key);
        _logger.LogDebug("Removed file from cache with key: {Key}", key);
    }

    public bool ContainsKey(string key)
    {
        if (string.IsNullOrEmpty(key))
        {
            return false;
        }

        return _cache.TryGetValue(key, out _);
    }

    public void Clear()
    {
        // IMemoryCache doesn't provide a Clear() method in its API
        // Entries will expire automatically based on TTL
        _logger.LogWarning("Clear() called on FileCacheService. IMemoryCache does not support clearing all entries. Entries will expire automatically based on TTL.");
    }
}
