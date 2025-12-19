using System;

namespace RecipeManager.Api.Models;

public class RecipeTag
{
    public Guid RecipeId { get; set; }

    public int TagId { get; set; }

    public virtual Recipe Recipe { get; set; } = null!;

    public virtual Tag Tag { get; set; } = null!;
}
