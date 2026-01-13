---
applyTo: "backend/**/*.cs"
excludeAgent: ["code-review"]
---

# Backend API Instructions

## Architecture Pattern
This backend follows the **Minimal API pattern** with clean architecture principles:
- **Program.cs** contains service registration and middleware configuration ONLY
- **Endpoints/** contains all API endpoint definitions organized by domain
- **Services/** contains business logic implementations
- **DTOs/** contains request/response models separate from entity models
- **Mapping/** contains mapping logic between entities and DTOs

## Critical Rules

### DTOs and Entity Separation
**ALWAYS** use DTOs for API responses, NEVER return Entity Framework models directly:
```csharp
// ✅ CORRECT: Return anonymous DTO
return Results.Ok(new {
    recipe.Id,
    recipe.Title,
    recipe.Type
});

// ❌ WRONG: Return entity directly (causes circular reference errors)
return Results.Ok(recipe);
```

### Endpoint Organization
- Create endpoint classes in `Endpoints/` directory
- One class per domain (e.g., `RecipeEndpoints.cs`, `CategoryEndpoints.cs`)
- Use `MapGroup` for route prefixes
- Keep endpoint handlers under 30 lines
- Delegate business logic to services

### Service Pattern
- Define interfaces for all services (e.g., `IRecipeService`)
- Implement dependency injection via constructor
- Services must be stateless
- Handle exceptions and return meaningful error messages
- Keep service methods under 50 lines

### Database Operations
- Use `AsNoTracking()` for read-only queries
- Apply migrations with: `dotnet ef database update --context ApplicationDbContext`
- ALWAYS run migrations after pulling changes with new migration files
- Create migrations with: `dotnet ef migrations add <MigrationName>`

### Authentication
- Endpoints requiring auth must verify user ownership
- Never trust client-provided user IDs
- Use `userId` from JWT token claims
- Custom middleware (`UserEnsurer`) creates user records on first request

## Build Commands
- **Restore**: `dotnet restore` (run after .csproj changes)
- **Build**: `dotnet build`
- **Test**: `dotnet test` (MUST pass before committing)
- **Run**: `dotnet watch run` (hot reload) or `dotnet run --project <full-path-to-csproj>`
- **Format**: `dotnet format`
- **Clean**: `dotnet clean` (run before tests after code changes to clear stale artifacts)

## Common Issues
- **Circular reference errors**: Return DTOs instead of entities
- **"No such column" errors**: Run `dotnet ef database update --context ApplicationDbContext`
- **"Couldn't find a project"**: Use full path with `--project` flag
- **Stale build artifacts**: Run `dotnet clean` then `dotnet build`
