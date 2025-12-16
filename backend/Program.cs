using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecipeManager.Api.Data;
using RecipeManager.Api.Middleware;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;
using System.Security.Claims;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON options for case-insensitive enum parsing
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add JWT Authentication
var firebaseProjectId = builder.Configuration["Firebase:ProjectId"];
var firebaseAudience = builder.Configuration["Firebase:Audience"];

if (!string.IsNullOrEmpty(firebaseProjectId) && firebaseProjectId != "your-firebase-project-id")
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.Authority = $"https://securetoken.google.com/{firebaseProjectId}";
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = $"https://securetoken.google.com/{firebaseProjectId}",
                ValidateAudience = true,
                ValidAudience = firebaseAudience,
                ValidateLifetime = true
            };
        });
    builder.Services.AddAuthorization();
}

// Add services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IStorageService, StorageService>();
builder.Services.AddScoped<IMetadataService, MetadataService>();
builder.Services.AddHttpClient("MetadataClient")
    .ConfigureHttpClient(client =>
    {
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Add("Accept", "text/html");
    });
builder.Services.AddSingleton<Dictionary<string, (byte[] content, string contentType)>>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();

// Development authentication bypass (only in Development mode)
if (app.Environment.IsDevelopment())
{
    var bypassAuth = app.Configuration.GetValue<bool>("Development:BypassAuthentication");
    if (bypassAuth)
    {
        app.UseMiddleware<DevelopmentAuthMiddleware>();
    }
}

// Only use authentication if Firebase is configured
if (!string.IsNullOrEmpty(firebaseProjectId) && firebaseProjectId != "your-firebase-project-id")
{
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<UserEnsurerMiddleware>();
}
else if (app.Environment.IsDevelopment())
{
    // If Firebase isn't configured but we're in dev mode, still use UserEnsurer
    // to create the dev user in the database
    app.UseMiddleware<UserEnsurerMiddleware>();
}

// Health check endpoint (unauthenticated)
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithName("HealthCheck")
   .WithOpenApi();

// Metadata endpoint
app.MapPost("/api/recipes/fetch-metadata", async (FetchMetadataRequest request, IMetadataService metadataService, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    if (string.IsNullOrWhiteSpace(request.Url))
    {
        return Results.BadRequest(new { message = "URL is required" });
    }

    var metadata = await metadataService.FetchMetadataAsync(request.Url);
    
    if (metadata == null)
    {
        return Results.Ok(new
        {
            title = (string?)null,
            description = (string?)null,
            imageUrl = (string?)null,
            siteName = (string?)null
        });
    }

    return Results.Ok(new
    {
        title = metadata.Title,
        description = metadata.Description,
        imageUrl = metadata.ImageUrl,
        siteName = metadata.SiteName
    });
})
.WithName("FetchMetadata")
.WithOpenApi();

// Recipe endpoints
app.MapPost("/api/recipes", async (CreateRecipeRequest request, ApplicationDbContext db, ClaimsPrincipal user, Dictionary<string, (byte[] content, string contentType)> fileCache) =>
{
    var userId = GetUserId(user);
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
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    // If this is a document upload and the file is in the cache, save it to the database
    if (request.Type == RecipeType.Document && !string.IsNullOrEmpty(request.StorageKey))
    {
        if (fileCache.TryGetValue(request.StorageKey, out var fileData))
        {
            recipe.FileContent = fileData.content;
            recipe.FileContentType = fileData.contentType;
            // Remove from cache after saving
            fileCache.Remove(request.StorageKey);
        }
    }

    db.Recipes.Add(recipe);
    await db.SaveChangesAsync();

    // Convert FileContent to base64 for document recipes
    string? fileContentBase64 = null;
    if (recipe.Type == RecipeType.Document && recipe.FileContent != null)
    {
        fileContentBase64 = Convert.ToBase64String(recipe.FileContent);
    }

    return Results.Created($"/api/recipes/{recipe.Id}", new
    {
        recipe.Id,
        recipe.Title,
        recipe.Type,
        recipe.Url,
        recipe.StorageKey,
        recipe.Content,
        recipe.PreviewImageUrl,
        recipe.Description,
        recipe.SiteName,
        recipe.CreatedAt,
        recipe.UpdatedAt,
        FileContent = fileContentBase64,
        FileContentType = recipe.FileContentType,
        IsFavorite = false
    });
})
.WithName("CreateRecipe")
.WithOpenApi();

