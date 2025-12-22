using System;

namespace RecipeManager.Api.Models;

public partial class CollectionRecipe
{
    public Guid CollectionId { get; set; }

    public Guid RecipeId { get; set; }

    public DateTime AddedAt { get; set; }

    public virtual Collection Collection { get; set; } = null!;

    public virtual Recipe Recipe { get; set; } = null!;
}
