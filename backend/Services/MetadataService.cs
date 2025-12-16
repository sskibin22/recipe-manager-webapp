using System.Text.RegularExpressions;

namespace RecipeManager.Api.Services;

public class MetadataService : IMetadataService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MetadataService> _logger;
    private const int MaxContentLength = 5 * 1024 * 1024; // 5MB max

    public MetadataService(IHttpClientFactory httpClientFactory, ILogger<MetadataService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<RecipeMetadata?> FetchMetadataAsync(string url)
    {
        try
        {
            // Validate URL
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                _logger.LogWarning("Invalid URL: {Url}", url);
                return null;
            }

            var client = _httpClientFactory.CreateClient("MetadataClient");

            // Create request with headers to mimic a browser
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("User-Agent", "Mozilla/5.0 (compatible; RecipeManagerBot/1.0)");
            request.Headers.Add("Accept", "text/html,application/xhtml+xml,application/xml");

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);

            // Check content type
            var contentType = response.Content.Headers.ContentType?.MediaType?.ToLowerInvariant();
            if (contentType != null && !contentType.Contains("text/html") && !contentType.Contains("application/xhtml"))
            {
                _logger.LogWarning("Non-HTML content type: {ContentType}", contentType);
                return null;
            }

            // Check content length
            var contentLength = response.Content.Headers.ContentLength;
            if (contentLength.HasValue && contentLength.Value > MaxContentLength)
            {
                _logger.LogWarning("Content too large: {ContentLength} bytes", contentLength.Value);
                return null;
            }

            response.EnsureSuccessStatusCode();

            var html = await response.Content.ReadAsStringAsync();

            // Parse metadata
            var metadata = ParseMetadata(html, uri);
            return metadata;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error fetching metadata from {Url}", url);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "Timeout fetching metadata from {Url}", url);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching metadata from {Url}", url);
            return null;
        }
    }

    private RecipeMetadata ParseMetadata(string html, Uri baseUri)
    {
        // Extract Open Graph tags first (preferred)
        var ogTitle = ExtractMetaContent(html, "og:title");
        var ogDescription = ExtractMetaContent(html, "og:description");
        var ogImage = ExtractMetaContent(html, "og:image");
        var ogSiteName = ExtractMetaContent(html, "og:site_name");

        // Fallback to standard HTML tags if OG tags not found
        var title = ogTitle ?? ExtractTitle(html);
        var description = ogDescription ?? ExtractMetaContent(html, "description");
        var image = ogImage;

        // Make image URL absolute if it's relative
        if (!string.IsNullOrEmpty(image) && Uri.TryCreate(image, UriKind.RelativeOrAbsolute, out var imageUri))
        {
            if (!imageUri.IsAbsoluteUri)
            {
                image = new Uri(baseUri, imageUri).ToString();
            }
        }

        // Use site name from OG or fallback to domain name
        var siteName = ogSiteName ?? baseUri.Host;

        return new RecipeMetadata(
            Title: TruncateString(title, 500),
            Description: TruncateString(description, 500),
            ImageUrl: TruncateString(image, 2000),
            SiteName: TruncateString(siteName, 256)
        );
    }

    private string? ExtractMetaContent(string html, string property)
    {
        // Try Open Graph format: <meta property="og:title" content="...">
        var ogPattern = $@"<meta\s+property\s*=\s*[""']{Regex.Escape(property)}[""']\s+content\s*=\s*[""']([^""']*)[""']";
        var match = Regex.Match(html, ogPattern, RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return DecodeHtml(match.Groups[1].Value);
        }

        // Try standard format: <meta name="description" content="...">
        var namePattern = $@"<meta\s+name\s*=\s*[""']{Regex.Escape(property)}[""']\s+content\s*=\s*[""']([^""']*)[""']";
        match = Regex.Match(html, namePattern, RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return DecodeHtml(match.Groups[1].Value);
        }

        // Try reversed attribute order
        var reversedPattern = $@"<meta\s+content\s*=\s*[""']([^""']*)[""']\s+(?:property|name)\s*=\s*[""']{Regex.Escape(property)}[""']";
        match = Regex.Match(html, reversedPattern, RegexOptions.IgnoreCase);
        if (match.Success)
        {
            return DecodeHtml(match.Groups[1].Value);
        }

        return null;
    }

    private string? ExtractTitle(string html)
    {
        var match = Regex.Match(html, @"<title[^>]*>([^<]+)</title>", RegexOptions.IgnoreCase);
        return match.Success ? DecodeHtml(match.Groups[1].Value.Trim()) : null;
    }

    private string? DecodeHtml(string text)
    {
        if (string.IsNullOrEmpty(text)) return text;

        // Basic HTML entity decoding
        return text
            .Replace("&amp;", "&")
            .Replace("&lt;", "<")
            .Replace("&gt;", ">")
            .Replace("&quot;", "\"")
            .Replace("&#39;", "'")
            .Replace("&apos;", "'")
            .Trim();
    }

    private string? TruncateString(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= maxLength ? value : value.Substring(0, maxLength);
    }
}
