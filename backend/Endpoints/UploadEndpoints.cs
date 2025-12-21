using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class UploadEndpoints
{
    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/uploads/presign", async (PresignUploadRequest request, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return Results.Unauthorized();

            // Validate file type by content type and extension
            var allowedContentTypes = new HashSet<string>
            {
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain",
                "image/jpeg",
                "image/png"
            };

            var allowedExtensions = new HashSet<string>
            {
                ".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png"
            };

            // Validate content type
            var contentTypeLower = request.ContentType?.ToLowerInvariant() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(contentTypeLower) || !allowedContentTypes.Contains(contentTypeLower))
            {
                // If content type is invalid, check file extension as fallback
                var fileExtension = Path.GetExtension(request.FileName).ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(fileExtension) || !allowedExtensions.Contains(fileExtension))
                {
                    return Results.BadRequest(new
                    {
                        message = "Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG"
                    });
                }
            }

            var storageKey = $"users/{userId}/{Guid.NewGuid()}/{request.FileName}";
            var presignedUrl = await storageService.GetPresignedUploadUrlAsync(storageKey, request.ContentType);

            return Results.Ok(new { uploadUrl = presignedUrl, key = storageKey });
        })
        .WithName("PresignUpload")
        .WithOpenApi();

        app.MapGet("/api/uploads/presign-download", async (Guid recipeId, ApplicationDbContext db, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return Results.Unauthorized();

            var recipe = await db.Recipes
                .FirstOrDefaultAsync(r => r.Id == recipeId && r.UserId == userId.Value);

            if (recipe == null || string.IsNullOrEmpty(recipe.StorageKey))
                return Results.NotFound();

            var presignedUrl = await storageService.GetPresignedDownloadUrlAsync(recipe.StorageKey);

            return Results.Ok(new { presignedUrl });
        })
        .WithName("PresignDownload")
        .WithOpenApi();

        return app;
    }
}

