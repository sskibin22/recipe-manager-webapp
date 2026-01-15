using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

public record UpdateUserProfileRequest(
    [EmailAddress(ErrorMessage = "Email must be a valid email address")]
    [StringLength(256, ErrorMessage = "Email must not exceed 256 characters")]
    string? Email,
    
    [StringLength(256, ErrorMessage = "Display name must not exceed 256 characters")]
    string? DisplayName
);
