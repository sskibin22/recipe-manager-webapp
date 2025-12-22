using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

/// <summary>
/// Request DTO for creating a new collection
/// </summary>
public class CreateCollectionRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageStorageKey { get; set; }

    /// <summary>
    /// Base64-encoded image data (data URI format: "data:image/png;base64,...")
    /// Used for SQLite storage in local development
    /// </summary>
    public string? PreviewImageData { get; set; }
}
