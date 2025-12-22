using RecipeManager.Api.Endpoints;
using RecipeManager.Api.Middleware;

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
}
