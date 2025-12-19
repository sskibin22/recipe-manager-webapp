using System;
using System.Collections.Generic;

namespace RecipeManager.Api.Models;

public enum TagType
{
    Dietary = 0,
    PrepTime = 1,
    Cuisine = 2,
    Custom = 3
}

public class Tag
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Color { get; set; } = "#6B7280"; // Default gray color

    public TagType Type { get; set; }

    public virtual ICollection<RecipeTag> RecipeTags { get; set; } = new List<RecipeTag>();
}
