namespace RecipeManager.Api.Services;

/// <summary>
/// In-memory implementation of file cache service for temporarily storing uploaded files
/// </summary>
public class FileCacheService : IFileCacheService
{
    private readonly Dictionary<string, (byte[] content, string contentType)> _cache = new();
    private readonly ILogger<FileCacheService> _logger;

    public FileCacheService(ILogger<FileCacheService> logger)
    {
        _logger = logger;
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

        _cache[key] = (content, contentType);
        _logger.LogDebug("Added file to cache with key: {Key}, size: {Size} bytes", key, content.Length);
    }

    public bool TryGetFromCache(string key, out byte[] content, out string contentType)
    {
        if (string.IsNullOrEmpty(key))
        {
            content = Array.Empty<byte>();
            contentType = string.Empty;
            return false;
        }

        if (_cache.TryGetValue(key, out var cachedData))
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

        if (_cache.Remove(key))
        {
            _logger.LogDebug("Removed file from cache with key: {Key}", key);
        }
    }

    public bool ContainsKey(string key)
    {
        if (string.IsNullOrEmpty(key))
        {
            return false;
        }

        return _cache.ContainsKey(key);
    }

    public void Clear()
    {
        var count = _cache.Count;
        _cache.Clear();
        _logger.LogInformation("Cleared file cache, removed {Count} items", count);
    }
}
