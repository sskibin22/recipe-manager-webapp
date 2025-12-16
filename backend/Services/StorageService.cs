using Amazon.S3;
using Amazon.S3.Model;
using Amazon.Runtime;
using Microsoft.AspNetCore.Http;

namespace RecipeManager.Api.Services;

public class StorageService : IStorageService
{
    private readonly IConfiguration _configuration;
    private readonly IAmazonS3? _s3Client;
    private readonly string _bucketName;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public StorageService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
    {
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;

        var accountId = _configuration["R2:AccountId"];
        var accessKeyId = _configuration["R2:AccessKeyId"];
        var secretAccessKey = _configuration["R2:SecretAccessKey"];
        _bucketName = _configuration["R2:BucketName"] ?? "";

        // Only initialize S3 client if R2 is configured
        if (!string.IsNullOrEmpty(accountId) &&
            !string.IsNullOrEmpty(accessKeyId) &&
            !string.IsNullOrEmpty(secretAccessKey) &&
            accountId != "your-r2-account-id")
        {
            var credentials = new BasicAWSCredentials(accessKeyId, secretAccessKey);
            var config = new AmazonS3Config
            {
                ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
                ForcePathStyle = true
            };

            _s3Client = new AmazonS3Client(credentials, config);
        }
    }

    public async Task<string> GetPresignedUploadUrlAsync(string key, string contentType)
    {
        if (_s3Client == null)
        {
            // Return a placeholder URL if R2 is not configured (for local development)
            var httpContext = _httpContextAccessor.HttpContext;
            var baseUrl = httpContext != null
                ? $"{httpContext.Request.Scheme}://{httpContext.Request.Host}"
                : "http://localhost:5172"; // Fallback to default dev port
            return $"{baseUrl}/placeholder-upload/{key}";
        }

        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Verb = HttpVerb.PUT,
            Expires = DateTime.UtcNow.AddMinutes(15),
            ContentType = contentType
        };

        return await Task.FromResult(_s3Client.GetPreSignedURL(request));
    }

    public async Task<string> GetPresignedDownloadUrlAsync(string key)
    {
        if (_s3Client == null)
        {
            // Return a placeholder URL if R2 is not configured (for local development)
            var httpContext = _httpContextAccessor.HttpContext;
            var baseUrl = httpContext != null
                ? $"{httpContext.Request.Scheme}://{httpContext.Request.Host}"
                : "http://localhost:5172"; // Fallback to default dev port
            return $"{baseUrl}/placeholder-download/{key}";
        }

        var request = new GetPreSignedUrlRequest
        {
            BucketName = _bucketName,
            Key = key,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddMinutes(15)
        };

        return await Task.FromResult(_s3Client.GetPreSignedURL(request));
    }
}
