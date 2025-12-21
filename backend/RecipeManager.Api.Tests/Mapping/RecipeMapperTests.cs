using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RecipeManager.Api.Mapping;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Tests.Mapping;

[TestFixture]
public class RecipeMapperTests
{
    private Mock<IStorageService> _storageServiceMock = null!;
    private Mock<ILogger<RecipeMapper>> _loggerMock = null!;
    private RecipeMapper _mapper = null!;

    [SetUp]
    public void Setup()
    {
        _storageServiceMock = new Mock<IStorageService>();
        _loggerMock = new Mock<ILogger<RecipeMapper>>();
        _mapper = new RecipeMapper(_storageServiceMock.Object, _loggerMock.Object);
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithManualRecipe_ReturnsCorrectResponse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Manual Recipe",
            Type = RecipeType.Manual,
            Content = "Recipe instructions",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.Id.Should().Be(recipe.Id);
        response.Title.Should().Be(recipe.Title);
        response.Type.Should().Be(RecipeType.Manual);
        response.Content.Should().Be(recipe.Content);
        response.FileContent.Should().BeNull();
        response.IsFavorite.Should().BeFalse();
        response.Category.Should().BeNull();
        response.Tags.Should().BeEmpty();
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithDocumentRecipe_ConvertsFileContentToBase64()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var fileContent = new byte[] { 0x50, 0x44, 0x46, 0x2D }; // PDF header bytes
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Document Recipe",
            Type = RecipeType.Document,
            FileContent = fileContent,
            FileContentType = "application/pdf",
            StorageKey = "users/123/recipe.pdf",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.FileContent.Should().Be(Convert.ToBase64String(fileContent));
        response.FileContentType.Should().Be("application/pdf");
        response.Type.Should().Be(RecipeType.Document);
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithPreviewImageInDatabase_ConvertsToBase64DataUrl()
    {
        // Arrange
        var imageContent = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }; // JPEG header bytes
        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Recipe with Image",
            Type = RecipeType.Link,
            Url = "https://example.com/recipe",
            PreviewImageContent = imageContent,
            PreviewImageContentType = "image/jpeg",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.PreviewImageUrl.Should().StartWith("data:image/jpeg;base64,");
        response.PreviewImageUrl.Should().Contain(Convert.ToBase64String(imageContent));
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithStorageKey_GeneratesPresignedUrl()
    {
        // Arrange
        var storageKey = "users/123/preview-image.jpg";
        var presignedUrl = "https://storage.example.com/signed-url?key=" + storageKey;
        
        _storageServiceMock
            .Setup(s => s.GetPresignedDownloadUrlAsync(storageKey))
            .ReturnsAsync(presignedUrl);

        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Recipe with Storage Key",
            Type = RecipeType.Link,
            Url = "https://example.com/recipe",
            PreviewImageUrl = storageKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.PreviewImageUrl.Should().Be(presignedUrl);
        _storageServiceMock.Verify(s => s.GetPresignedDownloadUrlAsync(storageKey), Times.Once);
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithExternalHttpUrl_ReturnsOriginalUrl()
    {
        // Arrange
        var externalUrl = "http://example.com/image.jpg";
        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Recipe with External URL",
            Type = RecipeType.Link,
            Url = "https://example.com/recipe",
            PreviewImageUrl = externalUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.PreviewImageUrl.Should().Be(externalUrl);
        _storageServiceMock.Verify(s => s.GetPresignedDownloadUrlAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithExternalHttpsUrl_ReturnsOriginalUrl()
    {
        // Arrange
        var externalUrl = "https://example.com/image.jpg";
        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Recipe with External HTTPS URL",
            Type = RecipeType.Link,
            Url = "https://example.com/recipe",
            PreviewImageUrl = externalUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.PreviewImageUrl.Should().Be(externalUrl);
        _storageServiceMock.Verify(s => s.GetPresignedDownloadUrlAsync(It.IsAny<string>()), Times.Never);
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WhenPresignedUrlGenerationFails_ReturnsNull()
    {
        // Arrange
        var storageKey = "users/123/preview-image.jpg";
        
        _storageServiceMock
            .Setup(s => s.GetPresignedDownloadUrlAsync(storageKey))
            .ThrowsAsync(new Exception("Storage service error"));

        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Recipe with Failed Storage",
            Type = RecipeType.Link,
            Url = "https://example.com/recipe",
            PreviewImageUrl = storageKey,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.PreviewImageUrl.Should().BeNull();
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithCategory_IncludesCategoryInResponse()
    {
        // Arrange
        var category = new Category
        {
            Id = 1,
            Name = "Desserts",
            Color = "#FF5733"
        };

        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Recipe with Category",
            Type = RecipeType.Manual,
            Content = "Recipe content",
            CategoryId = category.Id,
            Category = category,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.Category.Should().NotBeNull();
        response.Category!.Id.Should().Be(category.Id);
        response.Category.Name.Should().Be(category.Name);
        response.Category.Color.Should().Be(category.Color);
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithTags_IncludesTagsInResponse()
    {
        // Arrange
        var tag1 = new Tag { Id = 1, Name = "Vegan", Color = "#00FF00", Type = TagType.Dietary };
        var tag2 = new Tag { Id = 2, Name = "Quick", Color = "#0000FF", Type = TagType.PrepTime };

        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Recipe with Tags",
            Type = RecipeType.Manual,
            Content = "Recipe content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>
            {
                new RecipeTag { RecipeId = Guid.NewGuid(), TagId = tag1.Id, Tag = tag1 },
                new RecipeTag { RecipeId = Guid.NewGuid(), TagId = tag2.Id, Tag = tag2 }
            }
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.Tags.Should().HaveCount(2);
        response.Tags[0].Id.Should().Be(tag1.Id);
        response.Tags[0].Name.Should().Be(tag1.Name);
        response.Tags[0].Color.Should().Be(tag1.Color);
        response.Tags[0].Type.Should().Be(tag1.Type);
        response.Tags[1].Id.Should().Be(tag2.Id);
        response.Tags[1].Name.Should().Be(tag2.Name);
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithFavorite_SetsFavoriteToTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Favorite Recipe",
            Type = RecipeType.Manual,
            Content = "Recipe content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>
            {
                new Favorite { UserId = userId, RecipeId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow }
            },
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.IsFavorite.Should().BeTrue();
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithoutFavorite_SetsFavoriteToFalse()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Test Non-Favorite Recipe",
            Type = RecipeType.Manual,
            Content = "Recipe content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>(),
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.IsFavorite.Should().BeFalse();
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithFavoriteByDifferentUser_SetsFavoriteToFalse()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            Title = "Test Recipe Favorited By Other User",
            Type = RecipeType.Manual,
            Content = "Recipe content",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Favorites = new List<Favorite>
            {
                new Favorite { UserId = otherUserId, RecipeId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow }
            },
            RecipeTags = new List<RecipeTag>()
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, currentUserId);

        // Assert
        response.Should().NotBeNull();
        response.IsFavorite.Should().BeFalse();
    }

    [Test]
    public async Task MapToRecipeResponseListAsync_WithMultipleRecipes_MapsAllRecipes()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var recipes = new List<Recipe>
        {
            new Recipe
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "Recipe 1",
                Type = RecipeType.Manual,
                Content = "Content 1",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Favorites = new List<Favorite>(),
                RecipeTags = new List<RecipeTag>()
            },
            new Recipe
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "Recipe 2",
                Type = RecipeType.Link,
                Url = "https://example.com/recipe2",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Favorites = new List<Favorite>(),
                RecipeTags = new List<RecipeTag>()
            },
            new Recipe
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "Recipe 3",
                Type = RecipeType.Document,
                StorageKey = "users/123/recipe3.pdf",
                FileContent = new byte[] { 0x50, 0x44, 0x46 },
                FileContentType = "application/pdf",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Favorites = new List<Favorite>(),
                RecipeTags = new List<RecipeTag>()
            }
        };

        // Act
        var responses = await _mapper.MapToRecipeResponseListAsync(recipes, userId);

        // Assert
        responses.Should().HaveCount(3);
        responses[0].Title.Should().Be("Recipe 1");
        responses[0].Type.Should().Be(RecipeType.Manual);
        responses[1].Title.Should().Be("Recipe 2");
        responses[1].Type.Should().Be(RecipeType.Link);
        responses[2].Title.Should().Be("Recipe 3");
        responses[2].Type.Should().Be(RecipeType.Document);
        responses[2].FileContent.Should().NotBeNull();
    }

    [Test]
    public async Task MapToRecipeResponseListAsync_WithEmptyList_ReturnsEmptyList()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var recipes = new List<Recipe>();

        // Act
        var responses = await _mapper.MapToRecipeResponseListAsync(recipes, userId);

        // Assert
        responses.Should().BeEmpty();
    }

    [Test]
    public async Task MapToRecipeResponseAsync_WithCompleteRecipe_MapsAllFields()
    {
        // Arrange
        var category = new Category { Id = 1, Name = "Main Course", Color = "#FF0000" };
        var tag = new Tag { Id = 1, Name = "Vegetarian", Color = "#00FF00", Type = TagType.Dietary };
        
        var userId = Guid.NewGuid();
        var recipe = new Recipe
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = "Complete Recipe",
            Type = RecipeType.Link,
            Url = "https://example.com/recipe",
            StorageKey = "users/123/recipe-doc.pdf",
            Content = "Recipe instructions",
            Description = "A delicious recipe",
            SiteName = "Example Site",
            CategoryId = category.Id,
            Category = category,
            PreviewImageUrl = "https://example.com/image.jpg",
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
            Favorites = new List<Favorite>
            {
                new Favorite { UserId = userId, RecipeId = Guid.NewGuid(), CreatedAt = DateTime.UtcNow }
            },
            RecipeTags = new List<RecipeTag>
            {
                new RecipeTag { RecipeId = Guid.NewGuid(), TagId = tag.Id, Tag = tag }
            }
        };

        // Act
        var response = await _mapper.MapToRecipeResponseAsync(recipe, userId);

        // Assert
        response.Should().NotBeNull();
        response.Id.Should().Be(recipe.Id);
        response.Title.Should().Be(recipe.Title);
        response.Type.Should().Be(recipe.Type);
        response.Url.Should().Be(recipe.Url);
        response.StorageKey.Should().Be(recipe.StorageKey);
        response.Content.Should().Be(recipe.Content);
        response.Description.Should().Be(recipe.Description);
        response.SiteName.Should().Be(recipe.SiteName);
        response.PreviewImageUrl.Should().Be(recipe.PreviewImageUrl);
        response.CreatedAt.Should().Be(recipe.CreatedAt);
        response.UpdatedAt.Should().Be(recipe.UpdatedAt);
        response.IsFavorite.Should().BeTrue();
        response.Category.Should().NotBeNull();
        response.Category!.Id.Should().Be(category.Id);
        response.Tags.Should().HaveCount(1);
        response.Tags[0].Id.Should().Be(tag.Id);
    }
}
