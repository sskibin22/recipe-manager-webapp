using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using RecipeManager.Api.Data;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Tests;

[TestFixture]
public class RecipeEndpointsTests
{
    private CustomWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;
    private ApplicationDbContext _db = null!;
    private Guid _testUserId;

    [SetUp]
    public void Setup()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
        
        // Get database context for test setup
        var scope = _factory.Services.CreateScope();
        _db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Create test user
        _testUserId = Guid.NewGuid();
        var testUser = new User
        {
            Id = _testUserId,
            AuthSub = "test-auth-sub",
            Email = "test@example.com",
            DisplayName = "Test User",
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(testUser);
        _db.SaveChanges();

        // Add test claim header for development authentication bypass
        _client.DefaultRequestHeaders.Add("X-Test-User-Id", _testUserId.ToString());
    }

    [TearDown]
    public void TearDown()
    {
        _db.Database.EnsureDeleted();
        _db.Dispose();
        _client.Dispose();
        _factory.Dispose();
    }

    [Test]
    public async Task HealthCheck_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Test]
    public async Task CreateRecipe_WithValidLinkData_ReturnsCreated()
    {
        // Arrange
        var request = new
        {
            title = "Test Recipe",
            type = "Link",
            url = "https://example.com/recipe"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/recipes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var recipe = await response.Content.ReadFromJsonAsync<dynamic>();
        recipe.Should().NotBeNull();
    }

    [Test]
    public async Task CreateRecipe_WithValidManualData_ReturnsCreated()
    {
        // Arrange
        var request = new
        {
            title = "Manual Recipe",
            type = "Manual",
            content = "Test recipe content"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/recipes", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Test]
    public async Task GetRecipes_ReturnsOk_WithUserRecipes()
    {
        // Arrange - Create a test recipe
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Test Recipe",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/recipes");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var recipes = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        recipes.Should().NotBeNull();
        recipes.Should().HaveCountGreaterThan(0);
    }

    [Test]
    public async Task GetRecipes_WithSearchQuery_ReturnsFilteredRecipes()
    {
        // Arrange
        var recipe1 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Chocolate Cake",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe2 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Vanilla Ice Cream",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.AddRange(recipe1, recipe2);
        await _db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/recipes?q=Chocolate");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var recipes = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        recipes.Should().NotBeNull();
        recipes.Should().HaveCount(1);
    }

    [Test]
    public async Task GetRecipe_WithValidId_ReturnsOk()
    {
        // Arrange
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Test Recipe",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/recipes/{recipe.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetRecipe_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/recipes/{invalidId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Test]
    public async Task UpdateRecipe_WithValidData_ReturnsOk()
    {
        // Arrange
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Original Title",
            Type = RecipeType.Manual,
            Content = "Original content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync();

        var updateRequest = new
        {
            title = "Updated Title",
            type = "Manual",
            content = "Updated content"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/recipes/{recipe.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task DeleteRecipe_WithValidId_ReturnsNoContent()
    {
        // Arrange
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Recipe to Delete",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/recipes/{recipe.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deletion
        var deletedRecipe = await _db.Recipes.FindAsync(recipe.Id);
        deletedRecipe.Should().BeNull();
    }

    [Test]
    public async Task AddFavorite_WithValidRecipeId_ReturnsCreated()
    {
        // Arrange
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Favorite Recipe",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync();

        // Act
        var response = await _client.PostAsync($"/api/recipes/{recipe.Id}/favorite", null);

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
    }

    [Test]
    public async Task RemoveFavorite_WithValidRecipeId_ReturnsNoContent()
    {
        // Arrange
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Favorite Recipe",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var favorite = new Favorite
        {
            UserId = _testUserId,
            RecipeId = recipe.Id,
            CreatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe);
        _db.Favorites.Add(favorite);
        await _db.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/recipes/{recipe.Id}/favorite");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
