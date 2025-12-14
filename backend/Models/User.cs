namespace RecipeManager.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public required string AuthSub { get; set; }
    public string? Email { get; set; }
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}
