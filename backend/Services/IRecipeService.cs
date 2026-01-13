using RecipeManager.Api.DTOs.Queries;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.DTOs.Responses;

namespace RecipeManager.Api.Services;

/// <summary>
/// Service for recipe business logic operations
/// </summary>
public interface IRecipeService
{
    /// <summary>
    /// Create a new recipe for the specified user
    /// </summary>
    /// <param name="request">Recipe creation request</param>
    /// <param name="userId">The ID of the user creating the recipe</param>
    /// <returns>The created recipe response</returns>
    Task<RecipeResponse> CreateRecipeAsync(CreateRecipeRequest request, Guid userId);

    /// <summary>
    /// Update an existing recipe
    /// </summary>
    /// <param name="id">Recipe ID to update</param>
    /// <param name="request">Recipe update request</param>
    /// <param name="userId">The ID of the user updating the recipe</param>
    /// <returns>The updated recipe response, or null if not found or unauthorized</returns>
    Task<RecipeResponse?> UpdateRecipeAsync(Guid id, UpdateRecipeRequest request, Guid userId);

    /// <summary>
    /// Get a single recipe by ID
    /// </summary>
    /// <param name="id">Recipe ID</param>
    /// <param name="userId">The ID of the current user</param>
    /// <returns>The recipe response, or null if not found or unauthorized</returns>
    Task<RecipeResponse?> GetRecipeAsync(Guid id, Guid userId);

    /// <summary>
    /// Get a list of recipes with optional filtering
    /// </summary>
    /// <param name="queryParams">Query parameters for filtering</param>
    /// <param name="userId">The ID of the current user</param>
    /// <returns>List of recipe responses</returns>
    Task<List<RecipeResponse>> GetRecipesAsync(RecipeQueryParameters queryParams, Guid userId);

    /// <summary>
    /// Delete a recipe
    /// </summary>
    /// <param name="id">Recipe ID to delete</param>
    /// <param name="userId">The ID of the user deleting the recipe</param>
    /// <returns>True if deleted successfully, false if not found or unauthorized</returns>
    Task<bool> DeleteRecipeAsync(Guid id, Guid userId);

    /// <summary>
    /// Delete multiple recipes
    /// </summary>
    /// <param name="recipeIds">List of recipe IDs to delete</param>
    /// <param name="userId">The ID of the user deleting the recipes</param>
    /// <returns>The number of recipes successfully deleted</returns>
    Task<int> DeleteRecipesAsync(List<Guid> recipeIds, Guid userId);

    /// <summary>
    /// Get a random recipe from the user's collection
    /// </summary>
    /// <param name="userId">The ID of the current user</param>
    /// <param name="collectionId">Optional collection ID to filter recipes</param>
    /// <returns>A random recipe response, or null if no recipes available</returns>
    Task<RecipeResponse?> GetRandomRecipeAsync(Guid userId, Guid? collectionId);
}
