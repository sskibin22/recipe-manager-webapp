using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace RecipeManager.Api.Tests;

[TestFixture]
public class HealthCheckEndpointsTests
{
    private CustomWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;

    [SetUp]
    public void Setup()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    [TearDown]
    public void TearDown()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Test]
    public async Task HealthCheck_Legacy_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
        content.Should().Contain("timestamp");
    }

    [Test]
    public async Task HealthCheck_Live_ReturnsHealthy()
    {
        // Act
        var response = await _client.GetAsync("/health/live");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var healthReport = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
        healthReport.Should().NotBeNull();
        healthReport!.Status.Should().Be("Healthy");
        healthReport.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        healthReport.Checks.Should().BeEmpty(); // Liveness check doesn't run any checks
    }

    [Test]
    public async Task HealthCheck_Ready_ReturnsHealthyWithChecks()
    {
        // Act
        var response = await _client.GetAsync("/health/ready");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");

        var healthReport = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
        healthReport.Should().NotBeNull();
        healthReport!.Status.Should().Be("Healthy");
        healthReport.Timestamp.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        healthReport.Checks.Should().NotBeEmpty();
        healthReport.Duration.Should().BeGreaterThanOrEqualTo(0);
    }

    [Test]
    public async Task HealthCheck_Ready_IncludesDatabaseCheck()
    {
        // Act
        var response = await _client.GetAsync("/health/ready");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var healthReport = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
        
        healthReport.Should().NotBeNull();
        healthReport!.Checks.Should().Contain(c => c.Name == "database");
        
        var databaseCheck = healthReport.Checks.First(c => c.Name == "database");
        databaseCheck.Status.Should().Be("Healthy");
        databaseCheck.Duration.Should().BeGreaterThanOrEqualTo(0);
    }

    [Test]
    public async Task HealthCheck_Ready_IncludesStorageCheck()
    {
        // Act
        var response = await _client.GetAsync("/health/ready");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var healthReport = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
        
        healthReport.Should().NotBeNull();
        healthReport!.Checks.Should().Contain(c => c.Name == "storage");
        
        var storageCheck = healthReport.Checks.First(c => c.Name == "storage");
        // Storage should be Degraded in tests since it's not configured with real credentials
        storageCheck.Status.Should().BeOneOf("Healthy", "Degraded");
        storageCheck.Duration.Should().BeGreaterThanOrEqualTo(0);
        storageCheck.Data.Should().NotBeNull();
        storageCheck.Data.Should().ContainKey("configured");
        storageCheck.Data.Should().ContainKey("provider");
    }

    [Test]
    public async Task HealthCheck_Ready_StorageReportsDegradedWhenNotConfigured()
    {
        // Act
        var response = await _client.GetAsync("/health/ready");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var healthReport = await response.Content.ReadFromJsonAsync<HealthCheckResponse>();
        
        healthReport.Should().NotBeNull();
        var storageCheck = healthReport!.Checks.First(c => c.Name == "storage");
        
        // In test environment, storage is not configured, so it should be Degraded
        storageCheck.Status.Should().Be("Degraded");
        storageCheck.Description.Should().Contain("not configured");
    }

    // Response models for deserialization
    private class HealthCheckResponse
    {
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public double Duration { get; set; }
        public List<HealthCheckEntry> Checks { get; set; } = new();
    }

    private class HealthCheckEntry
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double Duration { get; set; }
        public Dictionary<string, object>? Data { get; set; }
    }
}
