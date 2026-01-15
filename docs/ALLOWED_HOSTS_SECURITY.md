# AllowedHosts Security Configuration

## Overview

The `AllowedHosts` configuration in ASP.NET Core helps protect your application from **host header injection attacks**. This setting controls which host headers your application will accept.

## What is a Host Header Injection Attack?

When a web application trusts the `Host` header from incoming HTTP requests without validation, attackers can manipulate this header to:
- Redirect users to malicious sites
- Bypass security controls
- Generate malicious links in password reset emails
- Perform cache poisoning attacks

Example of a manipulated request:
```http
GET /api/recipes HTTP/1.1
Host: evil-site.com
```

## Configuration Options

### Development/Testing (Default)

```json
{
  "AllowedHosts": "*"
}
```

- Accepts requests from **any host**
- ✅ Suitable for local development
- ✅ Useful when testing with multiple domains
- ⚠️ **NOT recommended for production**

### Production (Recommended)

#### Option 1: Environment Variable (Recommended)

Set the `ALLOWED_HOSTS` environment variable with specific domains:

**Fly.io:**
```bash
fly secrets set ALLOWED_HOSTS="recipemanager-api.fly.dev"
```

**Multiple domains (semicolon-separated):**
```bash
fly secrets set ALLOWED_HOSTS="recipemanager-api.fly.dev;api.yourdomain.com"
```

**Docker:**
```bash
docker run -e ALLOWED_HOSTS="your-app.fly.dev" your-image
```

#### Option 2: Configuration File

Update `appsettings.Production.json`:
```json
{
  "AllowedHosts": "recipemanager-api.fly.dev;api.yourdomain.com"
}
```

## How It Works

The Recipe Manager application supports both configuration methods:

1. **Environment Variable (Priority 1)**: If `ALLOWED_HOSTS` environment variable is set, it overrides the configuration file
2. **Configuration File (Priority 2)**: If no environment variable is set, uses value from `appsettings.json`

The implementation in `Program.cs`:
```csharp
// Configure AllowedHosts from environment variable
var allowedHosts = Environment.GetEnvironmentVariable("ALLOWED_HOSTS");
if (!string.IsNullOrEmpty(allowedHosts))
{
    builder.Configuration["AllowedHosts"] = allowedHosts;
}
```

## Deployment-Specific Guidance

### Fly.io Deployment

Fly.io provides some host header validation at the platform level, but explicit configuration is more secure:

```bash
# After fly launch, set this secret:
fly secrets set ALLOWED_HOSTS="your-app-name.fly.dev"

# If you have a custom domain:
fly secrets set ALLOWED_HOSTS="your-app-name.fly.dev;api.customdomain.com"
```

### Behind a Reverse Proxy

If your application is behind a reverse proxy (Nginx, Cloudflare, etc.):

1. Configure the reverse proxy to validate host headers
2. Set `AllowedHosts` to the proxy's internal hostname OR keep it as "*" if the proxy handles validation
3. Ensure the proxy sets appropriate forwarded headers

### Custom Domain Setup

When adding custom domains:

1. Update your `ALLOWED_HOSTS` configuration to include the new domain
2. Use semicolons to separate multiple domains
3. Do NOT include protocols (https://) or paths - just the domain name

**Example:**
```bash
fly secrets set ALLOWED_HOSTS="app.fly.dev;api.mydomain.com;www.mydomain.com"
```

## Testing the Configuration

### Test 1: Valid Host Header

```bash
curl -H "Host: your-app.fly.dev" https://your-app.fly.dev/health
```
Expected: `200 OK` response

### Test 2: Invalid Host Header

```bash
curl -H "Host: evil-site.com" https://your-app.fly.dev/health
```
Expected: `400 Bad Request` response

### Test 3: Environment Variable Override

**Development:**
```bash
# Set environment variable
export ALLOWED_HOSTS="localhost:5000"

# Start the app
dotnet run

# Test
curl -H "Host: localhost:5000" http://localhost:5000/health
```

## Security Best Practices

1. ✅ **Always** set `ALLOWED_HOSTS` in production to specific domains
2. ✅ Use environment variables for flexibility across environments
3. ✅ Include all legitimate domains your app should respond to
4. ✅ Update `ALLOWED_HOSTS` when adding new domains
5. ⚠️ Never use `"*"` in production unless behind a reverse proxy that validates host headers
6. ✅ Test your configuration after deployment

## Troubleshooting

### Problem: 400 Bad Request after deployment

**Cause:** Host header doesn't match `AllowedHosts` configuration

**Solution:**
1. Check your `ALLOWED_HOSTS` environment variable:
   ```bash
   fly secrets list
   ```
2. Verify the domain matches exactly (no protocols, no paths)
3. Update if needed:
   ```bash
   fly secrets set ALLOWED_HOSTS="correct-domain.fly.dev"
   ```

### Problem: Application works in browser but API calls fail

**Cause:** Frontend is calling API with a different host header than expected

**Solution:**
1. Check the `Host` header in browser DevTools (Network tab)
2. Add that domain to `ALLOWED_HOSTS`:
   ```bash
   fly secrets set ALLOWED_HOSTS="domain1.com;domain2.com"
   ```

### Problem: Custom domain returns 400

**Cause:** Custom domain not included in `ALLOWED_HOSTS`

**Solution:**
```bash
fly secrets set ALLOWED_HOSTS="app.fly.dev;custom.domain.com"
```

## References

- [ASP.NET Core Host Filtering](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/kestrel/host-filtering)
- [OWASP: Host Header Injection](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection)
- [Fly.io Security Best Practices](https://fly.io/docs/reference/security/)

## Support

If you encounter issues with AllowedHosts configuration:
1. Check application logs: `fly logs` (for Fly.io deployments)
2. Verify the exact host header being sent in requests
3. Ensure no trailing slashes or protocols in the configuration
4. Test with `curl` to isolate the issue
