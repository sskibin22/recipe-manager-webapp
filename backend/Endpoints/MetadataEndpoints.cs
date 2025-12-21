using System.Security.Claims;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class MetadataEndpoints
{
    public static IEndpointRouteBuilder MapMetadataEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/recipes/fetch-metadata", async (FetchMetadataRequest request, IMetadataService metadataService, ClaimsPrincipal user) =>
        {
            var userId = EndpointHelpers.GetUserId(user);
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

        return app;
    }
}

record FetchMetadataRequest(string Url);
