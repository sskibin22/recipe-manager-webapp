using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

public record FetchMetadataRequest(
    [Required(ErrorMessage = "URL is required")]
    [Url(ErrorMessage = "URL must be a valid URL")]
    [StringLength(2000, ErrorMessage = "URL must not exceed 2000 characters")]
    string Url
);
