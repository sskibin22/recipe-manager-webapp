using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecipeManager.Api.Data;
using RecipeManager.Api.Mapping;
using RecipeManager.Api.Services;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

namespace RecipeManager.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Configure JSON options
        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
            options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

        // Add OpenAPI/Swagger
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        // Add DbContext
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(configuration.GetConnectionString("DefaultConnection")));

        // Add application services
        services.AddHttpContextAccessor();
        services.AddScoped<IUserContextService, UserContextService>();
        services.AddScoped<IStorageService, StorageService>();
        services.AddScoped<IMetadataService, MetadataService>();
        services.AddScoped<IRecipeService, RecipeService>();
        services.AddScoped<ICollectionService, CollectionService>();
        services.AddScoped<RecipeMapper>();
        services.AddScoped<CollectionMapper>();

        // Add HttpClient for metadata fetching
        services.AddHttpClient("MetadataClient")
            .ConfigureHttpClient(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(10);
                client.DefaultRequestHeaders.Add("Accept", "text/html");
            });

        services.AddSingleton<IFileCacheService, FileCacheService>();

        return services;
    }

    public static IServiceCollection AddCorsServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var allowedOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? new[] { "http://localhost:5173" };

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        });

        return services;
    }

    public static IServiceCollection AddAuthenticationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var firebaseProjectId = configuration["Firebase:ProjectId"];
        var firebaseAudience = configuration["Firebase:Audience"];

        if (!string.IsNullOrEmpty(firebaseProjectId) &&
            firebaseProjectId != "your-firebase-project-id")
        {
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
            services.AddAuthorization();
        }

        return services;
    }

    public static IServiceCollection AddRateLimitingServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddRateLimiter(options =>
        {
            // Global rate limit per IP address (100 requests per minute)
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var userPartitionKey = context.User.Identity?.Name ?? context.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
                
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: userPartitionKey,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    });
            });

            // Metadata fetch endpoint: 10 requests per minute per user
            options.AddFixedWindowLimiter("metadata", opt =>
            {
                opt.Window = TimeSpan.FromMinutes(1);
                opt.PermitLimit = 10;
                opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;
            });

            // Presigned URL endpoints: 50 requests per minute per user
            options.AddFixedWindowLimiter("presign", opt =>
            {
                opt.Window = TimeSpan.FromMinutes(1);
                opt.PermitLimit = 50;
                opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;
            });

            // User profile updates: 20 requests per minute per user
            options.AddFixedWindowLimiter("profile", opt =>
            {
                opt.Window = TimeSpan.FromMinutes(1);
                opt.PermitLimit = 20;
                opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;
            });

            // Bulk operations: 10 requests per minute per user
            options.AddFixedWindowLimiter("bulk", opt =>
            {
                opt.Window = TimeSpan.FromMinutes(1);
                opt.PermitLimit = 10;
                opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;
            });

            // Configure rejection response
            options.OnRejected = async (context, token) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = retryAfter.TotalSeconds.ToString();
                    
                    await context.HttpContext.Response.WriteAsJsonAsync(new
                    {
                        error = "Too Many Requests",
                        detail = "Rate limit exceeded. Please try again later.",
                        retryAfterSeconds = (int)retryAfter.TotalSeconds
                    }, cancellationToken: token);
                }
                else
                {
                    await context.HttpContext.Response.WriteAsJsonAsync(new
                    {
                        error = "Too Many Requests",
                        detail = "Rate limit exceeded. Please try again later."
                    }, cancellationToken: token);
                }
            };
        });

        return services;
    }
}
