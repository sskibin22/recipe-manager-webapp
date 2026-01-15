using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Queries;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Mapping;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Services;

/// <summary>
/// Service for recipe business logic operations
/// </summary>
public class RecipeService : IRecipeService
{
    private readonly ApplicationDbContext _db;
    private readonly IFileCacheService _fileCache;
    private readonly RecipeMapper _mapper;
    private readonly ILogger<RecipeService> _logger;

    public RecipeService(
        ApplicationDbContext db,
        IFileCacheService fileCache,
        RecipeMapper mapper,
        ILogger<RecipeService> logger)
    {
        _db = db;
        _fileCache = fileCache;
        _mapper = mapper;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<RecipeResponse> CreateRecipeAsync(CreateRecipeRequest request, Guid userId)
    {
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title,
            Type = request.Type,
            Url = request.Url,
            StorageKey = request.StorageKey,
            Content = request.Content,
            PreviewImageUrl = request.PreviewImageUrl,
            Description = request.Description,
            SiteName = request.SiteName,
            CategoryId = request.CategoryId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // If this is a document upload and the file is in the cache, save it to the database
        if (request.Type == RecipeType.Document && !string.IsNullOrEmpty(request.StorageKey))
        {
            if (_fileCache.TryGetFromCache(request.StorageKey, out var fileContent, out var fileContentType))
            {
                recipe.FileContent = fileContent;
                recipe.FileContentType = fileContentType;
                // Remove from cache after saving
                _fileCache.RemoveFromCache(request.StorageKey);
            }
        }

        // If preview image URL is provided and the file is in the cache, save it to the database
        if (!string.IsNullOrEmpty(request.PreviewImageUrl))
        {
            if (_fileCache.TryGetFromCache(request.PreviewImageUrl, out var imageContent, out var imageContentType))
            {
                recipe.PreviewImageContent = imageContent;
                recipe.PreviewImageContentType = imageContentType;
                // Remove from cache after saving
                _fileCache.RemoveFromCache(request.PreviewImageUrl);
            }
        }

        _db.Recipes.Add(recipe);

        // Add tags if provided
        if (request.TagIds != null && request.TagIds.Count > 0)
        {
            foreach (var tagId in request.TagIds)
            {
                var recipeTag = new RecipeTag
                {
                    RecipeId = recipe.Id,
                    TagId = tagId
                };
                _db.RecipeTags.Add(recipeTag);
            }
        }

        await _db.SaveChangesAsync();

        // Load category and tags for response
        await _db.Entry(recipe).Reference(r => r.Category).LoadAsync();
        await _db.Entry(recipe).Collection(r => r.RecipeTags).Query().Include(rt => rt.Tag).LoadAsync();

        return await _mapper.MapToRecipeResponseAsync(recipe, userId);
    }

    /// <inheritdoc />
    public async Task<RecipeResponse?> UpdateRecipeAsync(Guid id, UpdateRecipeRequest request, Guid userId)
    {
        var recipe = await _db.Recipes
            .Include(r => r.Favorites)
            .Include(r => r.RecipeTags)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (recipe == null)
        {
            return null;
        }

        recipe.Title = request.Title;
        recipe.Type = request.Type;
        recipe.Url = request.Url;
        recipe.Content = request.Content;
        recipe.PreviewImageUrl = request.PreviewImageUrl;
        recipe.Description = request.Description;
        recipe.SiteName = request.SiteName;
        recipe.CategoryId = request.CategoryId;
        recipe.UpdatedAt = DateTime.UtcNow;

        // Handle document replacement if a new storage key is provided
        if (!string.IsNullOrEmpty(request.StorageKey))
        {
            recipe.StorageKey = request.StorageKey;

            // If this is a document upload and the file is in the cache, save it to the database
            if (request.Type == RecipeType.Document && _fileCache.TryGetFromCache(request.StorageKey, out var fileContent, out var fileContentType))
            {
                recipe.FileContent = fileContent;
                recipe.FileContentType = fileContentType;
                // Remove from cache after saving
                _fileCache.RemoveFromCache(request.StorageKey);
            }
        }

        // Handle preview image update
        if (!string.IsNullOrEmpty(request.PreviewImageUrl))
        {
            // If the preview image is in the cache, save it to the database
            if (_fileCache.TryGetFromCache(request.PreviewImageUrl, out var imageContent, out var imageContentType))
            {
                recipe.PreviewImageContent = imageContent;
                recipe.PreviewImageContentType = imageContentType;
                // Remove from cache after saving
                _fileCache.RemoveFromCache(request.PreviewImageUrl);
            }
        }

        // Update tags
        if (request.TagIds != null)
        {
            // Remove existing tags
            _db.RecipeTags.RemoveRange(recipe.RecipeTags);

            // Add new tags
            foreach (var tagId in request.TagIds)
            {
                var recipeTag = new RecipeTag
                {
                    RecipeId = recipe.Id,
                    TagId = tagId
                };
                _db.RecipeTags.Add(recipeTag);
            }
        }

        await _db.SaveChangesAsync();

        // Load category and tags for response
        await _db.Entry(recipe).Reference(r => r.Category).LoadAsync();
        await _db.Entry(recipe).Collection(r => r.RecipeTags).Query().Include(rt => rt.Tag).LoadAsync();

        return await _mapper.MapToRecipeResponseAsync(recipe, userId);
    }

    /// <inheritdoc />
    public async Task<RecipeResponse?> GetRecipeAsync(Guid id, Guid userId)
    {
        var recipe = await _db.Recipes
            .Include(r => r.Favorites)
            .Include(r => r.Category)
            .Include(r => r.RecipeTags)
                .ThenInclude(rt => rt.Tag)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

        if (recipe == null)
        {
            return null;
        }

        return await _mapper.MapToRecipeResponseAsync(recipe, userId);
    }

    /// <inheritdoc />
    public async Task<List<RecipeResponse>> GetRecipesAsync(RecipeQueryParameters queryParams, Guid userId)
    {
        var query = _db.Recipes
            .Include(r => r.Favorites)
            .Include(r => r.Category)
            .Include(r => r.RecipeTags)
                .ThenInclude(rt => rt.Tag)
            .Where(r => r.UserId == userId);

        // Apply favorites filter
        if (queryParams.FavoritesOnly)
        {
            query = query.Where(r => r.Favorites.Any(f => f.UserId == userId));
        }

        // Apply search filter (case-insensitive)
        if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
        {
            var searchTerm = EscapeLikePattern(queryParams.SearchTerm.ToLower());
            query = query.Where(r => EF.Functions.Like(r.Title.ToLower(), $"%{searchTerm}%"));
        }

        // Apply category filter
        if (queryParams.CategoryId.HasValue)
        {
            query = query.Where(r => r.CategoryId == queryParams.CategoryId.Value);
        }

        // Apply tag filter
        var tagIds = queryParams.GetTagIds();
        if (tagIds.Count > 0)
        {
            // Filter recipes that have ALL specified tags by chaining Where clauses
            foreach (var tagId in tagIds)
            {
                query = query.Where(r => r.RecipeTags.Any(rt => rt.TagId == tagId));
            }
        }

        // Apply exclude collection filter
        if (queryParams.ExcludeCollectionId.HasValue)
        {
            var recipesInCollection = _db.CollectionRecipes
                .Where(cr => cr.CollectionId == queryParams.ExcludeCollectionId.Value)
                .Select(cr => cr.RecipeId);
            
            query = query.Where(r => !recipesInCollection.Contains(r.Id));
        }

        var recipes = await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return await _mapper.MapToRecipeResponseListAsync(recipes, userId);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteRecipeAsync(Guid id, Guid userId)
    {
        var recipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);
        
        if (recipe == null)
        {
            return false;
        }

        _db.Recipes.Remove(recipe);
        await _db.SaveChangesAsync();

        return true;
    }

    /// <inheritdoc />
    public async Task<int> DeleteRecipesAsync(List<Guid> recipeIds, Guid userId)
    {
        if (recipeIds == null || recipeIds.Count == 0)
        {
            return 0;
        }

        // Fetch all recipes owned by the user that match the provided IDs
        var recipesToDelete = await _db.Recipes
            .Where(r => recipeIds.Contains(r.Id) && r.UserId == userId)
            .ToListAsync();

        if (recipesToDelete.Count == 0)
        {
            return 0;
        }

        _db.Recipes.RemoveRange(recipesToDelete);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "User {UserId} deleted {Count} recipes",
            userId,
            recipesToDelete.Count);

        return recipesToDelete.Count;
    }

