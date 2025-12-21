using RecipeManager.Api.Models;

namespace RecipeManager.Api.DTOs.Requests;

public record UpdateRecipeRequest(
    string Title,
    RecipeType Type,
    string? Url,
    string? StorageKey,
    string? Content,
    string? PreviewImageUrl,
    string? Description,
    string? SiteName,
    int? CategoryId,
    List<int>? TagIds
);
