using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

public class PresignUploadRequest
{
    [Required(ErrorMessage = "File name is required")]
    [StringLength(500, MinimumLength = 1, ErrorMessage = "File name must be between 1 and 500 characters")]
    public string FileName { get; set; } = null!;

    [Required(ErrorMessage = "Content type is required")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Content type must be between 1 and 100 characters")]
    public string ContentType { get; set; } = null!;
}
