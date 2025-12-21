using Microsoft.AspNetCore.Mvc;

namespace RecipeManager.Api.DTOs.Queries;

/// <summary>
/// Query parameters for filtering recipes
/// </summary>
public class RecipeQueryParameters
{
    /// <summary>
    /// Search term to filter recipes by title
    /// </summary>
    [FromQuery(Name = "q")]
    public string? SearchTerm { get; set; }
    
    /// <summary>
    /// Filter by category ID
    /// </summary>
    [FromQuery(Name = "category")]
    public int? CategoryId { get; set; }
    
    /// <summary>
    /// Comma-separated tag IDs for filtering (recipes must have ALL specified tags)
    /// </summary>
    [FromQuery(Name = "tags")]
    public string? Tags { get; set; }
    
    // Future expansion possibilities:
    // public int PageNumber { get; set; } = 1;
    // public int PageSize { get; set; } = 20;
    // public string? SortBy { get; set; }
    // public string? SortOrder { get; set; } = "desc";
    // public bool? FavoritesOnly { get; set; }
    // public RecipeType? Type { get; set; }
    
    /// <summary>
    /// Parse comma-separated tag IDs into integer list
    /// </summary>
    /// <returns>List of valid tag IDs (invalid values are skipped)</returns>
    public List<int> GetTagIds()
    {
        if (string.IsNullOrWhiteSpace(Tags))
            return new List<int>();
            
        return Tags
            .Split(',')
            .Select(t => int.TryParse(t.Trim(), out var id) ? id : 0)
            .Where(id => id > 0)
            .ToList();
    }
}
