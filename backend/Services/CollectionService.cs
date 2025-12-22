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
    private readonly ILogger<CollectionService> _logger;

    public CollectionService(
        ApplicationDbContext db,
        RecipeMapper recipeMapper,
        ILogger<CollectionService> logger)
    {
        _db = db;
        _recipeMapper = recipeMapper;
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

        return collections.Select(CollectionMapper.ToResponse);
    }

    /// <inheritdoc />
    public async Task<CollectionResponse?> GetCollectionAsync(Guid collectionId, Guid userId)
    {
        var collection = await _db.Collections
            .Include(c => c.CollectionRecipes)
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        return collection != null ? CollectionMapper.ToResponse(collection) : null;
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
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Collections.Add(collection);
        await _db.SaveChangesAsync();

        return CollectionMapper.ToResponse(collection);
    }

    /// <inheritdoc />
    public async Task<CollectionResponse?> UpdateCollectionAsync(Guid collectionId, UpdateCollectionRequest request, Guid userId)
    {
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return null;

        collection.Name = request.Name;
        collection.Description = request.Description;
        collection.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Reload with recipe count
        await _db.Entry(collection)
            .Collection(c => c.CollectionRecipes)
            .LoadAsync();

        return CollectionMapper.ToResponse(collection);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteCollectionAsync(Guid collectionId, Guid userId)
    {
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId);

        if (collection == null)
            return false;

        _db.Collections.Remove(collection);
        await _db.SaveChangesAsync();

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
}
