using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Tests.DTOs.Requests;

[TestFixture]
public class CreateRecipeRequestValidationTests
{
    private List<ValidationResult> ValidateRequest(CreateRecipeRequest request)
    {
        var validationContext = new ValidationContext(request);
        var validationResults = new List<ValidationResult>();
        Validator.TryValidateObject(request, validationContext, validationResults, validateAllProperties: true);
        return validationResults;
    }

    [Test]
    public void Validate_WithValidRequest_ShouldPass()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: "Test Recipe",
            Type: RecipeType.Manual,
            Url: null,
            StorageKey: null,
            Content: "Test content",
            PreviewImageUrl: null,
            Description: "Test description",
            SiteName: null,
            CategoryId: 1,
            TagIds: new List<int> { 1, 2 }
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().BeEmpty();
    }

    [Test]
    public void Validate_WithMissingTitle_ShouldFail()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: null!,
            Type: RecipeType.Manual,
            Url: null,
            StorageKey: null,
            Content: null,
            PreviewImageUrl: null,
            Description: null,
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().ContainSingle(r => r.MemberNames.Contains("Title") && r.ErrorMessage!.Contains("required"));
    }

    [Test]
    public void Validate_WithTitleTooLong_ShouldFail()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: new string('a', 501), // 501 characters
            Type: RecipeType.Manual,
            Url: null,
            StorageKey: null,
            Content: null,
            PreviewImageUrl: null,
            Description: null,
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().ContainSingle(r => r.MemberNames.Contains("Title") && r.ErrorMessage!.Contains("500"));
    }

    [Test]
    public void Validate_WithInvalidUrl_ShouldFail()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: "Test Recipe",
            Type: RecipeType.Link,
            Url: "not-a-valid-url",
            StorageKey: null,
            Content: null,
            PreviewImageUrl: null,
            Description: null,
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().ContainSingle(r => r.MemberNames.Contains("Url") && r.ErrorMessage!.Contains("valid URL"));
    }

    [Test]
    public void Validate_WithValidUrl_ShouldPass()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: "Test Recipe",
            Type: RecipeType.Link,
            Url: "https://example.com/recipe",
            StorageKey: null,
            Content: null,
            PreviewImageUrl: null,
            Description: null,
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().BeEmpty();
    }

    [Test]
    public void Validate_WithUrlTooLong_ShouldFail()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: "Test Recipe",
            Type: RecipeType.Link,
            Url: "https://example.com/" + new string('a', 2000), // Over 2000 characters
            StorageKey: null,
            Content: null,
            PreviewImageUrl: null,
            Description: null,
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().ContainSingle(r => r.MemberNames.Contains("Url") && r.ErrorMessage!.Contains("2000"));
    }

    [Test]
    public void Validate_WithContentTooLong_ShouldFail()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: "Test Recipe",
            Type: RecipeType.Manual,
            Url: null,
            StorageKey: null,
            Content: new string('a', 100001), // Over 100000 characters
            PreviewImageUrl: null,
            Description: null,
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().ContainSingle(r => r.MemberNames.Contains("Content") && r.ErrorMessage!.Contains("100000"));
    }

    [Test]
    public void Validate_WithDescriptionTooLong_ShouldFail()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: "Test Recipe",
            Type: RecipeType.Manual,
            Url: null,
            StorageKey: null,
            Content: null,
            PreviewImageUrl: null,
            Description: new string('a', 501), // Over 500 characters
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().ContainSingle(r => r.MemberNames.Contains("Description") && r.ErrorMessage!.Contains("500"));
    }

    [Test]
    public void Validate_WithInvalidPreviewImageUrl_ShouldFail()
    {
        // Arrange
        var request = new CreateRecipeRequest(
            Title: "Test Recipe",
            Type: RecipeType.Link,
            Url: "https://example.com",
            StorageKey: null,
            Content: null,
            PreviewImageUrl: "not-a-valid-url",
            Description: null,
            SiteName: null,
            CategoryId: null,
            TagIds: null
        );

        // Act
        var results = ValidateRequest(request);

        // Assert
        results.Should().ContainSingle(r => r.MemberNames.Contains("PreviewImageUrl") && r.ErrorMessage!.Contains("valid URL"));
    }
}
