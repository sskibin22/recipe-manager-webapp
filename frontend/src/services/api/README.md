# API Services

This directory contains domain-specific API service modules for the Recipe Manager application. The services are organized by domain to improve code organization, maintainability, and testability.

## Structure

```
/services/api/
├── apiClient.js          # Shared axios instance, interceptors, error handling
├── recipeService.js      # Recipe CRUD operations
├── categoryService.js    # Category operations
├── tagService.js         # Tag operations
├── favoriteService.js    # Favorite add/remove operations
├── uploadService.js      # File upload operations
├── userService.js        # User profile operations
├── index.js              # Barrel export with backward compatibility
└── __tests__/            # Unit tests for each service
    ├── apiClient.test.js
    ├── recipeService.test.js
    ├── categoryService.test.js
    ├── tagService.test.js
    ├── favoriteService.test.js
    ├── uploadService.test.js
    ├── userService.test.js
    └── index.test.js
```

## Usage

### New Recommended Pattern (Service Objects)

Import domain-specific services for better organization:

```javascript
import { recipeService, categoryService, uploadService } from '@/services/api';

// Recipe operations
const recipes = await recipeService.getAll('pasta', categoryId, [tagId1, tagId2]);
const recipe = await recipeService.getById('recipe-id');
await recipeService.create(recipeData);
await recipeService.update({ id, ...updates });
await recipeService.delete('recipe-id');

// Category operations
const categories = await categoryService.getAll();

// Upload operations
const uploadUrl = await uploadService.getPresignedUploadUrl('file.pdf', 'application/pdf');
```

### Alternative Pattern (Unified API Object)

Use the unified API object for convenience:

```javascript
import { api } from '@/services/api';

const recipes = await api.recipes.getAll('search', categoryId, tagIds);
const categories = await api.categories.getAll();
const tags = await api.tags.getAll();
```

### Legacy Pattern (Backward Compatible)

All existing imports continue to work without changes:

```javascript
import { recipesApi, categoriesApi, tagsApi, uploadsApi } from '@/services/api';
import { fetchRecipes, createRecipe, updateRecipe } from '@/services/api';
import { setTokenGetter, getErrorMessage } from '@/services/api';
```

## Services

### apiClient

**File:** `apiClient.js`

Exports the shared axios instance and utility functions:

- `apiClient` - Configured axios instance with base URL and interceptors
- `setTokenGetter(tokenGetter)` - Set authentication token retrieval function
- `getErrorMessage(error)` - Extract user-friendly error messages (supports RFC 7807)

### recipeService

**File:** `recipeService.js`

Recipe CRUD operations:

- `getAll(searchQuery, categoryId, tagIds)` - Fetch recipes with optional filters
- `getById(id)` - Fetch single recipe by ID
- `create(recipeData)` - Create new recipe
- `update({ id, ...recipeData })` - Update existing recipe
- `delete(id)` - Delete recipe by ID
- `addFavorite(recipeId)` - Add recipe to favorites
- `removeFavorite(recipeId)` - Remove recipe from favorites
- `fetchMetadata(url)` - Fetch metadata from external URL

### categoryService

**File:** `categoryService.js`

Category operations:

- `getAll()` - Fetch all categories

### tagService

**File:** `tagService.js`

Tag operations:

- `getAll()` - Fetch all tags

### favoriteService

**File:** `favoriteService.js`

Favorite operations:

- `add(recipeId)` - Add recipe to favorites
- `remove(recipeId)` - Remove recipe from favorites

### uploadService

**File:** `uploadService.js`

File upload operations:

- `getPresignedUploadUrl(fileName, contentType)` - Get presigned upload URL for cloud storage
- `getPresignedDownloadUrl(recipeId)` - Get presigned download URL
- `uploadToPresignedUrl(presignedUrl, file)` - Upload file to presigned URL

### userService

**File:** `userService.js`

User profile operations:

- `getProfile()` - Get current user profile
- `updateProfile(profileData)` - Update user profile

## Testing

Each service has comprehensive unit tests in the `__tests__` directory. Run tests with:

```bash
npm test
```

Test specific services:

```bash
npm test recipeService.test.js
npm test uploadService.test.js
```

## Backward Compatibility

The refactored API maintains 100% backward compatibility:

- Original `api.js` re-exports all functions from the new modular structure
- Legacy object exports (`recipesApi`, `categoriesApi`, etc.) are maintained
- All individual function exports are preserved
- Existing component imports require no changes

## Benefits

1. **Clear Separation of Concerns** - Each service focuses on a single domain
2. **Easier to Find Code** - Domain-specific organization makes navigation simpler
3. **Better Testability** - Services can be tested and mocked independently
4. **Scalable Architecture** - Easy to add new domains without cluttering a single file
5. **Tree-Shaking Friendly** - Import only what you need for smaller bundles
6. **Type Safety** - JSDoc comments provide intellisense and type checking

## Migration Guide

### For New Code

Use the new service imports:

```javascript
// Before
import { recipesApi } from '@/services/api';

// After
import { recipeService } from '@/services/api';
```

### For Existing Code

No changes required! All existing imports continue to work:

```javascript
// These still work
import { recipesApi, fetchRecipes, createRecipe } from '@/services/api';
```

### Gradual Migration

Components can be migrated incrementally:

1. Update imports to use new service modules
2. Test component thoroughly
3. Move to next component

No need to update all components at once.

## Related Files

- **Original API file:** `/services/api.js` (now a compatibility shim)
- **JSDoc Types:** `/types/recipe.js`, `/types/api.js`, `/types/user.js`
