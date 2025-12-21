using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.Extensions;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class FavoriteEndpoints
{
    public static IEndpointRouteBuilder MapFavoriteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/recipes/{id:guid}/favorite", async (Guid id, ApplicationDbContext db, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);
            if (recipe == null) return ProblemDetailsExtensions.NotFoundProblem("Recipe", id.ToString());

            var existingFavorite = await db.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.RecipeId == id);

            if (existingFavorite != null)
            {
                // Already favorited - return same format as new favorite (idempotent behavior)
                return Results.Created($"/api/recipes/{id}/favorite", new
                {
                    existingFavorite.UserId,
                    existingFavorite.RecipeId,
                    existingFavorite.CreatedAt
                });
            }

            var favorite = new Favorite
            {
                UserId = userId.Value,
                RecipeId = id,
                CreatedAt = DateTime.UtcNow
            };

            db.Favorites.Add(favorite);
            await db.SaveChangesAsync();

            return Results.Created($"/api/recipes/{id}/favorite", new
            {
                favorite.UserId,
                favorite.RecipeId,
                favorite.CreatedAt
            });
        })
        .WithName("AddFavorite")
        .WithOpenApi();

        app.MapDelete("/api/recipes/{id:guid}/favorite", async (Guid id, ApplicationDbContext db, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var favorite = await db.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.RecipeId == id);

            if (favorite == null) return ProblemDetailsExtensions.NotFoundProblem("Favorite");

            db.Favorites.Remove(favorite);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("RemoveFavorite")
        .WithOpenApi();

        return app;
    }
}
