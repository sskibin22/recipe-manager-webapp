using System.ComponentModel.DataAnnotations;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.DTOs.Requests;

public class CreateRecipeRequest
{
    [Required(ErrorMessage = "Title is required")]
    [StringLength(500, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 500 characters")]
    public string Title { get; set; } = null!;

    [Required(ErrorMessage = "Recipe type is required")]
    public RecipeType Type { get; set; }

    [Url(ErrorMessage = "URL must be a valid URL")]
    [StringLength(2000, ErrorMessage = "URL must not exceed 2000 characters")]
    public string? Url { get; set; }

    [StringLength(500, ErrorMessage = "Storage key must not exceed 500 characters")]
    public string? StorageKey { get; set; }

    [MaxLength(100000, ErrorMessage = "Content must not exceed 100000 characters")]
    public string? Content { get; set; }

    [Url(ErrorMessage = "Preview image URL must be a valid URL")]
    [StringLength(2000, ErrorMessage = "Preview image URL must not exceed 2000 characters")]
    public string? PreviewImageUrl { get; set; }

    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    public string? Description { get; set; }

    [StringLength(256, ErrorMessage = "Site name must not exceed 256 characters")]
    public string? SiteName { get; set; }

    public int? CategoryId { get; set; }

    public List<int>? TagIds { get; set; }
}
