using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using RecipeManager.Api.Data;
using RecipeManager.Api.Models;

namespace RecipeManager.Api.Tests;

[TestFixture]
public class RateLimitingTests
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
        var testUser = _db.Users.FirstOrDefault(u => u.AuthSub == "test-auth-sub");
        if (testUser != null)
        {
            _testUserId = testUser.Id;
        }
        else
        {
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
    public async Task MetadataEndpoint_RateLimitExceeded_Returns429()
    {
        // Arrange
        var request = new { url = "https://example.com" };
        var successCount = 0;
        var rateLimitedCount = 0;

        // Act - make 15 requests (limit is 10 per minute)
        for (int i = 0; i < 15; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/recipes/fetch-metadata", request);
            
            if (response.IsSuccessStatusCode)
            {
                successCount++;
            }
            else if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                rateLimitedCount++;
            }
        }

        // Assert
        successCount.Should().BeLessThanOrEqualTo(10, "metadata endpoint has a limit of 10 requests per minute");
        rateLimitedCount.Should().BeGreaterThan(0, "some requests should be rate limited");
    }

    [Test]
    public async Task PresignEndpoint_RateLimitExceeded_Returns429()
    {
        // Arrange
        var request = new 
        { 
            fileName = "test.pdf",
            contentType = "application/pdf"
        };
        var successCount = 0;
        var rateLimitedCount = 0;

        // Act - make 55 requests (limit is 50 per minute)
        for (int i = 0; i < 55; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/uploads/presign", request);
            
            if (response.IsSuccessStatusCode)
            {
                successCount++;
            }
            else if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                rateLimitedCount++;
            }
        }

        // Assert
        successCount.Should().BeLessThanOrEqualTo(50, "presign endpoint has a limit of 50 requests per minute");
        rateLimitedCount.Should().BeGreaterThan(0, "some requests should be rate limited");
    }

    [Test]
    public async Task ProfileUpdateEndpoint_RateLimitExceeded_Returns429()
    {
        // Arrange
        var request = new 
        { 
            displayName = "Updated Name"
        };
        var successCount = 0;
        var rateLimitedCount = 0;

        // Act - make 25 requests (limit is 20 per minute)
        for (int i = 0; i < 25; i++)
        {
            var response = await _client.PutAsJsonAsync("/api/user/profile", request);
            
            if (response.IsSuccessStatusCode)
            {
                successCount++;
            }
            else if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                rateLimitedCount++;
            }
        }

        // Assert
        successCount.Should().BeLessThanOrEqualTo(20, "profile update endpoint has a limit of 20 requests per minute");
        rateLimitedCount.Should().BeGreaterThan(0, "some requests should be rate limited");
    }

    [Test]
    public async Task BulkDeleteEndpoint_RateLimitExceeded_Returns429()
    {
        // Arrange
        var request = new List<Guid> { Guid.NewGuid() };
        var successCount = 0;
        var rateLimitedCount = 0;

        // Act - make 15 requests (limit is 10 per minute)
        for (int i = 0; i < 15; i++)
        {
            var response = await _client.SendAsync(new HttpRequestMessage
            {
                Method = HttpMethod.Delete,
                RequestUri = new Uri("/api/recipes/bulk", UriKind.Relative),
                Content = JsonContent.Create(request)
            });
            
            if (response.IsSuccessStatusCode)
            {
                successCount++;
            }
            else if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                rateLimitedCount++;
            }
        }

        // Assert
        successCount.Should().BeLessThanOrEqualTo(10, "bulk delete endpoint has a limit of 10 requests per minute");
        rateLimitedCount.Should().BeGreaterThan(0, "some requests should be rate limited");
    }

    [Test]
    public async Task RateLimitResponse_Contains429StatusAndRetryAfter()
    {
        // Arrange
        var request = new { url = "https://example.com" };

        // Act - make requests until we hit the rate limit
        HttpResponseMessage? rateLimitedResponse = null;
        for (int i = 0; i < 15; i++)
        {
            var response = await _client.PostAsJsonAsync("/api/recipes/fetch-metadata", request);
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                rateLimitedResponse = response;
                break;
            }
        }

        // Assert
        rateLimitedResponse.Should().NotBeNull("we should receive a 429 response");
        rateLimitedResponse!.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        
        var content = await rateLimitedResponse.Content.ReadAsStringAsync();
        content.Should().Contain("Too Many Requests");
        content.Should().Contain("Rate limit exceeded");
    }
}
