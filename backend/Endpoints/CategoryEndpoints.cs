using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;

namespace RecipeManager.Api.Endpoints;

public static class CategoryEndpoints
{
    public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/categories", async (ApplicationDbContext db) =>
        {
            var categories = await db.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Results.Ok(categories.Select(c => new
            {
                c.Id,
                c.Name,
                c.Color
            }));
        })
        .RequireAuthorization()
        .WithName("GetCategories")
        .WithOpenApi();

        return app;
    }
}
