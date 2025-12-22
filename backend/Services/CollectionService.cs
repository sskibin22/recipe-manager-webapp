using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Mapping;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Services;

/// <summary>
/// Service for collection business logic operations
/// </summary>
public class CollectionService : ICollectionService
{
    private readonly ApplicationDbContext _db;
    private readonly RecipeMapper _recipeMapper;
    private readonly CollectionMapper _collectionMapper;
    private readonly IStorageService _storageService;
    private readonly ILogger<CollectionService> _logger;

    public CollectionService(
        ApplicationDbContext db,
        RecipeMapper recipeMapper,
        CollectionMapper collectionMapper,
        IStorageService storageService,
        ILogger<CollectionService> logger)
    {
        _db = db;
        _recipeMapper = recipeMapper;
        _collectionMapper = collectionMapper;
        _storageService = storageService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<CollectionResponse>> GetUserCollectionsAsync(Guid userId)
    {
        var collections = await _db.Collections
            .Include(c => c.CollectionRecipes)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        var responseTasks = collections.Select(c => _collectionMapper.ToResponseAsync(c));
        return await Task.WhenAll(responseTasks);
    }

    /// <inheritdoc />
    public async Task<CollectionResponse?> GetCollectionAsync(Guid collectionId, Guid userId)
    {
        var collection = await _db.Collections
            .Include(c => c.CollectionRecipes)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        return collection != null ? await _collectionMapper.ToResponseAsync(collection) : null;
    }

    /// <inheritdoc />
    public async Task<CollectionResponse> CreateCollectionAsync(CreateCollectionRequest request, Guid userId)
    {
        var collection = new Collection
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name,
            Description = request.Description,
            ImageStorageKey = request.ImageStorageKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Handle base64 image data (for SQLite storage in local development)
        if (!string.IsNullOrEmpty(request.PreviewImageData))
        {
            try
            {
                // Parse data URI format: "data:image/png;base64,..."
                var parts = request.PreviewImageData.Split(',');
                if (parts.Length == 2)
                {
                    var contentTypePart = parts[0].Replace("data:", "").Replace(";base64", "");
                    var base64Data = parts[1];
                    
                    collection.PreviewImageContent = Convert.FromBase64String(base64Data);
                    collection.PreviewImageContentType = contentTypePart;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse preview image data for collection");
            }
        }

        _db.Collections.Add(collection);
        await _db.SaveChangesAsync();

        return await _collectionMapper.ToResponseAsync(collection);
    }

    /// <inheritdoc />
    public async Task<CollectionResponse?> UpdateCollectionAsync(Guid collectionId, UpdateCollectionRequest request, Guid userId)
    {
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return null;

        // Store old image key for cleanup
        var oldImageKey = collection.ImageStorageKey;

        collection.Name = request.Name;
        collection.Description = request.Description;
        collection.ImageStorageKey = request.ImageStorageKey;
        collection.UpdatedAt = DateTime.UtcNow;

        // Handle base64 image data (for SQLite storage in local development)
        if (!string.IsNullOrEmpty(request.PreviewImageData))
        {
            try
            {
                // Parse data URI format: "data:image/png;base64,..."
                var parts = request.PreviewImageData.Split(',');
                if (parts.Length == 2)
                {
                    var contentTypePart = parts[0].Replace("data:", "").Replace(";base64", "");
                    var base64Data = parts[1];
                    
                    collection.PreviewImageContent = Convert.FromBase64String(base64Data);
                    collection.PreviewImageContentType = contentTypePart;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse preview image data for collection");
            }
        }

        await _db.SaveChangesAsync();

        // Clean up old image if it was replaced (not null and different from new key)
        if (!string.IsNullOrEmpty(oldImageKey) && oldImageKey != request.ImageStorageKey)
        {
            try
            {
                // Note: R2/S3 doesn't have a delete API in the current implementation
                // The old image will remain in storage but won't be referenced
                // In a production system, implement cleanup via StorageService
                _logger.LogInformation("Collection image replaced. Old key: {OldKey}", oldImageKey);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup old collection image: {Key}", oldImageKey);
            }
        }

        // Reload with recipe count
        await _db.Entry(collection)
            .Collection(c => c.CollectionRecipes)
            .LoadAsync();

        return await _collectionMapper.ToResponseAsync(collection);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteCollectionAsync(Guid collectionId, Guid userId)
    {
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return false;

        // Store image key for cleanup
        var imageKey = collection.ImageStorageKey;

        _db.Collections.Remove(collection);
        await _db.SaveChangesAsync();

        // Clean up collection image
        if (!string.IsNullOrEmpty(imageKey))
        {
            try
            {
                // Note: R2/S3 doesn't have a delete API in the current implementation
                // The image will remain in storage but won't be referenced
                // In a production system, implement cleanup via StorageService
                _logger.LogInformation("Collection deleted. Image key: {Key}", imageKey);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup collection image: {Key}", imageKey);
            }
        }

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> AddRecipeToCollectionAsync(Guid collectionId, Guid recipeId, Guid userId)
    {
        // Verify collection belongs to user
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return false;

        // Verify recipe belongs to user
        var recipe = await _db.Recipes
            .FirstOrDefaultAsync(r => r.Id == recipeId && r.UserId == userId);

        if (recipe == null)
            return false;

        // Check if already in collection
        var exists = await _db.CollectionRecipes
            .AnyAsync(cr => cr.CollectionId == collectionId && cr.RecipeId == recipeId);

        if (exists)
            return true; // Already in collection - idempotent

        var collectionRecipe = new CollectionRecipe
        {
            CollectionId = collectionId,
            RecipeId = recipeId,
            AddedAt = DateTime.UtcNow
        };

        _db.CollectionRecipes.Add(collectionRecipe);

        // Update collection's UpdatedAt
        collection.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> RemoveRecipeFromCollectionAsync(Guid collectionId, Guid recipeId, Guid userId)
    {
        // Verify collection belongs to user
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return false;

        var collectionRecipe = await _db.CollectionRecipes
            .FirstOrDefaultAsync(cr => cr.CollectionId == collectionId && cr.RecipeId == recipeId);

        if (collectionRecipe == null)
            return false;

        _db.CollectionRecipes.Remove(collectionRecipe);

        // Update collection's UpdatedAt
        collection.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return true;
    }

    /// <inheritdoc />
    public async Task<IEnumerable<RecipeListItemResponse>> GetCollectionRecipesAsync(Guid collectionId, Guid userId)
    {
        // Verify collection belongs to user
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return Enumerable.Empty<RecipeListItemResponse>();

        var recipes = await _db.CollectionRecipes
            .Where(cr => cr.CollectionId == collectionId)
            .Include(cr => cr.Recipe)
                .ThenInclude(r => r.Category)
            .Include(cr => cr.Recipe)
                .ThenInclude(r => r.RecipeTags)
                    .ThenInclude(rt => rt.Tag)
            .Include(cr => cr.Recipe)
                .ThenInclude(r => r.Favorites)
            .Include(cr => cr.Recipe)
                .ThenInclude(r => r.CollectionRecipes) // Include to get count
            .Select(cr => cr.Recipe)
            .OrderByDescending(r => r.UpdatedAt)
            .ToListAsync();

        // Map recipes to DTOs in parallel for better performance
        var mappingTasks = recipes.Select(recipe => _recipeMapper.MapToRecipeListItemResponseAsync(recipe, userId));
        var recipeDtos = await Task.WhenAll(mappingTasks);

        return recipeDtos;
    }

    /// <inheritdoc />
    public async Task<bool> AddRecipesToCollectionBatchAsync(Guid collectionId, List<Guid> recipeIds, Guid userId)
    {
        // Verify collection belongs to user
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return false;

        // Verify all recipes belong to user
        var userRecipes = await _db.Recipes
            .Where(r => recipeIds.Contains(r.Id) && r.UserId == userId)
            .Select(r => r.Id)
            .ToListAsync();

        if (userRecipes.Count == 0)
            return false;

        // Get existing recipe IDs in collection to avoid duplicates
        var existingRecipeIds = await _db.CollectionRecipes
            .Where(cr => cr.CollectionId == collectionId)
            .Select(cr => cr.RecipeId)
            .ToListAsync();

        // Filter out recipes already in collection
        var newRecipeIds = userRecipes.Except(existingRecipeIds).ToList();

        if (newRecipeIds.Count == 0)
            return true; // All recipes already in collection - idempotent

        // Create collection recipe entries
        var collectionRecipes = newRecipeIds.Select(recipeId => new CollectionRecipe
        {
            CollectionId = collectionId,
            RecipeId = recipeId,
            AddedAt = DateTime.UtcNow
        }).ToList();

        _db.CollectionRecipes.AddRange(collectionRecipes);

        // Update collection's UpdatedAt
        collection.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return true;
    }

    /// <inheritdoc />
    public async Task<bool> RemoveRecipesFromCollectionBatchAsync(Guid collectionId, List<Guid> recipeIds, Guid userId)
    {
        // Verify collection belongs to user
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return false;

        // Get all matching collection recipes
        var collectionRecipes = await _db.CollectionRecipes
            .Where(cr => cr.CollectionId == collectionId && recipeIds.Contains(cr.RecipeId))
            .ToListAsync();

        if (collectionRecipes.Count == 0)
            return true; // No recipes to remove - idempotent

        _db.CollectionRecipes.RemoveRange(collectionRecipes);

        // Update collection's UpdatedAt
        collection.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return true;
    }

    /// <inheritdoc />
    public async Task<List<Guid>> GetCollectionsContainingRecipeAsync(Guid recipeId, Guid userId)
    {
        // Verify recipe belongs to user
        var recipe = await _db.Recipes
            .FirstOrDefaultAsync(r => r.Id == recipeId && r.UserId == userId);

        if (recipe == null)
            return new List<Guid>();

        // Get all collections that contain this recipe
        var collectionIds = await _db.CollectionRecipes
            .Where(cr => cr.RecipeId == recipeId)
            .Join(_db.Collections,
                cr => cr.CollectionId,
                c => c.Id,
                (cr, c) => new { cr.CollectionId, c.UserId })
            .Where(x => x.UserId == userId)
            .Select(x => x.CollectionId)
            .ToListAsync();

        return collectionIds;
    }
}
