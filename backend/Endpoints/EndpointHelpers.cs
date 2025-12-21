using System.Security.Claims;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class EndpointHelpers
{
    /// <summary>
    /// Gets the user ID from the ClaimsPrincipal.
    /// </summary>
    public static Guid? GetUserId(ClaimsPrincipal user)
    {
        // Check for the db_user_id claim added by middleware
        var dbUserIdClaim = user.FindFirst("db_user_id");
        if (dbUserIdClaim != null && Guid.TryParse(dbUserIdClaim.Value, out var userId))
        {
            return userId;
        }

        return null;
    }

    /// <summary>
    /// Converts storage keys to presigned URLs with error handling.
    /// If PreviewImageUrl is a storage key (not an external URL), generates presigned download URL.
    /// </summary>
    public static async Task<string?> GetPreviewImageUrlAsync(string? previewImageUrl, IStorageService storageService, ILogger logger)
    {
        if (!string.IsNullOrEmpty(previewImageUrl) && !previewImageUrl.StartsWith("http://") && !previewImageUrl.StartsWith("https://"))
        {
            try
            {
                return await storageService.GetPresignedDownloadUrlAsync(previewImageUrl);
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the request - placeholder will be shown
                logger.LogWarning(ex, "Failed to generate presigned download URL for preview image: {StorageKey}", previewImageUrl);
                return null;
            }
        }

        return previewImageUrl;
    }
}
