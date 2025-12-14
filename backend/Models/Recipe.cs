using System;
using System.Collections.Generic;

namespace RecipeManager.Api.Models;

public enum RecipeType
{
    Manual = 0,
    Link = 1,
    Upload = 2
}

public partial class Recipe
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Title { get; set; } = null!;

    public RecipeType Type { get; set; }

    public string? Url { get; set; }

    public string? StorageKey { get; set; }

    public string? Content { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();

    public virtual User User { get; set; } = null!;
}
