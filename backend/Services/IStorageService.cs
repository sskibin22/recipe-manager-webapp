namespace RecipeManager.Api.Services;

public interface IStorageService
{
    Task<string> GetPresignedUploadUrlAsync(string key, string contentType);
    Task<string> GetPresignedDownloadUrlAsync(string key);
    
    /// <summary>
    /// Converts storage keys to presigned URLs with error handling.
    /// If PreviewImageUrl is a storage key (not an external URL), generates presigned download URL.
    /// </summary>
    /// <param name="previewImageUrl">The preview image URL or storage key.</param>
    /// <returns>A presigned URL for storage keys, or the original URL for external URLs.</returns>
    Task<string?> GetPreviewImageUrlAsync(string? previewImageUrl);
}
