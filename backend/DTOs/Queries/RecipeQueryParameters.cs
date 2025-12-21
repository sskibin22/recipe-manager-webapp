namespace RecipeManager.Api.DTOs.Queries;

public record RecipeQueryParameters(
    string? Q,
    int? Category,
    string? Tags
);
