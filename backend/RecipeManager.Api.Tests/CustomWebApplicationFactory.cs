using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecipeManager.Api.Data;
using RecipeManager.Api.Services;
using Moq;
using Microsoft.Extensions.Configuration;

namespace RecipeManager.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"TestDatabase_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Override configuration to enable development authentication bypass
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Development:BypassAuthentication"] = "true",
                ["Development:TestUser:AuthSub"] = "test-auth-sub",
                ["Development:TestUser:Email"] = "test@example.com",
                ["Development:TestUser:DisplayName"] = "Test User",
                ["Firebase:ProjectId"] = "", // Disable Firebase auth for tests
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove the existing DbContext configuration
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Add DbContext using in-memory database for testing with unique name
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });

            // Mock IStorageService
            var mockStorageService = new Mock<IStorageService>();
            mockStorageService
                .Setup(s => s.GetPresignedUploadUrlAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync("https://test-upload-url.com/test");
            mockStorageService
                .Setup(s => s.GetPresignedDownloadUrlAsync(It.IsAny<string>()))
                .ReturnsAsync("https://test-download-url.com/test");
            mockStorageService
                .Setup(s => s.GetPreviewImageUrlAsync(It.IsAny<string?>()))
                .ReturnsAsync((string? url) => url?.StartsWith("http") == true ? url : "https://test-download-url.com/test");

            // Remove existing IStorageService registration
            var storageDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IStorageService));
            if (storageDescriptor != null)
            {
                services.Remove(storageDescriptor);
            }

            services.AddSingleton(mockStorageService.Object);

            // Build the service provider to seed the database
            var sp = services.BuildServiceProvider();

            using var scope = sp.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var db = scopedServices.GetRequiredService<ApplicationDbContext>();

            // Ensure the database is created
            db.Database.EnsureCreated();
        });

        builder.UseEnvironment("Development");
    }
}
