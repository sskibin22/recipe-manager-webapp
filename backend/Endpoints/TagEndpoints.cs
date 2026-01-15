using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;

namespace RecipeManager.Api.Endpoints;

public static class TagEndpoints
{
    public static IEndpointRouteBuilder MapTagEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tags", async (ApplicationDbContext db) =>
        {
            var tags = await db.Tags
                .OrderBy(t => t.Type)
                .ThenBy(t => t.Name)
                .ToListAsync();

            return Results.Ok(tags.Select(t => new
            {
                t.Id,
                t.Name,
                t.Color,
                t.Type
            }));
        })
        .RequireAuthorization()
        .WithName("GetTags")
        .WithOpenApi();

        return app;
    }
}
