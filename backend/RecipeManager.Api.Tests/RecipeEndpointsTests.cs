using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
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
        
        // The test user will be created automatically by UserEnsurerMiddleware
        // with the AuthSub configured in CustomWebApplicationFactory
        // We need to find or wait for it to be created
        var testUser = _db.Users.FirstOrDefault(u => u.AuthSub == "test-auth-sub");
        if (testUser != null)
        {
            _testUserId = testUser.Id;
        }
        else
        {
            // Create test user if it doesn't exist yet
            _testUserId = Guid.NewGuid();
            testUser = new User
            {
                Id = _testUserId,
                AuthSub = "test-auth-sub",
                Email = "test@example.com",
                DisplayName = "Test User",
                CreatedAt = DateTime.UtcNow
            };
            _db.Users.Add(testUser);
            _db.SaveChanges();
        }
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
        Assert.That(recipe, Is.Not.Null);
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
        
        // Detach to avoid tracking conflicts
        _db.Entry(recipe).State = EntityState.Detached;

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
    public async Task UpdateRecipe_WithNewStorageKey_UpdatesDocument()
    {
        // Arrange
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Document Recipe",
            Type = RecipeType.Document,
            StorageKey = "users/test/old-file.pdf",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe);
        await _db.SaveChangesAsync();
        
        // Detach to avoid tracking conflicts
        _db.Entry(recipe).State = EntityState.Detached;

        var newStorageKey = "users/test/new-file.pdf";
        var updateRequest = new
        {
            title = "Updated Document Recipe",
            type = "Document",
            storageKey = newStorageKey
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/recipes/{recipe.Id}", updateRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify the storage key was updated
        var updatedRecipe = await _db.Recipes.FindAsync(recipe.Id);
        updatedRecipe.Should().NotBeNull();
        updatedRecipe!.StorageKey.Should().Be(newStorageKey);
        updatedRecipe.Title.Should().Be("Updated Document Recipe");
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
        
        // Detach the recipe so we can query fresh from the database
        _db.Entry(recipe).State = EntityState.Detached;

        // Act
        var response = await _client.DeleteAsync($"/api/recipes/{recipe.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Verify deletion - query fresh from database
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
        
        // Detach to avoid tracking conflicts
        _db.Entry(recipe).State = EntityState.Detached;

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

    [Test]
    public async Task GetRecipes_WithCategoryFilter_ReturnsFilteredRecipes()
    {
        // Arrange
        var category1 = new Category { Name = "Dessert", Color = "#FF0000" };
        var category2 = new Category { Name = "Main Course", Color = "#00FF00" };
        _db.Categories.AddRange(category1, category2);
        await _db.SaveChangesAsync();

        var recipe1 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Chocolate Cake",
            Type = RecipeType.Manual,
            Content = "Test content",
            CategoryId = category1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe2 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Pasta Carbonara",
            Type = RecipeType.Manual,
            Content = "Test content",
            CategoryId = category2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe3 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Tiramisu",
            Type = RecipeType.Manual,
            Content = "Test content",
            CategoryId = category1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3);
        await _db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/recipes?category={category1.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var recipes = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        recipes.Should().NotBeNull();
        recipes.Should().HaveCount(2);
    }

    [Test]
    public async Task GetRecipes_WithTagFilter_ReturnsFilteredRecipes()
    {
        // Arrange
        var tag1 = new Tag { Name = "Vegetarian", Color = "#00FF00", Type = TagType.Dietary };
        var tag2 = new Tag { Name = "Quick", Color = "#0000FF", Type = TagType.PrepTime };
        _db.Tags.AddRange(tag1, tag2);
        await _db.SaveChangesAsync();

        var recipe1 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Veggie Salad",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe2 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Quick Pasta",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe3 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Quick Veggie Stir Fry",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3);
        
        // Add tags to recipes
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe1.Id, TagId = tag1.Id }); // Veggie Salad - Vegetarian
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe2.Id, TagId = tag2.Id }); // Quick Pasta - Quick
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe3.Id, TagId = tag1.Id }); // Quick Veggie Stir Fry - Vegetarian
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe3.Id, TagId = tag2.Id }); // Quick Veggie Stir Fry - Quick
        await _db.SaveChangesAsync();

        // Act - Filter by single tag (Vegetarian)
        var response = await _client.GetAsync($"/api/recipes?tags={tag1.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var recipes = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        recipes.Should().NotBeNull();
        recipes.Should().HaveCount(2); // Veggie Salad and Quick Veggie Stir Fry
    }

    [Test]
    public async Task GetRecipes_WithMultipleTagFilter_ReturnsRecipesWithAllTags()
    {
        // Arrange
        var tag1 = new Tag { Name = "Vegetarian", Color = "#00FF00", Type = TagType.Dietary };
        var tag2 = new Tag { Name = "Quick", Color = "#0000FF", Type = TagType.PrepTime };
        _db.Tags.AddRange(tag1, tag2);
        await _db.SaveChangesAsync();

        var recipe1 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Veggie Salad",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe2 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Quick Pasta",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe3 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Quick Veggie Stir Fry",
            Type = RecipeType.Manual,
            Content = "Test content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3);
        
        // Add tags to recipes
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe1.Id, TagId = tag1.Id }); // Veggie Salad - Vegetarian only
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe2.Id, TagId = tag2.Id }); // Quick Pasta - Quick only
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe3.Id, TagId = tag1.Id }); // Quick Veggie Stir Fry - Vegetarian
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe3.Id, TagId = tag2.Id }); // Quick Veggie Stir Fry - Quick
        await _db.SaveChangesAsync();

        // Act - Filter by both tags (must have ALL tags)
        var response = await _client.GetAsync($"/api/recipes?tags={tag1.Id},{tag2.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var recipes = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        recipes.Should().NotBeNull();
        recipes.Should().HaveCount(1); // Only Quick Veggie Stir Fry has both tags
    }

    [Test]
    public async Task GetRecipes_WithSearchAndCategoryAndTags_AppliesAllFilters()
    {
        // Arrange
        var category = new Category { Name = "Main Course", Color = "#00FF00" };
        var tag = new Tag { Name = "Vegetarian", Color = "#00FF00", Type = TagType.Dietary };
        _db.Categories.Add(category);
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync();

        var recipe1 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Veggie Pasta",
            Type = RecipeType.Manual,
            Content = "Test content",
            CategoryId = category.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe2 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Veggie Pizza",
            Type = RecipeType.Manual,
            Content = "Test content",
            CategoryId = category.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var recipe3 = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Chicken Pasta",
            Type = RecipeType.Manual,
            Content = "Test content",
            CategoryId = category.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3);
        
        // Add vegetarian tag only to veggie recipes
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe1.Id, TagId = tag.Id });
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe2.Id, TagId = tag.Id });
        await _db.SaveChangesAsync();

        // Act - Filter by search term, category, and tag
        var response = await _client.GetAsync($"/api/recipes?q=Pasta&category={category.Id}&tags={tag.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var recipes = await response.Content.ReadFromJsonAsync<List<dynamic>>();
        recipes.Should().NotBeNull();
        recipes.Should().HaveCount(1); // Only Veggie Pasta matches all criteria
    }
}
