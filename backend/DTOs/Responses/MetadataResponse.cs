namespace RecipeManager.Api.DTOs.Responses;

public record MetadataResponse(
    string? Title,
    string? Description,
    string? ImageUrl,
    string? SiteName
);
