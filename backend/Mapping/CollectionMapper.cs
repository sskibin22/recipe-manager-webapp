using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Mapping;

/// <summary>
/// Maps Collection entities to CollectionResponse DTOs.
/// This service is registered as Scoped to match the lifetime of its dependencies.
/// </summary>
/// <remarks>
/// Service Lifetime Decision: SCOPED
/// - Depends on IStorageService (Scoped) for generating presigned URLs
/// - Depends on ApplicationDbContext (Scoped) for database queries
/// - No per-request state accumulation (effectively stateless within request scope)
/// - Used by Scoped services (CollectionService)
/// 
/// Alternative Considered: Static extension methods with dependencies as parameters
/// - Rejected: Would increase complexity significantly due to database context dependency
/// - Current approach maintains clean separation of concerns and standard DI patterns
/// - Performance difference between Scoped and Singleton is negligible for these operations
/// </remarks>
public class CollectionMapper
{
    private readonly IStorageService _storageService;
    private readonly ApplicationDbContext _db;

    public CollectionMapper(IStorageService storageService, ApplicationDbContext db)
    {
        _storageService = storageService;
        _db = db;
    }

    /// <summary>
    /// Maps a Collection entity to a CollectionResponse DTO
    /// </summary>
    public async Task<CollectionResponse> ToResponseAsync(Collection collection)
    {
        var imageUrl = await GetPreviewImageUrlAsync(collection);
        var recipePreviewImages = await GetRecipePreviewImagesAsync(collection.Id);

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
            RecipeCount = collection.CollectionRecipes?.Count ?? 0,
            RecipePreviewImages = recipePreviewImages
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

    /// <summary>
    /// Gets up to 10 recipe preview image URLs from recipes in the collection.
    /// Used for auto-rotating thumbnail display when no custom collection image is uploaded.
    /// </summary>
    private async Task<List<string>> GetRecipePreviewImagesAsync(Guid collectionId)
    {
        var recipeImages = await _db.CollectionRecipes
            .Where(cr => cr.CollectionId == collectionId)
            .Include(cr => cr.Recipe)
            .OrderBy(cr => cr.AddedAt) // Consistent ordering
            .Take(10) // Limit to first 10 for performance
            .Select(cr => cr.Recipe)
            .ToListAsync();

        var imageUrls = new List<string>();

        foreach (var recipe in recipeImages)
        {
            var imageUrl = await GetRecipePreviewImageUrlAsync(recipe);
            if (!string.IsNullOrEmpty(imageUrl))
            {
                imageUrls.Add(imageUrl);
            }
        }

        return imageUrls;
    }

    /// <summary>
    /// Gets the preview image URL for a recipe.
    /// </summary>
    private async Task<string?> GetRecipePreviewImageUrlAsync(Recipe recipe)
    {
        // If stored in database as binary, convert to base64 data URL
        if (recipe.PreviewImageContent != null && !string.IsNullOrEmpty(recipe.PreviewImageContentType))
        {
            var base64Image = Convert.ToBase64String(recipe.PreviewImageContent);
            return $"data:{recipe.PreviewImageContentType};base64,{base64Image}";
        }

        // If external URL, return it directly
        if (!string.IsNullOrEmpty(recipe.PreviewImageUrl))
        {
            return recipe.PreviewImageUrl;
        }

        return null;
    }
}