app.MapGet("/api/recipes", async (ApplicationDbContext db, ClaimsPrincipal user, string? q) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    var query = db.Recipes
        .Include(r => r.Favorites)
        .Where(r => r.UserId == userId.Value);

    if (!string.IsNullOrWhiteSpace(q))
    {
        query = query.Where(r => r.Title.Contains(q));
    }

    var recipes = await query
        .OrderByDescending(r => r.CreatedAt)
        .Select(r => new
        {
            r.Id,
            r.Title,
            r.Type,
            r.Url,
            r.StorageKey,
            r.Content,
            r.PreviewImageUrl,
            r.Description,
            r.SiteName,
            r.CreatedAt,
            r.UpdatedAt,
            r.FileContentType,
            IsFavorite = r.Favorites.Any(f => f.UserId == userId.Value)
        })
        .ToListAsync();

    return Results.Ok(recipes);
})
.WithName("GetRecipes")
.WithOpenApi();

app.MapGet("/api/recipes/{id:guid}", async (Guid id, ApplicationDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    var recipe = await db.Recipes
        .Include(r => r.Favorites)
        .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);

    if (recipe == null) return Results.NotFound();

    // Convert FileContent to base64 for document recipes
    string? fileContentBase64 = null;
    if (recipe.Type == RecipeType.Document && recipe.FileContent != null)
    {
        fileContentBase64 = Convert.ToBase64String(recipe.FileContent);
    }

    return Results.Ok(new
    {
        recipe.Id,
        recipe.Title,
        recipe.Type,
        recipe.Url,
        recipe.StorageKey,
        recipe.Content,
        recipe.PreviewImageUrl,
        recipe.Description,
        recipe.SiteName,
        recipe.CreatedAt,
        recipe.UpdatedAt,
        FileContent = fileContentBase64,
        FileContentType = recipe.FileContentType,
        IsFavorite = recipe.Favorites.Any(f => f.UserId == userId.Value)
    });
})
.WithName("GetRecipe")
.WithOpenApi();

app.MapPut("/api/recipes/{id:guid}", async (Guid id, UpdateRecipeRequest request, ApplicationDbContext db, ClaimsPrincipal user, Dictionary<string, (byte[] content, string contentType)> fileCache) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);
    if (recipe == null) return Results.NotFound();

    recipe.Title = request.Title;
    recipe.Type = request.Type;
    recipe.Url = request.Url;
    recipe.Content = request.Content;
    recipe.PreviewImageUrl = request.PreviewImageUrl;
    recipe.Description = request.Description;
    recipe.SiteName = request.SiteName;
    recipe.UpdatedAt = DateTime.UtcNow;

    // Handle document replacement if a new storage key is provided
    if (!string.IsNullOrEmpty(request.StorageKey))
    {
        recipe.StorageKey = request.StorageKey;
        
        // If this is a document upload and the file is in the cache, save it to the database
        if (request.Type == RecipeType.Document && fileCache.TryGetValue(request.StorageKey, out var fileData))
        {
            recipe.FileContent = fileData.content;
            recipe.FileContentType = fileData.contentType;
            // Remove from cache after saving
            fileCache.Remove(request.StorageKey);
        }
    }

    await db.SaveChangesAsync();

    // Convert FileContent to base64 for document recipes
    string? fileContentBase64 = null;
    if (recipe.Type == RecipeType.Document && recipe.FileContent != null)
    {
        fileContentBase64 = Convert.ToBase64String(recipe.FileContent);
    }

    return Results.Ok(new
    {
        recipe.Id,
        recipe.Title,
        recipe.Type,
        recipe.Url,
        recipe.StorageKey,
        recipe.Content,
        recipe.PreviewImageUrl,
        recipe.Description,
        recipe.SiteName,
        recipe.CreatedAt,
        recipe.UpdatedAt,
        FileContent = fileContentBase64,
        FileContentType = recipe.FileContentType
    });
})
.WithName("UpdateRecipe")
.WithOpenApi();

