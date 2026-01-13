using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace RecipeManager.Api.DTOs.Requests;

/// <summary>
/// Request to delete multiple collections
/// </summary>
public class DeleteCollectionsBatchRequest
{
    /// <summary>
    /// Array of collection IDs to delete
    /// </summary>
    [Required]
    public List<Guid> CollectionIds { get; set; } = new();
}
