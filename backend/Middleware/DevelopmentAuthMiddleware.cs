using System.Security.Claims;

namespace RecipeManager.Api.Middleware;

/// <summary>
/// Middleware that bypasses authentication in development mode by injecting a test user.
/// This should ONLY be used in Development environment.
/// </summary>
public class DevelopmentAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public DevelopmentAuthMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _next = next;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only bypass auth in Development environment when explicitly enabled
        var bypassAuth = _configuration.GetValue<bool>("Development:BypassAuthentication");
        
        if (_environment.IsDevelopment() && bypassAuth && !context.User.Identity!.IsAuthenticated)
        {
            var authSub = _configuration["Development:TestUser:AuthSub"] ?? "dev-user-001";
            var email = _configuration["Development:TestUser:Email"] ?? "dev@localhost.com";
            var displayName = _configuration["Development:TestUser:DisplayName"] ?? "Dev User";

            var claims = new List<Claim>
            {
                new Claim("sub", authSub),
                new Claim("user_id", authSub),
                new Claim(ClaimTypes.Email, email),
                new Claim("email", email),
                new Claim(ClaimTypes.Name, displayName),
                new Claim("name", displayName),
                new Claim("auth_time", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()),
            };

            var identity = new ClaimsIdentity(claims, "DevBypass");
            context.User = new ClaimsPrincipal(identity);
        }

        await _next(context);
    }
}
