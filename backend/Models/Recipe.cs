using System;
using System.Collections.Generic;

namespace RecipeManager.Api.Models;

public enum RecipeType
{
    Manual = 0,
    Link = 1,
    Document = 2
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

    public byte[]? FileContent { get; set; }

    public string? FileContentType { get; set; }

    public string? PreviewImageUrl { get; set; }

    public string? Description { get; set; }

    public string? SiteName { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();

    public virtual User User { get; set; } = null!;
}
