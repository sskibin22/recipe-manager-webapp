using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Tests.Services;

[TestFixture]
public class UserContextServiceTests
{
    private Mock<IHttpContextAccessor> _httpContextAccessorMock = null!;
    private UserContextService _service = null!;

    [SetUp]
    public void Setup()
    {
        _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
        _service = new UserContextService(_httpContextAccessorMock.Object);
    }

    [Test]
    public void GetCurrentUserId_WithValidDbUserIdClaim_ReturnsUserId()
    {
        // Arrange
        var expectedUserId = Guid.NewGuid();
        var claims = new List<Claim>
        {
            new Claim("db_user_id", expectedUserId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = claimsPrincipal
        };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        // Act
        var result = _service.GetCurrentUserId();

        // Assert
        result.Should().Be(expectedUserId);
    }

    [Test]
    public void GetCurrentUserId_WithMissingClaim_ReturnsNull()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("some_other_claim", "value")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = claimsPrincipal
        };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        // Act
        var result = _service.GetCurrentUserId();

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public void GetCurrentUserId_WithInvalidGuidFormat_ReturnsNull()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("db_user_id", "not-a-valid-guid")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        var httpContext = new DefaultHttpContext
        {
            User = claimsPrincipal
        };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        // Act
        var result = _service.GetCurrentUserId();

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public void GetCurrentUserId_WithNullHttpContext_ReturnsNull()
    {
        // Arrange
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns((HttpContext?)null);

        // Act
        var result = _service.GetCurrentUserId();

        // Assert
        result.Should().BeNull();
    }

    [Test]
    public void GetCurrentUserId_WithNullUser_ReturnsNull()
    {
        // Arrange
        var httpContext = new DefaultHttpContext
        {
            User = null!
        };
        _httpContextAccessorMock.Setup(x => x.HttpContext).Returns(httpContext);

        // Act
        var result = _service.GetCurrentUserId();

        // Assert
        result.Should().BeNull();
    }
}
