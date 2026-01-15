using System.Security.Claims;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.Extensions;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class MetadataEndpoints
{
    public static IEndpointRouteBuilder MapMetadataEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/recipes/fetch-metadata", async (FetchMetadataRequest request, IMetadataService metadataService, IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            if (string.IsNullOrWhiteSpace(request.Url))
            {
                return ProblemDetailsExtensions.BadRequestProblem(
                    title: "Invalid Request",
                    detail: "URL is required to fetch metadata."
                );
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
        .RequireRateLimiting("metadata")
        .WithName("FetchMetadata")
        .WithOpenApi();

        return app;
    }
}

