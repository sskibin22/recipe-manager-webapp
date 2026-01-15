using RecipeManager.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure AllowedHosts from environment variable
// This allows runtime configuration for production deployments
var allowedHosts = Environment.GetEnvironmentVariable("ALLOWED_HOSTS");
if (!string.IsNullOrEmpty(allowedHosts))
{
    builder.Configuration["AllowedHosts"] = allowedHosts;
}

// Add services
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddCorsServices(builder.Configuration);
builder.Services.AddAuthenticationServices(builder.Configuration);
builder.Services.AddRateLimitingServices(builder.Configuration);

var app = builder.Build();

// Configure middleware and map endpoints
app.ConfigureMiddleware(builder.Configuration);
app.MapApplicationEndpoints();

app.Run();

// Make Program accessible to tests
public partial class Program { }
