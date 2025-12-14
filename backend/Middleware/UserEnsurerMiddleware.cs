using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.Models;
using System.Security.Claims;

namespace RecipeManager.Api.Middleware;

public class UserEnsurerMiddleware
{
    private readonly RequestDelegate _next;

    public UserEnsurerMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var authSub = context.User.FindFirst("user_id")?.Value ?? context.User.FindFirst("sub")?.Value;
            var email = context.User.FindFirst(ClaimTypes.Email)?.Value ?? context.User.FindFirst("email")?.Value;
            var displayName = context.User.FindFirst(ClaimTypes.Name)?.Value ?? context.User.FindFirst("name")?.Value;

            if (!string.IsNullOrEmpty(authSub))
            {
                var user = await dbContext.Users.FirstOrDefaultAsync(u => u.AuthSub == authSub);

                if (user == null)
                {
                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        AuthSub = authSub,
                        Email = email,
                        DisplayName = displayName,
                        CreatedAt = DateTime.UtcNow
                    };

                    dbContext.Users.Add(user);
                    await dbContext.SaveChangesAsync();
                }

                // Add user ID to claims for easy access in endpoints
                var identity = context.User.Identity as ClaimsIdentity;
                identity?.AddClaim(new Claim("db_user_id", user.Id.ToString()));
            }
        }

        await _next(context);
    }
}
