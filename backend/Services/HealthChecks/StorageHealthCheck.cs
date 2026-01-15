using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace RecipeManager.Api.Services.HealthChecks;

public class StorageHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<StorageHealthCheck> _logger;

    public StorageHealthCheck(IConfiguration configuration, ILogger<StorageHealthCheck> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var accountId = _configuration["R2:AccountId"];
            var accessKeyId = _configuration["R2:AccessKeyId"];
            var secretAccessKey = _configuration["R2:SecretAccessKey"];
            var bucketName = _configuration["R2:BucketName"];

            // Check if storage is configured
            if (string.IsNullOrEmpty(accountId) || accountId == "your-r2-account-id" ||
                string.IsNullOrEmpty(accessKeyId) || string.IsNullOrEmpty(secretAccessKey) ||
                string.IsNullOrEmpty(bucketName))
            {
                return Task.FromResult(HealthCheckResult.Degraded(
                    "Storage service is not configured. The application will work with limited functionality (no file uploads).",
                    data: new Dictionary<string, object>
                    {
                        { "configured", false },
                        { "provider", "Cloudflare R2" }
                    }
                ));
            }

            // Storage is configured
            return Task.FromResult(HealthCheckResult.Healthy(
                "Storage service is configured and ready.",
                data: new Dictionary<string, object>
                {
                    { "configured", true },
                    { "provider", "Cloudflare R2" },
                    { "bucket", bucketName }
                }
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking storage health");
            return Task.FromResult(HealthCheckResult.Unhealthy(
                "Error checking storage configuration.",
                ex,
                data: new Dictionary<string, object>
                {
                    { "configured", false },
                    { "provider", "Cloudflare R2" }
                }
            ));
        }
    }
}