app.MapDelete("/api/recipes/{id:guid}", async (Guid id, ApplicationDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);
    if (recipe == null) return Results.NotFound();

    db.Recipes.Remove(recipe);
    await db.SaveChangesAsync();

    return Results.NoContent();
})
.WithName("DeleteRecipe")
.WithOpenApi();

// Favorite endpoints
app.MapPost("/api/recipes/{id:guid}/favorite", async (Guid id, ApplicationDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
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
    var userId = GetUserId(user);
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

// Upload endpoints
app.MapPost("/api/uploads/presign", async (PresignUploadRequest request, IStorageService storageService, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
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

app.MapGet("/api/uploads/presign-download", async (Guid recipeId, ApplicationDbContext db, IStorageService storageService, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
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

// Development-only placeholder endpoints for file uploads when R2 is not configured
if (app.Environment.IsDevelopment())
{
    app.MapPut("/placeholder-upload/{*key}", async (HttpRequest request, string key, Dictionary<string, (byte[] content, string contentType)> fileCache) =>
    {
        // Read the uploaded file content
        using var memoryStream = new MemoryStream();
        await request.Body.CopyToAsync(memoryStream);
        var fileContent = memoryStream.ToArray();
        
        var contentType = request.ContentType ?? "application/octet-stream";
        
        // Store in cache for later retrieval when recipe is created
        fileCache[key] = (fileContent, contentType);
        
        return Results.Ok(new { message = "File uploaded successfully (development mode)", size = fileContent.Length });
    })
    .WithName("PlaceholderUpload")
    .WithOpenApi()
    .AllowAnonymous();

    app.MapGet("/placeholder-download/{*key}", async (string key, ApplicationDbContext db, ClaimsPrincipal user) =>
    {
        var userId = GetUserId(user);
        if (userId == null) return Results.Unauthorized();
        
        // Find the recipe with this storage key
        var recipe = await db.Recipes
            .FirstOrDefaultAsync(r => r.StorageKey == key && r.UserId == userId.Value);
        
        if (recipe == null || recipe.FileContent == null)
            return Results.NotFound();
        
        // Return the file content
        return Results.File(recipe.FileContent, recipe.FileContentType ?? "application/octet-stream");
    })
    .WithName("PlaceholderDownload")
    .WithOpenApi();
}

// User profile endpoints
app.MapGet("/api/user/profile", async (ApplicationDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    var userProfile = await db.Users.FindAsync(userId.Value);
    if (userProfile == null) return Results.NotFound();

    return Results.Ok(new
    {
        userProfile.Id,
        userProfile.Email,
        userProfile.DisplayName
    });
})
.WithName("GetUserProfile")
.WithOpenApi();

app.MapPut("/api/user/profile", async (UpdateUserProfileRequest request, ApplicationDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    var userProfile = await db.Users.FindAsync(userId.Value);
    if (userProfile == null) return Results.NotFound();

    // Update allowed fields
    if (!string.IsNullOrWhiteSpace(request.Email))
    {
        userProfile.Email = request.Email;
    }

    if (!string.IsNullOrWhiteSpace(request.DisplayName))
    {
        userProfile.DisplayName = request.DisplayName;
    }

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        userProfile.Id,
        userProfile.Email,
        userProfile.DisplayName
    });
})
.WithName("UpdateUserProfile")
.WithOpenApi();

// Helper method (must be before app.Run())
static Guid? GetUserId(ClaimsPrincipal user)
{
    // Check for the db_user_id claim added by middleware
    var dbUserIdClaim = user.FindFirst("db_user_id");
    if (dbUserIdClaim != null && Guid.TryParse(dbUserIdClaim.Value, out var userId))
    {
        return userId;
    }

    return null;
}

app.Run();

// Request/Response DTOs (after app.Run to avoid CS8803 error)
record CreateRecipeRequest(string Title, RecipeType Type, string? Url, string? StorageKey, string? Content, string? PreviewImageUrl, string? Description, string? SiteName);
record UpdateRecipeRequest(string Title, RecipeType Type, string? Url, string? StorageKey, string? Content, string? PreviewImageUrl, string? Description, string? SiteName);
record PresignUploadRequest(string FileName, string ContentType);
record UpdateUserProfileRequest(string? Email, string? DisplayName);
record FetchMetadataRequest(string Url);

// Make Program accessible to tests
public partial class Program { }
