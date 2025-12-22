using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

/// <summary>
/// Request to remove multiple recipes from a collection
/// </summary>
public class RemoveRecipesBatchRequest
{
    /// <summary>
    /// Array of recipe IDs to remove from the collection
    /// </summary>
    [Required]
    public List<Guid> RecipeIds { get; set; } = new();
}
