using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Queries;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.Mapping;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Tests.Services;

[TestFixture]
public class RecipeServiceTests
{
    private ApplicationDbContext _db = null!;
    private Mock<IFileCacheService> _fileCacheMock = null!;
    private Mock<IStorageService> _storageMock = null!;
    private Mock<ILogger<RecipeMapper>> _mapperLoggerMock = null!;
    private Mock<ILogger<RecipeService>> _serviceLoggerMock = null!;
    private RecipeMapper _mapper = null!;
    private RecipeService _service = null!;
    private Guid _testUserId;
    private User _testUser = null!;

    [SetUp]
    public void Setup()
    {
        // Setup in-memory database
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"TestDb_{Guid.NewGuid()}")
            .Options;
        _db = new ApplicationDbContext(options};

        // Create test user
        _testUserId = Guid.NewGuid(};
        _testUser = new User
        {
            Id = _testUserId,
            AuthSub = "test-auth-sub",
            Email = "test@example.com",
            DisplayName = "Test User",
            CreatedAt = DateTime.UtcNow
        };
        _db.Users.Add(_testUser};
        _db.SaveChanges(};

        // Setup mocks
        _fileCacheMock = new Mock<IFileCacheService>(};
        _storageMock = new Mock<IStorageService>(};
        _mapperLoggerMock = new Mock<ILogger<RecipeMapper>>(};
        _serviceLoggerMock = new Mock<ILogger<RecipeService>>(};

