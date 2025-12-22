using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Mapping;

public class CollectionMapper
{
    private readonly IStorageService _storageService;

    public CollectionMapper(IStorageService storageService)
    {
        _storageService = storageService;
    }

    /// <summary>
    /// Maps a Collection entity to a CollectionResponse DTO
    /// </summary>
    public async Task<CollectionResponse> ToResponseAsync(Collection collection)
    {
        var imageUrl = await GetPreviewImageUrlAsync(collection);

        return new CollectionResponse
        {
            Id = collection.Id,
            UserId = collection.UserId,
            Name = collection.Name,
            Description = collection.Description,
            ImageStorageKey = collection.ImageStorageKey,
            ImageUrl = imageUrl,
            CreatedAt = collection.CreatedAt,
            UpdatedAt = collection.UpdatedAt,
            RecipeCount = collection.CollectionRecipes?.Count ?? 0
        };
    }

    /// <summary>
    /// Gets the preview image URL for a collection.
    /// If stored in database as binary, converts to base64 data URL.
    /// If storage key, generates presigned URL.
    /// </summary>
    private async Task<string?> GetPreviewImageUrlAsync(Collection collection)
    {
        // If stored in database as binary, convert to base64 data URL
        if (collection.PreviewImageContent != null && !string.IsNullOrEmpty(collection.PreviewImageContentType))
        {
            var base64Image = Convert.ToBase64String(collection.PreviewImageContent);
            return $"data:{collection.PreviewImageContentType};base64,{base64Image}";
        }

        // If storage key, generate presigned URL
        if (!string.IsNullOrEmpty(collection.ImageStorageKey))
        {
            try
            {
                return await _storageService.GetPresignedDownloadUrlAsync(collection.ImageStorageKey);
            }
            catch
            {
                // If presigned URL generation fails, leave imageUrl as null
                return null;
            }
        }

        return null;
    }
}
