---
applyTo: "backend/Migrations/**/*.cs,backend/Data/**/*.cs"
---

# Database and Migrations Instructions

## Database Architecture
- **Development**: SQLite (file: `recipemanager.db`)
- **Production**: PostgreSQL (via Neon)
- **ORM**: Entity Framework Core
- **DbContext**: `ApplicationDbContext`

## Database Schema

### Tables
- **User**: `Id` (GUID, PK), `AuthSub` (unique), `Email`, `DisplayName`, `CreatedAt`
- **Recipe**: `Id` (GUID, PK), `UserId` (FK), `Title`, `Type`, `Url`, `StorageKey`, `Content`, `CreatedAt`, `UpdatedAt`
- **Category**: `Id` (int, PK), `UserId` (FK), `Name`, `Color`, `CreatedAt`
- **Tag**: `Id` (int, PK), `UserId` (FK), `Name`, `CreatedAt`
- **RecipeCategory**: Composite PK `(RecipeId, CategoryId)` - Many-to-many relationship
- **RecipeTag**: Composite PK `(RecipeId, TagId)` - Many-to-many relationship
- **Favorite**: Composite PK `(UserId, RecipeId)`, `CreatedAt`

## Migration Commands

### Creating Migrations
```bash
# Add new migration
dotnet ef migrations add <MigrationName> --context ApplicationDbContext

# Example
dotnet ef migrations add AddCategoryTable --context ApplicationDbContext
```

### Applying Migrations
```bash
# Apply all pending migrations
dotnet ef database update --context ApplicationDbContext

# Apply to specific migration
dotnet ef database update <MigrationName> --context ApplicationDbContext

# Revert to previous migration
dotnet ef database update <PreviousMigrationName> --context ApplicationDbContext
```

### Viewing Migrations
```bash
# List all migrations
dotnet ef migrations list --context ApplicationDbContext

# Generate SQL script
dotnet ef migrations script --context ApplicationDbContext
```

### Removing Migrations
```bash
# Remove last migration (only if not applied)
dotnet ef migrations remove --context ApplicationDbContext
```

## Critical Rules

### After Pulling Changes
**ALWAYS** check for new migration files in `/backend/Migrations/`:
```bash
# If new migrations exist, apply them immediately
dotnet ef database update --context ApplicationDbContext
```
**Failure to apply migrations causes "no such column" errors!**

### Before Modifying Entities
1. Make entity model changes in `/backend/Models/`
2. Update `ApplicationDbContext` if needed
3. Create migration: `dotnet ef migrations add <DescriptiveName> --context ApplicationDbContext`
4. Review generated migration code
5. Apply migration: `dotnet ef database update --context ApplicationDbContext`
6. Test the changes
7. Commit both entity changes AND migration files together

### Entity Model Guidelines
- Use GUID for primary keys (`Guid` type)
- Use nullable types for optional properties
- Add navigation properties for relationships
- Configure indexes in `OnModelCreating` when needed
- Use `[Required]` attribute for required properties

### DbContext Configuration
Location: `/backend/Data/ApplicationDbContext.cs`
- Configure entity relationships in `OnModelCreating`
- Set up composite keys for junction tables
- Configure indexes for frequently queried columns
- Set up cascading delete behavior

## Common Issues

### "No such column" Error
**Cause**: Database schema out of sync with entity models
**Solution**: Run `dotnet ef database update --context ApplicationDbContext`

### Migration Conflicts
**Cause**: Multiple developers created migrations simultaneously
**Solution**: 
1. Pull latest changes
2. Remove your migration: `dotnet ef migrations remove`
3. Apply pending migrations: `dotnet ef database update --context ApplicationDbContext`
4. Recreate your migration: `dotnet ef migrations add YourMigration --context ApplicationDbContext`

### "No database provider configured"
**Cause**: Missing connection string
**Solution**: Set connection string in `appsettings.Development.json` or user secrets

### SQLite Database Locked
**Cause**: Multiple processes accessing SQLite simultaneously
**Solution**: 
- Use `--workers=1` for Playwright tests
- Close other connections to the database
- Restart the backend server

## Best Practices
- **Descriptive migration names**: Use clear names like `AddCategoryColorColumn`, not `Update1` or `Fix`
- **Review migrations**: Always review generated migration code before applying
- **Test migrations**: Test both `Up` and `Down` migrations
- **Commit migrations**: Always commit migration files with corresponding entity changes
- **Never edit applied migrations**: Create new migration to fix issues
- **Use transactions**: EF Core migrations use transactions by default
