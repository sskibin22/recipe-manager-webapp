using System;
using System.Collections.Generic;

namespace RecipeManager.Api.Models;

public class Category
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Color { get; set; } = "#6B7280"; // Default gray color

    public virtual ICollection<Recipe> Recipes { get; set; } = new List<Recipe>();
}
