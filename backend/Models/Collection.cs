using System;
using System.Collections.Generic;

namespace RecipeManager.Api.Models;

public partial class Collection
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? ImageStorageKey { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual ICollection<CollectionRecipe> CollectionRecipes { get; set; } = new List<CollectionRecipe>();
}
