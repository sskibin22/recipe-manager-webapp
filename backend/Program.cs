using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RecipeManager.Api.Data;
using RecipeManager.Api.Endpoints;
using RecipeManager.Api.Mapping;
using RecipeManager.Api.Middleware;
using RecipeManager.Api.Services;
using System.Text.Json.Serialization;
using RecipeManager.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddScoped<IStorageService, StorageService>();
builder.Services.AddScoped<IMetadataService, MetadataService>();
builder.Services.AddScoped<RecipeMapper>();
builder.Services.AddHttpClient("MetadataClient")
    .ConfigureHttpClient(client =>
    {
        client.Timeout = TimeSpan.FromSeconds(10);
        client.DefaultRequestHeaders.Add("Accept", "text/html");
    });
builder.Services.AddSingleton<IFileCacheService, FileCacheService>();
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddCorsServices(builder.Configuration);
builder.Services.AddAuthenticationServices(builder.Configuration);

var app = builder.Build();

// Configure middleware and map endpoints
app.ConfigureMiddleware(builder.Configuration);
app.MapApplicationEndpoints();

app.Run();

// Make Program accessible to tests
public partial class Program { }
