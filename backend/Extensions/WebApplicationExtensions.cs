using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RecipeManager.Api.Endpoints;
using RecipeManager.Api.Middleware;
using System.Text.Json;

namespace RecipeManager.Api.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureMiddleware(
        this WebApplication app,
        IConfiguration configuration)
    {
        // Development middleware
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseCors();

        // Add rate limiting middleware
        app.UseRateLimiter();

        // Development authentication bypass
        if (app.Environment.IsDevelopment())
        {
            var bypassAuth = configuration.GetValue<bool>("Development:BypassAuthentication");
            if (bypassAuth)
            {
                app.UseMiddleware<DevelopmentAuthMiddleware>();
            }
        }

        // Authentication and Authorization
        var firebaseProjectId = configuration["Firebase:ProjectId"];
        if (!string.IsNullOrEmpty(firebaseProjectId) &&
            firebaseProjectId != "your-firebase-project-id")
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

        return app;
    }

    public static WebApplication MapApplicationEndpoints(this WebApplication app)
    {
        // Map health check endpoints first (no authentication required)
        app.MapHealthCheckEndpoints();

        app.MapHealthEndpoints();
        app.MapMetadataEndpoints();
        app.MapRecipeEndpoints();
        app.MapFavoriteEndpoints();
        app.MapCollectionEndpoints();
        app.MapUploadEndpoints();
        app.MapUserEndpoints();
        app.MapCategoryEndpoints();
        app.MapTagEndpoints();

        if (app.Environment.IsDevelopment())
        {
            app.MapDevelopmentEndpoints();
        }

        return app;
    }

    private static IEndpointRouteBuilder MapHealthCheckEndpoints(this IEndpointRouteBuilder app)
    {
        // Liveness probe - just checks if the app is running
        app.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false, // Don't run any checks, just return if app is responding
            ResponseWriter = WriteHealthCheckResponse
        })
        .WithName("LivenessCheck")
        .WithOpenApi()
        .AllowAnonymous();

        // Readiness probe - checks if dependencies are ready
        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("ready"),
            ResponseWriter = WriteHealthCheckResponse
        })
        .WithName("ReadinessCheck")
        .WithOpenApi()
        .AllowAnonymous();

        return app;
    }

    private static Task WriteHealthCheckResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            duration = report.TotalDuration.TotalMilliseconds,
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration.TotalMilliseconds,
                data = entry.Value.Data
            })
        };

        return context.Response.WriteAsJsonAsync(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        });
    }
}
