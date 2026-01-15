# Use official .NET SDK image for build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy remaining files and publish
COPY . ./
RUN dotnet publish -c Release -o /app/publish

# Use runtime image for final stage (smaller image)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy published app from build stage
COPY --from=build /app/publish .

# Expose port 8080 (Fly.io default)
EXPOSE 8080

# Set environment variable for ASP.NET Core to listen on port 8080
ENV ASPNETCORE_URLS=http://+:8080

# Set production environment
ENV ASPNETCORE_ENVIRONMENT=Production

# Security: Configure AllowedHosts for production
# Override with: fly secrets set ALLOWED_HOSTS="your-app.fly.dev;custom-domain.com"
# Default "*" will be used if not set (not recommended for production)

# Run the application
ENTRYPOINT ["dotnet", "RecipeManager.Api.dll"]