        // Create mapper and service
        _mapper = new RecipeMapper(_storageMock.Object, _mapperLoggerMock.Object};
        _service = new RecipeService(_db, _fileCacheMock.Object, _mapper, _serviceLoggerMock.Object};
    }

    [TearDown]
    public void TearDown()
    {
        _db.Database.EnsureDeleted(};
        _db.Dispose(};
    }

    [Test]
    public async Task CreateRecipeAsync_WithLinkRecipe_CreatesRecipeSuccessfully()
    {
        // Arrange
        var request = new CreateRecipeRequest {
            Title = "Test Recipe",
            Type = RecipeType.Link,
            Url = "https://example.com/recipe",
            StorageKey = null,
            Content = null,
            PreviewImageUrl = "https://example.com/image.jpg",
            Description = "Test description",
            SiteName = "Example Site",
            CategoryId = null,
            TagIds = null
        };

        // Act
        var result = await _service.CreateRecipeAsync(request, _testUserId};

        // Assert
        result.Should().NotBeNull(};
        result.Title.Should().Be("Test Recipe"};
        result.Type.Should().Be(RecipeType.Link};
        result.Url.Should().Be("https://example.com/recipe"};
        result.Description.Should().Be("Test description"};
        result.SiteName.Should().Be("Example Site"};

        var dbRecipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Id == result.Id};
        dbRecipe.Should().NotBeNull(};
        dbRecipe!.UserId.Should().Be(_testUserId};
    }

    [Test]
    public async Task CreateRecipeAsync_WithDocumentAndCachedFile_SavesFileContent()
    {
        // Arrange
        var fileContent = new byte[] { 1, 2, 3, 4, 5 };
        var contentType = "application/pdf";
        var storageKey = "test-storage-key";

        _fileCacheMock
            .Setup(x => x.TryGetFromCache(storageKey, out It.Ref<byte[]>.IsAny, out It.Ref<string>.IsAny))
            .Returns((string key, out byte[] content, out string ct) =>
            {
                content = fileContent;
                ct = contentType;
                return true;
            }};

        var request = new CreateRecipeRequest {
            Title = "Document Recipe",
            Type = RecipeType.Document,
            Url = null,
            StorageKey = storageKey,
            Content = null,
            PreviewImageUrl = null,
            Description = "Test document",
            SiteName = null,
            CategoryId = null,
            TagIds = null
        };

        // Act
        var result = await _service.CreateRecipeAsync(request, _testUserId};

        // Assert
        result.Should().NotBeNull(};
        result.FileContentType.Should().Be(contentType};
        result.FileContent.Should().NotBeNullOrEmpty(};

        _fileCacheMock.Verify(x => x.RemoveFromCache(storageKey), Times.Once};

        var dbRecipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Id == result.Id};
        dbRecipe.Should().NotBeNull(};
        dbRecipe!.FileContent.Should().BeEquivalentTo(fileContent};
        dbRecipe.FileContentType.Should().Be(contentType};
    }

    [Test]
    public async Task CreateRecipeAsync_WithCachedPreviewImage_SavesPreviewImage()
    {
        // Arrange
        var imageContent = new byte[] { 10, 20, 30, 40, 50 };
        var imageContentType = "image/jpeg";
        var previewImageUrl = "preview-cache-key";

        _fileCacheMock
            .Setup(x => x.TryGetFromCache(previewImageUrl, out It.Ref<byte[]>.IsAny, out It.Ref<string>.IsAny))
            .Returns((string key, out byte[] content, out string ct) =>
            {
                content = imageContent;
                ct = imageContentType;
                return true;
            }};

        var request = new CreateRecipeRequest {
            Title = "Recipe with Image",
            Type = RecipeType.Manual,
            Url = null,
            StorageKey = null,
            Content = "Recipe content",
            PreviewImageUrl = previewImageUrl,
            Description = "Test recipe",
            SiteName = null,
            CategoryId = null,
            TagIds = null
        };

        // Act
        var result = await _service.CreateRecipeAsync(request, _testUserId};

        // Assert
        result.Should().NotBeNull(};
        result.PreviewImageUrl.Should().NotBeNullOrEmpty(};

        _fileCacheMock.Verify(x => x.RemoveFromCache(previewImageUrl), Times.Once};

        var dbRecipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Id == result.Id};
        dbRecipe.Should().NotBeNull(};
        dbRecipe!.PreviewImageContent.Should().BeEquivalentTo(imageContent};
        dbRecipe.PreviewImageContentType.Should().Be(imageContentType};
    }

    [Test]
    public async Task CreateRecipeAsync_WithTags_CreatesRecipeTagAssociations()
    {
        // Arrange
        var tag1 = new Tag { Id = 1, Name = "Tag 1", Color = "#FF0000", Type = TagType.Custom };
        var tag2 = new Tag { Id = 2, Name = "Tag 2", Color = "#00FF00", Type = TagType.Custom };
        _db.Tags.AddRange(tag1, tag2};
        _db.SaveChanges(};

        var request = new CreateRecipeRequest {
            Title = "Tagged Recipe",
            Type = RecipeType.Manual,
            Url = null,
            StorageKey = null,
            Content = "Content",
            PreviewImageUrl = null,
            Description = null,
            SiteName = null,
            CategoryId = null,
            TagIds = new List<int> { 1, 2 }
        };

        // Act
        var result = await _service.CreateRecipeAsync(request, _testUserId};

        // Assert
        result.Should().NotBeNull(};
        result.Tags.Should().HaveCount(2};
        result.Tags.Should().Contain(t => t.Name == "Tag 1"};
        result.Tags.Should().Contain(t => t.Name == "Tag 2"};

        var recipeTags = await _db.RecipeTags.Where(rt => rt.RecipeId == result.Id).ToListAsync(};
        recipeTags.Should().HaveCount(2};
    }

    [Test]
    public async Task UpdateRecipeAsync_WithValidRecipe_UpdatesSuccessfully()
    {
        // Arrange
        var originalUpdateTime = DateTime.UtcNow.AddSeconds(-5); // Set to 5 seconds ago
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Original Title",
            Type = RecipeType.Manual,
            Content = "Original content",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = originalUpdateTime
        };
        _db.Recipes.Add(recipe};
        _db.SaveChanges(};

        var request = new UpdateRecipeRequest {
            Title = "Updated Title",
            Type = RecipeType.Manual,
            Url = null,
            StorageKey = null,
            Content = "Updated content",
            PreviewImageUrl = null,
            Description = "Updated description",
            SiteName = null,
            CategoryId = null,
            TagIds = null
        };

        // Act
        var result = await _service.UpdateRecipeAsync(recipe.Id, request, _testUserId};

        // Assert
        result.Should().NotBeNull(};
        result!.Title.Should().Be("Updated Title"};
        result.Content.Should().Be("Updated content"};
        result.Description.Should().Be("Updated description"};

        var dbRecipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Id == recipe.Id};
        dbRecipe.Should().NotBeNull(};
        dbRecipe!.Title.Should().Be("Updated Title"};
        dbRecipe.UpdatedAt.Should().BeAfter(originalUpdateTime};
    }

    [Test]
    public async Task UpdateRecipeAsync_WithNonExistentRecipe_ReturnsNull()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid(};
        var request = new UpdateRecipeRequest {
            Title = "Updated Title",
            Type = RecipeType.Manual,
            Url = null,
            StorageKey = null,
            Content = "Updated content",
            PreviewImageUrl = null,
            Description = null,
            SiteName = null,
            CategoryId = null,
            TagIds = null
        };

        // Act
        var result = await _service.UpdateRecipeAsync(nonExistentId, request, _testUserId};

        // Assert
        result.Should().BeNull(};
    }

    [Test]
    public async Task UpdateRecipeAsync_WithWrongUser_ReturnsNull()
    {
        // Arrange
        var otherUserId = Guid.NewGuid(};
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = otherUserId,
            Title = "Original Title",
            Type = RecipeType.Manual,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe};
        _db.SaveChanges(};

        var request = new UpdateRecipeRequest {
            Title = "Updated Title",
            Type = RecipeType.Manual,
            Url = null,
            StorageKey = null,
            Content = null,
            PreviewImageUrl = null,
            Description = null,
            SiteName = null,
            CategoryId = null,
            TagIds = null
        };

        // Act
        var result = await _service.UpdateRecipeAsync(recipe.Id, request, _testUserId};

        // Assert
        result.Should().BeNull(};
    }

    [Test]
    public async Task UpdateRecipeAsync_WithTagUpdate_RemovesOldAndAddsNewTags()
    {
        // Arrange
        var tag1 = new Tag { Id = 1, Name = "Tag 1", Color = "#FF0000", Type = TagType.Custom };
        var tag2 = new Tag { Id = 2, Name = "Tag 2", Color = "#00FF00", Type = TagType.Custom };
        var tag3 = new Tag { Id = 3, Name = "Tag 3", Color = "#0000FF", Type = TagType.Custom };
        _db.Tags.AddRange(tag1, tag2, tag3};

        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Recipe",
            Type = RecipeType.Manual,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe};
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe.Id, TagId = 1 }};
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe.Id, TagId = 2 }};
        _db.SaveChanges(};

        var request = new UpdateRecipeRequest {
            Title = "Recipe",
            Type = RecipeType.Manual,
            Url = null,
            StorageKey = null,
            Content = null,
            PreviewImageUrl = null,
            Description = null,
            SiteName = null,
            CategoryId = null,
            TagIds = new List<int> { 2, 3 } // Keep tag 2, remove tag 1, add tag 3
        };

        // Act
        var result = await _service.UpdateRecipeAsync(recipe.Id, request, _testUserId};

        // Assert
        result.Should().NotBeNull(};
        result!.Tags.Should().HaveCount(2};
        result.Tags.Should().Contain(t => t.Name == "Tag 2"};
        result.Tags.Should().Contain(t => t.Name == "Tag 3"};
        result.Tags.Should().NotContain(t => t.Name == "Tag 1"};

        var recipeTags = await _db.RecipeTags.Where(rt => rt.RecipeId == recipe.Id).ToListAsync(};
        recipeTags.Should().HaveCount(2};
    }

    [Test]
    public async Task GetRecipeAsync_WithValidRecipe_ReturnsRecipe()
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
        _db.Recipes.Add(recipe};
        _db.SaveChanges(};

        // Act
        var result = await _service.GetRecipeAsync(recipe.Id, _testUserId};

        // Assert
        result.Should().NotBeNull(};
        result!.Id.Should().Be(recipe.Id};
        result.Title.Should().Be("Test Recipe"};
    }

    [Test]
    public async Task GetRecipeAsync_WithNonExistentRecipe_ReturnsNull()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid(};

        // Act
        var result = await _service.GetRecipeAsync(nonExistentId, _testUserId};

        // Assert
        result.Should().BeNull(};
    }

    [Test]
    public async Task GetRecipeAsync_WithWrongUser_ReturnsNull()
    {
        // Arrange
        var otherUserId = Guid.NewGuid(};
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = otherUserId,
            Title = "Test Recipe",
            Type = RecipeType.Manual,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe};
        _db.SaveChanges(};

        // Act
        var result = await _service.GetRecipeAsync(recipe.Id, _testUserId};

        // Assert
        result.Should().BeNull(};
    }

    [Test]
    public async Task GetRecipesAsync_WithNoFilters_ReturnsAllUserRecipes()
    {
        // Arrange
        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Recipe 1", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow.AddDays(-2), UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Recipe 2", Type = RecipeType.Link, CreatedAt = DateTime.UtcNow.AddDays(-1), UpdatedAt = DateTime.UtcNow };
        var otherUserRecipe = new Recipe { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Title = "Other Recipe", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2, otherUserRecipe};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters(};

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(2};
        result.Should().Contain(r => r.Title == "Recipe 1"};
        result.Should().Contain(r => r.Title == "Recipe 2"};
        result.Should().NotContain(r => r.Title == "Other Recipe"};
        // Should be ordered by CreatedAt descending
        result[0].Title.Should().Be("Recipe 2"};
        result[1].Title.Should().Be("Recipe 1"};
    }

    [Test]
    public async Task GetRecipesAsync_WithSearchTerm_FiltersRecipesByTitle()
    {
        // Arrange
        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Chocolate Cake", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Vanilla Cookies", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe3 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Chocolate Chip Cookies", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters { SearchTerm = "Chocolate" };

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(2};
        result.Should().Contain(r => r.Title == "Chocolate Cake"};
        result.Should().Contain(r => r.Title == "Chocolate Chip Cookies"};
        result.Should().NotContain(r => r.Title == "Vanilla Cookies"};
    }

    [Test]
    public async Task GetRecipesAsync_WithSearchTerm_IsCaseInsensitive()
    {
        // Arrange
        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Chocolate Cake", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "VANILLA COOKIES", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe3 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "chocolate chip cookies", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3};
        _db.SaveChanges(};

        // Test lowercase search
        var queryParams = new RecipeQueryParameters { SearchTerm = "chocolate" };

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(2};
        result.Should().Contain(r => r.Title == "Chocolate Cake"};
        result.Should().Contain(r => r.Title == "chocolate chip cookies"};
    }

    [Test]
    public async Task GetRecipesAsync_WithSearchTerm_UppercaseSearchFindsLowercaseTitle()
    {
        // Arrange
        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "chocolate cake", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Vanilla Cookies", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters { SearchTerm = "CHOCOLATE" };

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(1};
        result[0].Title.Should().Be("chocolate cake"};
    }

    [Test]
    public async Task GetRecipesAsync_WithFullRecipeName_ReturnsExactMatch()
    {
        // Arrange
        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Grandma's Apple Pie", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Apple Tart", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters { SearchTerm = "Grandma's Apple Pie" };

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(1};
        result[0].Title.Should().Be("Grandma's Apple Pie"};
    }

    [Test]
    public async Task GetRecipesAsync_WithPartialWord_ReturnsMatches()
    {
        // Arrange
        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Strawberry Shortcake", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Blueberry Muffins", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe3 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Raspberry Tart", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters { SearchTerm = "berry" };

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(3};
        result.Should().Contain(r => r.Title == "Strawberry Shortcake"};
        result.Should().Contain(r => r.Title == "Blueberry Muffins"};
        result.Should().Contain(r => r.Title == "Raspberry Tart"};
    }

    [Test]
    public async Task GetRecipesAsync_WithShortSearchTerm_ReturnsRelevantMatches()
    {
        // Arrange
        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Pie", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Apple Pie", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe3 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Cake", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters { SearchTerm = "pi" };

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(2};
        result.Should().Contain(r => r.Title == "Pie"};
        result.Should().Contain(r => r.Title == "Apple Pie"};
        result.Should().NotContain(r => r.Title == "Cake"};
    }

    [Test]
    public async Task GetRecipesAsync_WithCategoryFilter_FiltersRecipesByCategory()
    {
        // Arrange
        var category = new Category { Id = 1, Name = "Desserts", Color = "#FF0000" };
        _db.Categories.Add(category};
        _db.SaveChanges(};

        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Cake", Type = RecipeType.Manual, CategoryId = 1, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Pasta", Type = RecipeType.Manual, CategoryId = null, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters { CategoryId = 1 };

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(1};
        result[0].Title.Should().Be("Cake"};
    }

    [Test]
    public async Task GetRecipesAsync_WithTagFilter_FiltersRecipesByTags()
    {
        // Arrange
        var tag1 = new Tag { Id = 1, Name = "Vegetarian", Color = "#00FF00", Type = TagType.Custom };
        var tag2 = new Tag { Id = 2, Name = "Quick", Color = "#0000FF", Type = TagType.Custom };
        _db.Tags.AddRange(tag1, tag2};

        var recipe1 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Veggie Pasta", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe2 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Quick Salad", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var recipe3 = new Recipe { Id = Guid.NewGuid(), UserId = _testUserId, Title = "Veggie Quick Soup", Type = RecipeType.Manual, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _db.Recipes.AddRange(recipe1, recipe2, recipe3};
        _db.SaveChanges(};

        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe1.Id, TagId = 1 }};
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe2.Id, TagId = 2 }};
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe3.Id, TagId = 1 }};
        _db.RecipeTags.Add(new RecipeTag { RecipeId = recipe3.Id, TagId = 2 }};
        _db.SaveChanges(};

        var queryParams = new RecipeQueryParameters { Tags = "1,2" }; // Both tags required

        // Act
        var result = await _service.GetRecipesAsync(queryParams, _testUserId};

        // Assert
        result.Should().HaveCount(1};
        result[0].Title.Should().Be("Veggie Quick Soup"};
    }

    [Test]
    public async Task DeleteRecipeAsync_WithValidRecipe_DeletesSuccessfully()
    {
        // Arrange
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            Title = "Test Recipe",
            Type = RecipeType.Manual,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe};
        _db.SaveChanges(};

        // Act
        var result = await _service.DeleteRecipeAsync(recipe.Id, _testUserId};

        // Assert
        result.Should().BeTrue(};

        var dbRecipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Id == recipe.Id};
        dbRecipe.Should().BeNull(};
    }

    [Test]
    public async Task DeleteRecipeAsync_WithNonExistentRecipe_ReturnsFalse()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid(};

        // Act
        var result = await _service.DeleteRecipeAsync(nonExistentId, _testUserId};

        // Assert
        result.Should().BeFalse(};
    }

    [Test]
    public async Task DeleteRecipeAsync_WithWrongUser_ReturnsFalse()
    {
        // Arrange
        var otherUserId = Guid.NewGuid(};
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = otherUserId,
            Title = "Test Recipe",
            Type = RecipeType.Manual,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Recipes.Add(recipe};
        _db.SaveChanges(};

        // Act
        var result = await _service.DeleteRecipeAsync(recipe.Id, _testUserId};

        // Assert
        result.Should().BeFalse(};

        // Recipe should still exist
        var dbRecipe = await _db.Recipes.FirstOrDefaultAsync(r => r.Id == recipe.Id};
        dbRecipe.Should().NotBeNull(};
    }
}
