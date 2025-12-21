namespace RecipeManager.Api.DTOs.Responses;

public record UserProfileResponse(
    Guid Id,
    string? Email,
    string? DisplayName
);
