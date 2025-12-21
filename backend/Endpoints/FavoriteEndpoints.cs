using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Endpoints;

public static class FavoriteEndpoints
{
    public static IEndpointRouteBuilder MapFavoriteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/recipes/{id:guid}/favorite", async (Guid id, ApplicationDbContext db, ClaimsPrincipal user) =>
        {
            var userId = EndpointHelpers.GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);
            if (recipe == null) return Results.NotFound();

            var existingFavorite = await db.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.RecipeId == id);

            if (existingFavorite != null) return Results.Ok(new { message = "Already favorited" });

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

        app.MapDelete("/api/recipes/{id:guid}/favorite", async (Guid id, ApplicationDbContext db, ClaimsPrincipal user) =>
        {
            var userId = EndpointHelpers.GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            var favorite = await db.Favorites
                .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.RecipeId == id);

            if (favorite == null) return Results.NotFound();

            db.Favorites.Remove(favorite);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("RemoveFavorite")
        .WithOpenApi();

        return app;
    }
}
