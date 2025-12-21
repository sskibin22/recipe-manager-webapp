using RecipeManager.Api.Models;

namespace RecipeManager.Api.DTOs.Responses;

public record TagResponse(
    int Id,
    string Name,
    string Color,
    TagType Type
);
