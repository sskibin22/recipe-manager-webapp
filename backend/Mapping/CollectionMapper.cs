using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Mapping;

public static class CollectionMapper
{
    /// <summary>
    /// Maps a Collection entity to a CollectionResponse DTO
    /// </summary>
    public static CollectionResponse ToResponse(Collection collection)
    {
        return new CollectionResponse
        {
            Id = collection.Id,
            UserId = collection.UserId,
            Name = collection.Name,
            Description = collection.Description,
            CreatedAt = collection.CreatedAt,
            UpdatedAt = collection.UpdatedAt,
            RecipeCount = collection.CollectionRecipes?.Count ?? 0
        };
    }
}
