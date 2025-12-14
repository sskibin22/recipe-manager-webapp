namespace RecipeManager.Api.Services;

public interface IStorageService
{
    Task<string> GetPresignedUploadUrlAsync(string key, string contentType);
    Task<string> GetPresignedDownloadUrlAsync(string key);
}
