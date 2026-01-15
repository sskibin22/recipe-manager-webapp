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
        ParseAndSetPreviewImage(collection, request.PreviewImageData);

        _db.Collections.Add(collection);
        await _db.SaveChangesAsync();

        return await _collectionMapper.ToResponseAsync(collection);
    }

    /// <summary>
    /// Parses base64 data URI and sets preview image content on collection.
    /// Data URI format: "data:image/png;base64,iVBORw0KG..."
    /// </summary>
    /// <param name="collection">The collection to update</param>
    /// <param name="previewImageData">The base64 data URI string</param>
    private void ParseAndSetPreviewImage(Collection collection, string? previewImageData)
    {
        if (string.IsNullOrEmpty(previewImageData))
            return;

        try
        {
            // Validate data URI format
            if (!previewImageData.StartsWith("data:") || !previewImageData.Contains(";base64,"))
            {
                _logger.LogWarning("Invalid data URI format for collection preview image");
                return;
            }

            // Parse data URI format: "data:image/png;base64,..."
            var parts = previewImageData.Split(',', 2);
            if (parts.Length != 2)
            {
                _logger.LogWarning("Failed to split data URI into header and data parts");
                return;
            }

            var contentTypePart = parts[0].Replace("data:", "").Replace(";base64", "");
            var base64Data = parts[1];

            // Validate content type
            if (!contentTypePart.StartsWith("image/"))
            {
                _logger.LogWarning("Invalid content type for collection preview image: {ContentType}", contentTypePart);
                return;
            }

            collection.PreviewImageContent = Convert.FromBase64String(base64Data);
            collection.PreviewImageContentType = contentTypePart;
        }
        catch (FormatException ex)
        {
            _logger.LogWarning(ex, "Invalid base64 format in preview image data");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to parse preview image data for collection");
        }
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
        ParseAndSetPreviewImage(collection, request.PreviewImageData);

        await _db.SaveChangesAsync();

        // Clean up old image if it was replaced (not null and different from new key)
        if (!string.IsNullOrEmpty(oldImageKey) && oldImageKey != request.ImageStorageKey)
        {
            var deleted = await _storageService.DeleteFileAsync(oldImageKey);
            if (deleted)
            {
                _logger.LogInformation("Collection image replaced and old image deleted. Old key: {OldKey}", oldImageKey);
            }
            else
            {
                _logger.LogWarning("Failed to delete old collection image from storage: {Key}", oldImageKey);
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

        // Clean up collection image from storage
        if (!string.IsNullOrEmpty(imageKey))
        {
            var deleted = await _storageService.DeleteFileAsync(imageKey);
            if (deleted)
            {
                _logger.LogInformation("Collection deleted and image removed from storage. Image key: {Key}", imageKey);
            }
            else
            {
                _logger.LogWarning("Failed to delete collection image from storage: {Key}", imageKey);
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

    /// <inheritdoc />
    public async Task<int> DeleteCollectionsBatchAsync(List<Guid> collectionIds, Guid userId)
    {
        if (collectionIds == null || collectionIds.Count == 0)
            return 0;

        // Get all collections that belong to the user and match the provided IDs
        var collectionsToDelete = await _db.Collections
            .Where(c => collectionIds.Contains(c.Id) && c.UserId == userId)
            .ToListAsync();

        if (collectionsToDelete.Count == 0)
            return 0;

        // Store image keys for potential cleanup
        var imageKeys = collectionsToDelete
            .Where(c => !string.IsNullOrEmpty(c.ImageStorageKey))
            .Select(c => c.ImageStorageKey!)  // Null-forgiving operator here is correct since Where filters out nulls
            .ToList();

        // Delete all collections (cascade delete will handle CollectionRecipes)
        _db.Collections.RemoveRange(collectionsToDelete);
        await _db.SaveChangesAsync();

        // Clean up images from storage
        if (imageKeys.Count > 0)
        {
            foreach (var key in imageKeys)
            {
                var deleted = await _storageService.DeleteFileAsync(key);  // key is guaranteed non-null here
                if (!deleted)
                {
                    _logger.LogWarning("Failed to delete collection image from storage: {Key}", key);
                }
            }
            _logger.LogInformation("Deleted {Count} collections with images. Image keys: {Keys}",
                collectionsToDelete.Count, string.Join(", ", imageKeys));
        }
        else
        {
            _logger.LogInformation("Deleted {Count} collections", collectionsToDelete.Count);
        }

        return collectionsToDelete.Count;
    }
}
