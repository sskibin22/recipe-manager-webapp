using System;
using System.Collections.Generic;

namespace RecipeManager.Api.Models;

public partial class User
{
    public Guid Id { get; set; }

    public string AuthSub { get; set; } = null!;

    public string? Email { get; set; }

    public string? DisplayName { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();

    public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
}
