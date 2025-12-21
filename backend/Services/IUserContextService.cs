namespace RecipeManager.Api.Services;

/// <summary>
/// Service for accessing the current user's context from HTTP requests.
/// </summary>
public interface IUserContextService
{
    /// <summary>
    /// Gets the current user's ID from the claims principal.
    /// </summary>
    /// <returns>The user ID if available, otherwise null.</returns>
    Guid? GetCurrentUserId();
}
