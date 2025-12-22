using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.Extensions;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class CollectionEndpoints
{
    public static IEndpointRouteBuilder MapCollectionEndpoints(this IEndpointRouteBuilder app)
    {
        // Get all collections for the current user
        app.MapGet("/api/collections", async (
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var collections = await collectionService.GetUserCollectionsAsync(userId.Value);
            return Results.Ok(collections);
        })
        .WithName("GetCollections")
        .WithOpenApi();

        // Get single collection by ID
        app.MapGet("/api/collections/{id:guid}", async (
            Guid id,
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var collection = await collectionService.GetCollectionAsync(id, userId.Value);
            if (collection == null) return Results.NotFound();

            return Results.Ok(collection);
        })
        .WithName("GetCollection")
        .WithOpenApi();

        // Create new collection
        app.MapPost("/api/collections", async (
            CreateCollectionRequest request,
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var collection = await collectionService.CreateCollectionAsync(request, userId.Value);
            return Results.Created($"/api/collections/{collection.Id}", collection);
        })
        .WithName("CreateCollection")
        .WithOpenApi();

        // Update collection
        app.MapPut("/api/collections/{id:guid}", async (
            Guid id,
            UpdateCollectionRequest request,
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var collection = await collectionService.UpdateCollectionAsync(id, request, userId.Value);
            if (collection == null) return Results.NotFound();

            return Results.Ok(collection);
        })
        .WithName("UpdateCollection")
        .WithOpenApi();

        // Delete collection
        app.MapDelete("/api/collections/{id:guid}", async (
            Guid id,
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var deleted = await collectionService.DeleteCollectionAsync(id, userId.Value);
            if (!deleted) return Results.NotFound();

            return Results.NoContent();
        })
        .WithName("DeleteCollection")
        .WithOpenApi();

        // Get all recipes in a collection
        app.MapGet("/api/collections/{id:guid}/recipes", async (
            Guid id,
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var recipes = await collectionService.GetCollectionRecipesAsync(id, userId.Value);
            return Results.Ok(recipes);
        })
        .WithName("GetCollectionRecipes")
        .WithOpenApi();

        // Add recipe to collection
        app.MapPost("/api/collections/{id:guid}/recipes", async (
            Guid id,
            Guid recipeId,
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var added = await collectionService.AddRecipeToCollectionAsync(id, recipeId, userId.Value);
            if (!added) return Results.NotFound();

            return Results.Created($"/api/collections/{id}/recipes/{recipeId}", new { collectionId = id, recipeId });
        })
        .WithName("AddRecipeToCollection")
        .WithOpenApi();

        // Remove recipe from collection
        app.MapDelete("/api/collections/{id:guid}/recipes/{recipeId:guid}", async (
            Guid id,
            Guid recipeId,
            ICollectionService collectionService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var removed = await collectionService.RemoveRecipeFromCollectionAsync(id, recipeId, userId.Value);
            if (!removed) return Results.NotFound();

            return Results.NoContent();
        })
        .WithName("RemoveRecipeFromCollection")
        .WithOpenApi();

        return app;
    }
}
