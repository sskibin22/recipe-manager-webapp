namespace RecipeManager.Api.Services;

/// <summary>
/// Service for caching uploaded file content temporarily before it is saved to the database
/// </summary>
public interface IFileCacheService
{
    /// <summary>
    /// Add file content to cache with the specified key
    /// </summary>
    void AddToCache(string key, byte[] content, string contentType);

    /// <summary>
    /// Try to retrieve file content from cache
    /// </summary>
    bool TryGetFromCache(string key, out byte[] content, out string contentType);

    /// <summary>
    /// Remove file content from cache
    /// </summary>
    void RemoveFromCache(string key);

    /// <summary>
    /// Check if key exists in cache
    /// </summary>
    bool ContainsKey(string key);

    /// <summary>
    /// Clear all cached files (useful for cleanup)
    /// </summary>
    void Clear();
}
