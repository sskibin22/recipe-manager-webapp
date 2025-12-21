namespace RecipeManager.Api.Services;

/// <summary>
/// Service for accessing the current user's context from HTTP requests.
/// </summary>
public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Gets the current user's ID from the claims principal.
    /// </summary>
    /// <returns>The user ID if available, otherwise null.</returns>
    public Guid? GetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null) return null;

        // Check for the db_user_id claim added by middleware
        var dbUserIdClaim = user.FindFirst("db_user_id");
        if (dbUserIdClaim != null && Guid.TryParse(dbUserIdClaim.Value, out var userId))
        {
            return userId;
        }

        return null;
    }
}
