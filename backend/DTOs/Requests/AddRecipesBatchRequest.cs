using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

/// <summary>
/// Request to add multiple recipes to a collection
/// </summary>
public class AddRecipesBatchRequest
{
    /// <summary>
    /// Array of recipe IDs to add to the collection
    /// </summary>
    [Required]
    public List<Guid> RecipeIds { get; set; } = new();
}
