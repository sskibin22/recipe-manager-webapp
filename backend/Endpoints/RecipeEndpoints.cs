using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Queries;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class RecipeEndpoints
{
    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/recipes", async (CreateRecipeRequest request, ApplicationDbContext db, IUserContextService userContext, IFileCacheService fileCache, IStorageService storageService, ILogger<Program> logger) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return Results.Unauthorized();

            var recipe = new Recipe
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                Title = request.Title,
                Type = request.Type,
                Url = request.Url,
                StorageKey = request.StorageKey,
                Content = request.Content,
                PreviewImageUrl = request.PreviewImageUrl,
                Description = request.Description,
                SiteName = request.SiteName,
                CategoryId = request.CategoryId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // If this is a document upload and the file is in the cache, save it to the database
            if (request.Type == RecipeType.Document && !string.IsNullOrEmpty(request.StorageKey))
            {
                if (fileCache.TryGetFromCache(request.StorageKey, out var fileContent, out var fileContentType))
                {
                    recipe.FileContent = fileContent;
                    recipe.FileContentType = fileContentType;
                    // Remove from cache after saving
                    fileCache.RemoveFromCache(request.StorageKey);
                }
            }

            // If preview image URL is provided and the file is in the cache, save it to the database
            if (!string.IsNullOrEmpty(request.PreviewImageUrl))
            {
                if (fileCache.TryGetFromCache(request.PreviewImageUrl, out var imageContent, out var imageContentType))
                {
                    recipe.PreviewImageContent = imageContent;
                    recipe.PreviewImageContentType = imageContentType;
                    // Remove from cache after saving
                    fileCache.RemoveFromCache(request.PreviewImageUrl);
                }
            }

            db.Recipes.Add(recipe);

            // Add tags if provided
            if (request.TagIds != null && request.TagIds.Count > 0)
            {
                foreach (var tagId in request.TagIds)
                {
                    var recipeTag = new RecipeTag
                    {
                        RecipeId = recipe.Id,
                        TagId = tagId
                    };
                    db.RecipeTags.Add(recipeTag);
                }
            }

            await db.SaveChangesAsync();

            // Load category and tags for response
            await db.Entry(recipe).Reference(r => r.Category).LoadAsync();
            await db.Entry(recipe).Collection(r => r.RecipeTags).Query().Include(rt => rt.Tag).LoadAsync();

            // Convert FileContent to base64 for document recipes
            string? fileContentBase64 = null;
            if (recipe.Type == RecipeType.Document && recipe.FileContent != null)
            {
                fileContentBase64 = Convert.ToBase64String(recipe.FileContent);
            }

            // Convert PreviewImageContent to base64 data URL if stored in database
            string? previewImageUrl = null;
            if (recipe.PreviewImageContent != null && !string.IsNullOrEmpty(recipe.PreviewImageContentType))
            {
                var base64Image = Convert.ToBase64String(recipe.PreviewImageContent);
                previewImageUrl = $"data:{recipe.PreviewImageContentType};base64,{base64Image}";
            }
            else
            {
                // Otherwise, convert storage key to presigned URL for preview image
                previewImageUrl = await storageService.GetPreviewImageUrlAsync(recipe.PreviewImageUrl);
            }

            return Results.Created($"/api/recipes/{recipe.Id}", new
            {
                recipe.Id,
                recipe.Title,
                recipe.Type,
                recipe.Url,
                recipe.StorageKey,
                recipe.Content,
                previewImageUrl = previewImageUrl,
                recipe.Description,
                recipe.SiteName,
                recipe.CreatedAt,
                recipe.UpdatedAt,
                FileContent = fileContentBase64,
                FileContentType = recipe.FileContentType,
                IsFavorite = false,
                Category = recipe.Category != null ? new { recipe.Category.Id, recipe.Category.Name, recipe.Category.Color } : null,
                Tags = recipe.RecipeTags.Select(rt => new { rt.Tag.Id, rt.Tag.Name, rt.Tag.Color, rt.Tag.Type }).ToList()
            });
        })
        .WithName("CreateRecipe")
        .WithOpenApi();

        app.MapGet("/api/recipes", async (
            [AsParameters] RecipeQueryParameters queryParams,
            ApplicationDbContext db, 
            IUserContextService userContext, 
            IStorageService storageService, 
            ILogger<Program> logger) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return Results.Unauthorized();

            var query = db.Recipes
                .Include(r => r.Favorites)
                .Include(r => r.Category)
                .Include(r => r.RecipeTags)
                    .ThenInclude(rt => rt.Tag)
                .Where(r => r.UserId == userId.Value);

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
            {
                query = query.Where(r => r.Title.Contains(queryParams.SearchTerm));
            }

            // Apply category filter
            if (queryParams.CategoryId.HasValue)
            {
                query = query.Where(r => r.CategoryId == queryParams.CategoryId.Value);
            }

            // Apply tag filter
            var tagIds = queryParams.GetTagIds();
            if (tagIds.Count > 0)
            {
                // Filter recipes that have ALL specified tags by chaining Where clauses
                foreach (var tagId in tagIds)
                {
                    query = query.Where(r => r.RecipeTags.Any(rt => rt.TagId == tagId));
                }
            }

            var recipes = await query
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            // Convert preview images to base64 data URLs if stored in database, or presigned URLs if in storage
            var recipeDtos = new List<object>();
            foreach (var r in recipes)
            {
                string? previewImageUrl = null;
                if (r.PreviewImageContent != null && !string.IsNullOrEmpty(r.PreviewImageContentType))
                {
                    var base64Image = Convert.ToBase64String(r.PreviewImageContent);
                    previewImageUrl = $"data:{r.PreviewImageContentType};base64,{base64Image}";
                }
                else
                {
                    previewImageUrl = await storageService.GetPreviewImageUrlAsync(r.PreviewImageUrl);
                }

                recipeDtos.Add(new
                {
                    r.Id,
                    r.Title,
                    r.Type,
                    r.Url,
                    r.StorageKey,
                    r.Content,
                    PreviewImageUrl = previewImageUrl,
                    r.Description,
                    r.SiteName,
                    r.CreatedAt,
                    r.UpdatedAt,
                    r.FileContentType,
                    IsFavorite = r.Favorites.Any(f => f.UserId == userId.Value),
                    Category = r.Category != null ? new { r.Category.Id, r.Category.Name, r.Category.Color } : null,
                    Tags = r.RecipeTags.Select(rt => new { rt.Tag.Id, rt.Tag.Name, rt.Tag.Color, rt.Tag.Type }).ToList()
                });
            }

            return Results.Ok(recipeDtos);
        })
        .WithName("GetRecipes")
        .WithOpenApi();

        app.MapGet("/api/recipes/{id:guid}", async (Guid id, ApplicationDbContext db, IUserContextService userContext, IStorageService storageService, ILogger<Program> logger) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return Results.Unauthorized();

            var recipe = await db.Recipes
                .Include(r => r.Favorites)
                .Include(r => r.Category)
                .Include(r => r.RecipeTags)
                    .ThenInclude(rt => rt.Tag)
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);

            if (recipe == null) return Results.NotFound();

            // Convert FileContent to base64 for document recipes
            string? fileContentBase64 = null;
            if (recipe.Type == RecipeType.Document && recipe.FileContent != null)
            {
                fileContentBase64 = Convert.ToBase64String(recipe.FileContent);
            }

            // Convert PreviewImageContent to base64 data URL if stored in database
            string? previewImageUrl = null;
            if (recipe.PreviewImageContent != null && !string.IsNullOrEmpty(recipe.PreviewImageContentType))
            {
                var base64Image = Convert.ToBase64String(recipe.PreviewImageContent);
                previewImageUrl = $"data:{recipe.PreviewImageContentType};base64,{base64Image}";
            }
            else
            {
                // Otherwise, convert storage key to presigned URL for preview image if needed
                previewImageUrl = await storageService.GetPreviewImageUrlAsync(recipe.PreviewImageUrl);
            }

            return Results.Ok(new
            {
                recipe.Id,
                recipe.Title,
                recipe.Type,
                recipe.Url,
                recipe.StorageKey,
                recipe.Content,
                PreviewImageUrl = previewImageUrl,
                recipe.Description,
                recipe.SiteName,
                recipe.CreatedAt,
                recipe.UpdatedAt,
                FileContent = fileContentBase64,
                FileContentType = recipe.FileContentType,
                IsFavorite = recipe.Favorites.Any(f => f.UserId == userId.Value),
                Category = recipe.Category != null ? new { recipe.Category.Id, recipe.Category.Name, recipe.Category.Color } : null,
                Tags = recipe.RecipeTags.Select(rt => new { rt.Tag.Id, rt.Tag.Name, rt.Tag.Color, rt.Tag.Type }).ToList()
            });
        })
        .WithName("GetRecipe")
        .WithOpenApi();

        app.MapPut("/api/recipes/{id:guid}", async (Guid id, UpdateRecipeRequest request, ApplicationDbContext db, IUserContextService userContext, IFileCacheService fileCache, IStorageService storageService, ILogger<Program> logger) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return Results.Unauthorized();

            var recipe = await db.Recipes
                .Include(r => r.RecipeTags)
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);
            if (recipe == null) return Results.NotFound();

            recipe.Title = request.Title;
            recipe.Type = request.Type;
            recipe.Url = request.Url;
            recipe.Content = request.Content;
            recipe.PreviewImageUrl = request.PreviewImageUrl;
            recipe.Description = request.Description;
            recipe.SiteName = request.SiteName;
            recipe.CategoryId = request.CategoryId;
            recipe.UpdatedAt = DateTime.UtcNow;

            // Handle document replacement if a new storage key is provided
            if (!string.IsNullOrEmpty(request.StorageKey))
            {
                recipe.StorageKey = request.StorageKey;

                // If this is a document upload and the file is in the cache, save it to the database
                if (request.Type == RecipeType.Document && fileCache.TryGetFromCache(request.StorageKey, out var fileContent, out var fileContentType))
                {
                    recipe.FileContent = fileContent;
                    recipe.FileContentType = fileContentType;
                    // Remove from cache after saving
                    fileCache.RemoveFromCache(request.StorageKey);
                }
            }

            // Handle preview image update
            if (!string.IsNullOrEmpty(request.PreviewImageUrl))
            {
                recipe.PreviewImageUrl = request.PreviewImageUrl;

                // If the preview image is in the cache, save it to the database
                if (fileCache.TryGetFromCache(request.PreviewImageUrl, out var imageContent, out var imageContentType))
                {
                    recipe.PreviewImageContent = imageContent;
                    recipe.PreviewImageContentType = imageContentType;
                    // Remove from cache after saving
                    fileCache.RemoveFromCache(request.PreviewImageUrl);
                }
            }

            // Update tags
            if (request.TagIds != null)
            {
                // Remove existing tags
                db.RecipeTags.RemoveRange(recipe.RecipeTags);

                // Add new tags
                foreach (var tagId in request.TagIds)
                {
                    var recipeTag = new RecipeTag
                    {
                        RecipeId = recipe.Id,
                        TagId = tagId
                    };
                    db.RecipeTags.Add(recipeTag);
                }
            }

            await db.SaveChangesAsync();

            // Load category and tags for response
            await db.Entry(recipe).Reference(r => r.Category).LoadAsync();
            await db.Entry(recipe).Collection(r => r.RecipeTags).Query().Include(rt => rt.Tag).LoadAsync();

            // Convert FileContent to base64 for document recipes
            string? fileContentBase64 = null;
            if (recipe.Type == RecipeType.Document && recipe.FileContent != null)
            {
                fileContentBase64 = Convert.ToBase64String(recipe.FileContent);
            }

            // Convert PreviewImageContent to base64 data URL if stored in database
            string? previewImageUrl = null;
            if (recipe.PreviewImageContent != null && !string.IsNullOrEmpty(recipe.PreviewImageContentType))
            {
                var base64Image = Convert.ToBase64String(recipe.PreviewImageContent);
                previewImageUrl = $"data:{recipe.PreviewImageContentType};base64,{base64Image}";
            }
            else
            {
                // Otherwise, convert storage key to presigned URL for preview image
                previewImageUrl = await storageService.GetPreviewImageUrlAsync(recipe.PreviewImageUrl);
            }

            return Results.Ok(new
            {
                recipe.Id,
                recipe.Title,
                recipe.Type,
                recipe.Url,
                recipe.StorageKey,
                recipe.Content,
                previewImageUrl = previewImageUrl,
                recipe.Description,
                recipe.SiteName,
                recipe.CreatedAt,
                recipe.UpdatedAt,
                FileContent = fileContentBase64,
                FileContentType = recipe.FileContentType,
                Category = recipe.Category != null ? new { recipe.Category.Id, recipe.Category.Name, recipe.Category.Color } : null,
                Tags = recipe.RecipeTags.Select(rt => new { rt.Tag.Id, rt.Tag.Name, rt.Tag.Color, rt.Tag.Type }).ToList()
            });
        })
        .WithName("UpdateRecipe")
        .WithOpenApi();

        app.MapDelete("/api/recipes/{id:guid}", async (Guid id, ApplicationDbContext db, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return Results.Unauthorized();

            var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);
            if (recipe == null) return Results.NotFound();

            db.Recipes.Remove(recipe);
            await db.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithName("DeleteRecipe")
        .WithOpenApi();

        return app;
    }
}

