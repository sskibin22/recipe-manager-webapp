using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

/// <summary>
/// Maps development-only endpoints for file upload/download when cloud storage is not configured.
/// These endpoints should NEVER be available in production.
/// </summary>
public static class DevelopmentEndpoints
{
    /// <summary>
    /// Registers development-only placeholder endpoints for file operations.
    /// These endpoints are only registered when the application is running in Development environment.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    /// <returns>The endpoint route builder for method chaining.</returns>
    public static IEndpointRouteBuilder MapDevelopmentEndpoints(this IEndpointRouteBuilder app)
    {
        var environment = app.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        
        if (!environment.IsDevelopment())
        {
            return app;
        }

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

        app.MapGet("/placeholder-download/{*key}", async (string key, ApplicationDbContext db, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
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
