using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.Extensions;
using RecipeManager.Api.Filters;
using RecipeManager.Api.Services;
using RecipeManager.Api.Utilities;

namespace RecipeManager.Api.Endpoints;

public static class UploadEndpoints
{
    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/uploads/presign", async (PresignUploadRequest request, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            // Validate file type using centralized validation
            if (!FileValidation.ValidateDocumentFile(request.ContentType, request.FileName))
            {
                return ProblemDetailsExtensions.BadRequestProblem(
                    title: "Invalid File Type",
                    detail: $"Invalid file type. Allowed types: {FileValidation.AllowedDocumentTypesDescription}"
                );
            }

            var storageKey = $"users/{userId}/{Guid.NewGuid()}/{request.FileName}";
            var presignedUrl = await storageService.GetPresignedUploadUrlAsync(storageKey, request.ContentType ?? "application/octet-stream");

            return Results.Ok(new { uploadUrl = presignedUrl, key = storageKey });
        })
        .AddEndpointFilter<ValidationFilter<PresignUploadRequest>>()
        .RequireRateLimiting("presign")
        .WithName("PresignUpload")
        .WithOpenApi();

        app.MapPost("/api/uploads/presign-collection-image", async (PresignUploadRequest request, IStorageService storageService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            // Validate file type using centralized validation - only images for collection thumbnails
            if (!FileValidation.ValidateImageFile(request.ContentType, request.FileName))
            {
                return ProblemDetailsExtensions.BadRequestProblem(
                    title: "Invalid File Type",
                    detail: $"Invalid file type. Allowed types: {FileValidation.AllowedImageTypesDescription}"
                );
            }

            var storageKey = $"users/{userId}/collections/{Guid.NewGuid()}/{request.FileName}";
            var presignedUrl = await storageService.GetPresignedUploadUrlAsync(storageKey, request.ContentType ?? "application/octet-stream");

            return Results.Ok(new { uploadUrl = presignedUrl, key = storageKey });
        })
        .AddEndpointFilter<ValidationFilter<PresignUploadRequest>>()
        .RequireRateLimiting("presign")
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
        .RequireRateLimiting("presign")
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
        .RequireRateLimiting("presign")
        .WithName("PresignCollectionImageDownload")
        .WithOpenApi();

        return app;
    }
}
