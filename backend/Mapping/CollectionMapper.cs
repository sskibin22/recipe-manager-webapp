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
        string? imageUrl = null;
        if (!string.IsNullOrEmpty(collection.ImageStorageKey))
        {
            try
            {
                imageUrl = await _storageService.GetPresignedDownloadUrlAsync(collection.ImageStorageKey);
            }
            catch
            {
                // If presigned URL generation fails, leave imageUrl as null
                imageUrl = null;
            }
        }

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
}
