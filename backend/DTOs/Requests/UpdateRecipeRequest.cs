using System.ComponentModel.DataAnnotations;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.DTOs.Requests;

public record UpdateRecipeRequest(
    [Required(ErrorMessage = "Title is required")]
    [StringLength(500, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 500 characters")]
    string Title,
    
    [Required(ErrorMessage = "Recipe type is required")]
    RecipeType Type,
    
    [Url(ErrorMessage = "URL must be a valid URL")]
    [StringLength(2000, ErrorMessage = "URL must not exceed 2000 characters")]
    string? Url,
    
    [StringLength(500, ErrorMessage = "Storage key must not exceed 500 characters")]
    string? StorageKey,
    
    [MaxLength(100000, ErrorMessage = "Content must not exceed 100000 characters")]
    string? Content,
    
    [Url(ErrorMessage = "Preview image URL must be a valid URL")]
    [StringLength(2000, ErrorMessage = "Preview image URL must not exceed 2000 characters")]
    string? PreviewImageUrl,
    
    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters")]
    string? Description,
    
    [StringLength(256, ErrorMessage = "Site name must not exceed 256 characters")]
    string? SiteName,
    
    int? CategoryId,
    
    List<int>? TagIds
);
