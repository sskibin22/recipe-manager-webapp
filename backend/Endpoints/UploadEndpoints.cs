using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.Extensions;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class UploadEndpoints
{
    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/uploads/presign", async (PresignUploadRequest request, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

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
                    return ProblemDetailsExtensions.BadRequestProblem(
                        title: "Invalid File Type",
                        detail: "Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG"
                    );
                }
            }

            var storageKey = $"users/{userId}/{Guid.NewGuid()}/{request.FileName}";
            var presignedUrl = await storageService.GetPresignedUploadUrlAsync(storageKey, request.ContentType ?? "application/octet-stream");

            return Results.Ok(new { uploadUrl = presignedUrl, key = storageKey });
        })
        .WithName("PresignUpload")
        .WithOpenApi();

        app.MapPost("/api/uploads/presign-collection-image", async (PresignUploadRequest request, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            // Validate file type - only images for collection thumbnails
            var allowedContentTypes = new HashSet<string>
            {
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp"
            };

            var allowedExtensions = new HashSet<string>
            {
                ".jpg", ".jpeg", ".png", ".gif", ".webp"
            };

            // Validate content type
            var contentTypeLower = request.ContentType?.ToLowerInvariant() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(contentTypeLower) || !allowedContentTypes.Contains(contentTypeLower))
            {
                // If content type is invalid, check file extension as fallback
                var fileExtension = Path.GetExtension(request.FileName).ToLowerInvariant();
                if (string.IsNullOrWhiteSpace(fileExtension) || !allowedExtensions.Contains(fileExtension))
                {
                    return ProblemDetailsExtensions.BadRequestProblem(
                        title: "Invalid File Type",
                        detail: "Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP"
                    );
                }
            }

            var storageKey = $"users/{userId}/collections/{Guid.NewGuid()}/{request.FileName}";
            var presignedUrl = await storageService.GetPresignedUploadUrlAsync(storageKey, request.ContentType ?? "application/octet-stream");

            return Results.Ok(new { uploadUrl = presignedUrl, key = storageKey });
        })
        .WithName("PresignCollectionImageUpload")
        .WithOpenApi();

        app.MapGet("/api/uploads/presign-download", async (Guid recipeId, ApplicationDbContext db, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var recipe = await db.Recipes
                .FirstOrDefaultAsync(r => r.Id == recipeId && r.UserId == userId.Value);

            if (recipe == null || string.IsNullOrEmpty(recipe.StorageKey))
                return ProblemDetailsExtensions.NotFoundProblem("Recipe", recipeId.ToString());

            var presignedUrl = await storageService.GetPresignedDownloadUrlAsync(recipe.StorageKey);

            return Results.Ok(new { presignedUrl });
        })
        .WithName("PresignDownload")
        .WithOpenApi();

        app.MapGet("/api/uploads/presign-collection-image-download", async (Guid collectionId, ApplicationDbContext db, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var collection = await db.Collections
                .FirstOrDefaultAsync(c => c.Id == collectionId && c.UserId == userId.Value);

            if (collection == null || string.IsNullOrEmpty(collection.ImageStorageKey))
                return ProblemDetailsExtensions.NotFoundProblem("Collection", collectionId.ToString());

            var presignedUrl = await storageService.GetPresignedDownloadUrlAsync(collection.ImageStorageKey);

            return Results.Ok(new { presignedUrl });
        })
        .WithName("PresignCollectionImageDownload")
        .WithOpenApi();

        return app;
    }
}

