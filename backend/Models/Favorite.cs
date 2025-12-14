namespace RecipeManager.Api.Models;

public class Favorite
{
    public Guid UserId { get; set; }
    public Guid RecipeId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public Recipe Recipe { get; set; } = null!;
}
