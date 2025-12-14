using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecipeManager.Api.Data;
using RecipeManager.Api.Middleware;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<IStorageService, StorageService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();

// Only use authentication if Firebase is configured
if (!string.IsNullOrEmpty(firebaseProjectId) && firebaseProjectId != "your-firebase-project-id")
{
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<UserEnsurerMiddleware>();
}

// Health check endpoint (unauthenticated)
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithName("HealthCheck")
   .WithOpenApi();

// Recipe endpoints
app.MapPost("/api/recipes", async (CreateRecipeRequest request, ApplicationDbContext db, ClaimsPrincipal user) =>
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
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    db.Recipes.Add(recipe);
    await db.SaveChangesAsync();

    return Results.Created($"/api/recipes/{recipe.Id}", recipe);
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
            r.CreatedAt,
            r.UpdatedAt,
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

    return Results.Ok(new
    {
        recipe.Id,
        recipe.Title,
        recipe.Type,
        recipe.Url,
        recipe.StorageKey,
        recipe.Content,
        recipe.CreatedAt,
        recipe.UpdatedAt,
        IsFavorite = recipe.Favorites.Any(f => f.UserId == userId.Value)
    });
})
.WithName("GetRecipe")
.WithOpenApi();

app.MapPut("/api/recipes/{id:guid}", async (Guid id, UpdateRecipeRequest request, ApplicationDbContext db, ClaimsPrincipal user) =>
{
    var userId = GetUserId(user);
    if (userId == null) return Results.Unauthorized();

    var recipe = await db.Recipes.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value);
    if (recipe == null) return Results.NotFound();

    recipe.Title = request.Title;
    recipe.Type = request.Type;
    recipe.Url = request.Url;
    recipe.Content = request.Content;
    recipe.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(recipe);
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

    return Results.Created($"/api/recipes/{id}/favorite", favorite);
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

    var storageKey = $"users/{userId}/{Guid.NewGuid()}/{request.FileName}";
    var presignedUrl = await storageService.GetPresignedUploadUrlAsync(storageKey, request.ContentType);

    return Results.Ok(new { presignedUrl, storageKey });
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

app.Run();

// Helper method
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

// Request/Response DTOs
record CreateRecipeRequest(string Title, RecipeType Type, string? Url, string? StorageKey, string? Content);
record UpdateRecipeRequest(string Title, RecipeType Type, string? Url, string? Content);
record PresignUploadRequest(string FileName, string ContentType);
