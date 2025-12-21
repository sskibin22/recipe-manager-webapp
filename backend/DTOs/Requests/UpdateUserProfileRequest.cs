namespace RecipeManager.Api.DTOs.Requests;

public record UpdateUserProfileRequest(
    string? Email,
    string? DisplayName
);
