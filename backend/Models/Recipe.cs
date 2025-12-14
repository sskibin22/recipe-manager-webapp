namespace RecipeManager.Api.Models;

public enum RecipeType
{
    Link,
    Document,
    Manual
}

public class Recipe
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Title { get; set; }
    public RecipeType Type { get; set; }
    public string? Url { get; set; }
    public string? StorageKey { get; set; }
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}
