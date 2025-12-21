using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecipeManager.Api.Data;
using RecipeManager.Api.Endpoints;
using RecipeManager.Api.Middleware;
using RecipeManager.Api.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Configure JSON options for case-insensitive enum parsing and camelCase property names
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
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

// Map all API endpoints
app.MapHealthEndpoints();
app.MapMetadataEndpoints();
app.MapRecipeEndpoints();
app.MapFavoriteEndpoints();
app.MapUploadEndpoints();
app.MapUserEndpoints();
app.MapCategoryEndpoints();
app.MapTagEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapDevelopmentEndpoints();
}

app.Run();

// Make Program accessible to tests
public partial class Program { }
