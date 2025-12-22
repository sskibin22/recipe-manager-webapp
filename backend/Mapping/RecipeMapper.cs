using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Mapping;

public class RecipeMapper
{
    private readonly IStorageService _storageService;
    private readonly ILogger<RecipeMapper> _logger;

    public RecipeMapper(IStorageService storageService, ILogger<RecipeMapper> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    /// <summary>
    /// Maps a Recipe entity to a RecipeResponse DTO.
    /// </summary>
    /// <param name="recipe">The recipe entity to map</param>
    /// <param name="currentUserId">The ID of the current user to check favorite status</param>
    public async Task<RecipeResponse> MapToRecipeResponseAsync(Recipe recipe, Guid currentUserId)
    {
        // Convert FileContent to base64 for document recipes
        string? fileContentBase64 = null;
        if (recipe.Type == RecipeType.Document && recipe.FileContent != null)
        {
            fileContentBase64 = Convert.ToBase64String(recipe.FileContent);
        }

        // Convert PreviewImageContent to base64 data URL or presigned URL
        var previewImageUrl = await GetPreviewImageUrlAsync(recipe);

        return new RecipeResponse(
            Id: recipe.Id,
            Title: recipe.Title,
            Type: recipe.Type,
            Url: recipe.Url,
            StorageKey: recipe.StorageKey,
            Content: recipe.Content,
            PreviewImageUrl: previewImageUrl,
            Description: recipe.Description,
            SiteName: recipe.SiteName,
            CreatedAt: recipe.CreatedAt,
            UpdatedAt: recipe.UpdatedAt,
            FileContent: fileContentBase64,
            FileContentType: recipe.FileContentType,
            IsFavorite: recipe.Favorites?.Any(f => f.UserId == currentUserId) ?? false,
            Category: recipe.Category != null 
                ? new CategoryResponse(recipe.Category.Id, recipe.Category.Name, recipe.Category.Color)
                : null,
            Tags: recipe.RecipeTags?
                .Where(rt => rt.Tag != null)
                .Select(rt => new TagResponse(rt.Tag.Id, rt.Tag.Name, rt.Tag.Color, rt.Tag.Type))
                .ToList() ?? new List<TagResponse>()
        );
    }

    /// <summary>
    /// Maps a list of Recipe entities to RecipeResponse DTOs efficiently using Task.WhenAll.
    /// </summary>
    /// <param name="recipes">The list of recipes to map</param>
    /// <param name="currentUserId">The ID of the current user to check favorite status</param>
    public async Task<List<RecipeResponse>> MapToRecipeResponseListAsync(List<Recipe> recipes, Guid currentUserId)
    {
        var responseTasks = recipes.Select(r => MapToRecipeResponseAsync(r, currentUserId));
        return (await Task.WhenAll(responseTasks)).ToList();
    }

    /// <summary>
    /// Maps a Recipe entity to a RecipeListItemResponse DTO (used for list views).
    /// </summary>
    /// <param name="recipe">The recipe entity to map</param>
    /// <param name="currentUserId">The ID of the current user to check favorite status</param>
    public async Task<RecipeListItemResponse> MapToRecipeListItemResponseAsync(Recipe recipe, Guid currentUserId)
    {
        // Get preview image URL
        var previewImageUrl = await GetPreviewImageUrlAsync(recipe);

        return new RecipeListItemResponse(
            Id: recipe.Id,
            Title: recipe.Title,
            Type: recipe.Type,
            Url: recipe.Url,
            StorageKey: recipe.StorageKey,
            Content: recipe.Content,
            PreviewImageUrl: previewImageUrl,
            Description: recipe.Description,
            SiteName: recipe.SiteName,
            CreatedAt: recipe.CreatedAt,
            UpdatedAt: recipe.UpdatedAt,
            FileContentType: recipe.FileContentType,
            IsFavorite: recipe.Favorites?.Any(f => f.UserId == currentUserId) ?? false,
            Category: recipe.Category != null 
                ? new CategoryResponse(recipe.Category.Id, recipe.Category.Name, recipe.Category.Color)
                : null,
            Tags: recipe.RecipeTags?
                .Where(rt => rt.Tag != null)
                .Select(rt => new TagResponse(rt.Tag.Id, rt.Tag.Name, rt.Tag.Color, rt.Tag.Type))
                .ToList() ?? new List<TagResponse>()
        );
    }

    /// <summary>
    /// Gets the preview image URL for a recipe.
    /// If stored in database as binary, converts to base64 data URL.
    /// If storage key, generates presigned URL.
    /// If external URL, returns as-is.
    /// </summary>
    private async Task<string?> GetPreviewImageUrlAsync(Recipe recipe)
    {
        // If stored in database as binary, convert to base64 data URL
        if (recipe.PreviewImageContent != null && !string.IsNullOrEmpty(recipe.PreviewImageContentType))
        {
            var base64Image = Convert.ToBase64String(recipe.PreviewImageContent);
            return $"data:{recipe.PreviewImageContentType};base64,{base64Image}";
        }

        // If storage key, generate presigned URL
        if (!string.IsNullOrEmpty(recipe.PreviewImageUrl) 
            && !recipe.PreviewImageUrl.StartsWith("http://") 
            && !recipe.PreviewImageUrl.StartsWith("https://"))
        {
            try
            {
                return await _storageService.GetPresignedDownloadUrlAsync(recipe.PreviewImageUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate presigned URL for preview image: {StorageKey}", 
                    recipe.PreviewImageUrl);
                return null;
            }
        }

        // External URL - return as-is
        return recipe.PreviewImageUrl;
    }
}
