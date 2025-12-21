using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class DevelopmentEndpoints
{
    public static IEndpointRouteBuilder MapDevelopmentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPut("/placeholder-upload/{*key}", async (HttpRequest request, string key, IFileCacheService fileCache) =>
        {
            // Read the uploaded file content
            using var memoryStream = new MemoryStream();
            await request.Body.CopyToAsync(memoryStream);
            var fileContent = memoryStream.ToArray();

            var contentType = request.ContentType ?? "application/octet-stream";

            // Store in cache for later retrieval when recipe is created
            fileCache.AddToCache(key, fileContent, contentType);

            return Results.Ok(new { message = "File uploaded successfully (development mode)", size = fileContent.Length });
        })
        .WithName("PlaceholderUpload")
        .WithOpenApi()
        .AllowAnonymous();

        app.MapGet("/placeholder-download/{*key}", async (string key, ApplicationDbContext db, ClaimsPrincipal user) =>
        {
            var userId = EndpointHelpers.GetUserId(user);
            if (userId == null) return Results.Unauthorized();

            // Find the recipe with this preview image key or storage key
            var recipe = await db.Recipes
                .FirstOrDefaultAsync(r => (r.PreviewImageUrl == key || r.StorageKey == key) && r.UserId == userId.Value);

            if (recipe == null)
                return Results.NotFound();

            // If looking for preview image
            if (recipe.PreviewImageUrl == key && recipe.PreviewImageContent != null)
            {
                return Results.File(recipe.PreviewImageContent, recipe.PreviewImageContentType ?? "image/jpeg");
            }

            // If looking for document storage
            if (recipe.StorageKey == key && recipe.FileContent != null)
            {
                return Results.File(recipe.FileContent, recipe.FileContentType ?? "application/octet-stream");
            }

            return Results.NotFound();
        })
        .WithName("PlaceholderDownload")
        .WithOpenApi();

        return app;
    }
}
