using FluentAssertions;
using RecipeManager.Api.DTOs.Queries;

namespace RecipeManager.Api.Tests.DTOs;

[TestFixture]
public class RecipeQueryParametersTests
{
    [Test]
    public void GetTagIds_WithValidCommaSeparatedIds_ReturnsListOfIds()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = "1,2,3"
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().ContainInOrder(1, 2, 3);
    }

    [Test]
    public void GetTagIds_WithNullTags_ReturnsEmptyList()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = null
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Test]
    public void GetTagIds_WithEmptyString_ReturnsEmptyList()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = ""
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Test]
    public void GetTagIds_WithWhitespaceOnly_ReturnsEmptyList()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = "   "
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Test]
    public void GetTagIds_WithInvalidIds_SkipsInvalidValues()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = "1,abc,3,xyz,5"
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().ContainInOrder(1, 3, 5);
    }

    [Test]
    public void GetTagIds_WithNegativeIds_SkipsNegativeValues()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = "1,-2,3,-4,5"
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().ContainInOrder(1, 3, 5);
    }

    [Test]
    public void GetTagIds_WithZeroIds_SkipsZeroValues()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = "1,0,3,0,5"
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().ContainInOrder(1, 3, 5);
    }

    [Test]
    public void GetTagIds_WithWhitespaceAroundIds_TrimsAndParses()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = " 1 , 2 , 3 "
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().ContainInOrder(1, 2, 3);
    }

    [Test]
    public void GetTagIds_WithMixedValidAndInvalidAndWhitespace_ReturnsValidOnly()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = " 10, invalid, 20, , 30, 0, -5, abc "
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(3);
        result.Should().ContainInOrder(10, 20, 30);
    }

    [Test]
    public void GetTagIds_WithSingleValidId_ReturnsSingleItemList()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = "42"
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(1);
        result.Should().Contain(42);
    }

    [Test]
    public void GetTagIds_WithAllInvalidIds_ReturnsEmptyList()
    {
        // Arrange
        var queryParams = new RecipeQueryParameters
        {
            Tags = "abc,xyz,def"
        };

        // Act
        var result = queryParams.GetTagIds();

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }
}
