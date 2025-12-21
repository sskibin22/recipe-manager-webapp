using System.Security.Claims;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Requests;

namespace RecipeManager.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/user/profile", async (ApplicationDbContext db, ClaimsPrincipal user) =>
        {
            var userId = EndpointHelpers.GetUserId(user);
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
            var userId = EndpointHelpers.GetUserId(user);
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

        return app;
    }
}

