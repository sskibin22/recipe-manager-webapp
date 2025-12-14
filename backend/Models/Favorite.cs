using System;
using System.Collections.Generic;

namespace RecipeManager.Api.Models;

public partial class Favorite
{
    public Guid UserId { get; set; }

    public Guid RecipeId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Recipe Recipe { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
