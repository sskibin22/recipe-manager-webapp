namespace RecipeManager.Api.DTOs.Responses;

/// <summary>
/// Response DTO for collection details
/// </summary>
public record CollectionResponse
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Name { get; init; } = null!;
    public string? Description { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public int RecipeCount { get; init; }
}
