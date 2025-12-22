using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

/// <summary>
/// Request DTO for updating an existing collection
/// </summary>
public class UpdateCollectionRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [MaxLength(500)]
    public string? Description { get; set; }
}
