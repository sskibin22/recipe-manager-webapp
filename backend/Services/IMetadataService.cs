namespace RecipeManager.Api.Services;

public interface IMetadataService
{
    Task<RecipeMetadata?> FetchMetadataAsync(string url);
}

public record RecipeMetadata(
    string? Title,
    string? Description,
    string? ImageUrl,
    string? SiteName
);
