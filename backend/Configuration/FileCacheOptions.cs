namespace RecipeManager.Api.Configuration;

/// <summary>
/// Configuration options for the file cache service
/// </summary>
public class FileCacheOptions
{
    /// <summary>
    /// Maximum total cache size in bytes (default: 100MB)
    /// </summary>
    public long MaxCacheSizeBytes { get; set; } = 100 * 1024 * 1024;

    /// <summary>
    /// Maximum single file size in bytes (default: 10MB)
    /// </summary>
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

    /// <summary>
    /// Default expiration time in minutes (default: 15 minutes)
    /// </summary>
    public int DefaultExpirationMinutes { get; set; } = 15;
}
