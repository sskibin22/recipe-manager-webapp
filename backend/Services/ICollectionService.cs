using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.DTOs.Responses;

namespace RecipeManager.Api.Services;

/// <summary>
/// Service for collection business logic operations
/// </summary>
public interface ICollectionService
{
    /// <summary>
    /// Get all collections for a user
    /// </summary>
    Task<IEnumerable<CollectionResponse>> GetUserCollectionsAsync(Guid userId);

    /// <summary>
    /// Get a single collection by ID
    /// </summary>
    Task<CollectionResponse?> GetCollectionAsync(Guid collectionId, Guid userId);

    /// <summary>
    /// Create a new collection
    /// </summary>
    Task<CollectionResponse> CreateCollectionAsync(CreateCollectionRequest request, Guid userId);

    /// <summary>
    /// Update an existing collection
    /// </summary>
    Task<CollectionResponse?> UpdateCollectionAsync(Guid collectionId, UpdateCollectionRequest request, Guid userId);

    /// <summary>
    /// Delete a collection
    /// </summary>
    Task<bool> DeleteCollectionAsync(Guid collectionId, Guid userId);

    /// <summary>
    /// Add a recipe to a collection
    /// </summary>
    Task<bool> AddRecipeToCollectionAsync(Guid collectionId, Guid recipeId, Guid userId);

    /// <summary>
    /// Remove a recipe from a collection
    /// </summary>
    Task<bool> RemoveRecipeFromCollectionAsync(Guid collectionId, Guid recipeId, Guid userId);

    /// <summary>
    /// Get all recipes in a collection
    /// </summary>
    Task<IEnumerable<RecipeListItemResponse>> GetCollectionRecipesAsync(Guid collectionId, Guid userId);

    /// <summary>
    /// Add multiple recipes to a collection in batch
    /// </summary>
    Task<bool> AddRecipesToCollectionBatchAsync(Guid collectionId, List<Guid> recipeIds, Guid userId);

    /// <summary>
    /// Remove multiple recipes from a collection in batch
    /// </summary>
    Task<bool> RemoveRecipesFromCollectionBatchAsync(Guid collectionId, List<Guid> recipeIds, Guid userId);

    /// <summary>
    /// Get collection IDs that contain a specific recipe
    /// </summary>
    Task<List<Guid>> GetCollectionsContainingRecipeAsync(Guid recipeId, Guid userId);

    /// <summary>
    /// Delete multiple collections in batch
    /// </summary>
    Task<int> DeleteCollectionsBatchAsync(List<Guid> collectionIds, Guid userId);
}
