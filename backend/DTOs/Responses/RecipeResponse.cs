using RecipeManager.Api.Models;

namespace RecipeManager.Api.DTOs.Responses;

public record RecipeResponse(
    Guid Id,
    string Title,
    RecipeType Type,
    string? Url,
    string? StorageKey,
    string? Content,
    string? PreviewImageUrl,
    string? Description,
    string? SiteName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string? FileContent,
    string? FileContentType,
    bool IsFavorite,
    CategoryResponse? Category,
    List<TagResponse> Tags
);