    /// <inheritdoc />
    public async Task<RecipeResponse?> GetRandomRecipeAsync(Guid userId, Guid? collectionId)
    {
        var query = _db.Recipes
            .Include(r => r.Favorites)
            .Include(r => r.Category)
            .Include(r => r.RecipeTags)
                .ThenInclude(rt => rt.Tag)
            .Where(r => r.UserId == userId);

        // Filter by collection if specified
        if (collectionId.HasValue)
        {
            var recipesInCollection = _db.CollectionRecipes
                .Where(cr => cr.CollectionId == collectionId.Value)
                .Select(cr => cr.RecipeId);
            
            query = query.Where(r => recipesInCollection.Contains(r.Id));
        }

        // Get count first to check if there are any recipes
        var totalCount = await query.CountAsync();
        if (totalCount == 0)
        {
            return null;
        }

        // Use random skip to select a random recipe
        // Generate a random index
        var random = new Random();
        var skipCount = random.Next(0, totalCount);

        var recipe = await query
            .OrderBy(r => r.Id) // Order by ID for consistent ordering
            .Skip(skipCount)
            .FirstOrDefaultAsync();

        if (recipe == null)
        {
            return null;
        }

        return await _mapper.MapToRecipeResponseAsync(recipe, userId);
    }

    /// <summary>
    /// Escapes special characters in LIKE pattern to prevent unintended wildcard matching
    /// </summary>
    /// <param name="input">The input string to escape</param>
    /// <returns>Escaped string safe for use in LIKE patterns</returns>
    private static string EscapeLikePattern(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        return input
            .Replace("[", "[[]")  // Escape [ first to avoid double-escaping
            .Replace("%", "[%]")   // Escape % wildcard
            .Replace("_", "[_]");  // Escape _ wildcard
    }
}
