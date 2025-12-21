# JSDoc Type Annotations

This document describes the JSDoc type annotations added to the Recipe Manager frontend application.

## Overview

The frontend codebase now includes comprehensive JSDoc type annotations to improve:
- **Type Safety**: Catch type-related errors during development
- **IntelliSense**: Better autocomplete and documentation in IDEs (VS Code, etc.)
- **Code Documentation**: Self-documenting code with clear parameter and return types
- **Maintainability**: Easier to understand function signatures and data structures

## Type Definitions

Type definitions are located in `/src/types/` directory:

### `/src/types/recipe.js`
- `Recipe` - Main recipe entity with all properties
- `RecipeType` - Enum type for recipe types (Link, Document, Manual)
- `Category` - Recipe category entity
- `Tag` - Recipe tag entity
- `RecipeContent` - Structured content for manual recipes
- `RecipeCreateData` - Data required to create a recipe
- `RecipeUpdateData` - Data required to update a recipe
- `MetadataResponse` - Response from metadata fetch API

### `/src/types/user.js`
- `User` - Firebase user object
- `UserProfile` - Backend user profile entity

### `/src/types/api.js`
- `PresignedUploadResponse` - Cloud storage upload URL response
- `PresignedDownloadResponse` - Cloud storage download URL response
- `ApiError` - API error object structure
- `QueryParams` - Query parameters for API requests

## Annotated Files

### Services
- ✅ `/src/services/api.js` - All API functions fully annotated

### Components
- ✅ `/src/components/RecipeCard.jsx`
- ✅ `/src/components/RecipeForm.jsx`
- ✅ `/src/components/RecipeList.jsx`
- ✅ `/src/components/CategorySelector.jsx`
- ✅ `/src/components/TagSelector.jsx`
- ✅ `/src/components/CategoryBadge.jsx`
- ✅ `/src/components/TagBadge.jsx`
- ✅ `/src/components/SearchBar.jsx`
- ✅ `/src/components/AuthButton.jsx`
- ✅ `/src/components/FilterPanel.jsx`
- ✅ `/src/components/FilterChips.jsx`
- ✅ `/src/components/DocumentPreview.jsx`
- ✅ `/src/components/AuthForm.jsx`

### Pages
- ✅ `/src/pages/Landing.jsx`
- ✅ `/src/pages/RecipeDetail.jsx`
- ✅ `/src/pages/AuthCallback.jsx`
- ✅ `/src/pages/AccountSettings.jsx`

### Contexts
- ✅ `/src/contexts/AuthContext.jsx`

### Utils
- ✅ `/src/utils/recipeContent.js`

## Configuration

### `jsconfig.json`
The `jsconfig.json` file is configured with:
- `checkJs: true` - Enable type checking for JavaScript files
- `strict: true` - Enable strict type checking rules
- Type imports enabled for JSDoc type references

## Usage Examples

### Importing Types in Components

```javascript
/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 * @typedef {import('../types/recipe').Category} Category
 */

/**
 * Recipe card component
 * @param {Object} props
 * @param {Recipe} props.recipe - Recipe object to display
 * @returns {JSX.Element}
 */
const RecipeCard = ({ recipe }) => {
  // Your component code...
};
```

### Annotating API Functions

```javascript
/**
 * Fetch all recipes with optional filters
 * @param {string} [searchQuery=""] - Search term to filter by title
 * @param {number|null} [categoryId=null] - Category ID to filter by
 * @param {number[]} [tagIds=[]] - Tag IDs to filter by (AND logic)
 * @returns {Promise<Recipe[]>} Array of recipes
 */
export const fetchRecipes = async (searchQuery = "", categoryId = null, tagIds = []) => {
  // Implementation...
};
```

### Type Checking in IDE

With the JSDoc annotations and `jsconfig.json` configuration:

1. **Autocomplete**: VS Code will show available properties when accessing objects
2. **Error Detection**: Incorrect property names or types will be highlighted
3. **Documentation**: Hover over functions to see parameter descriptions
4. **Navigate to Type**: Cmd/Ctrl + Click on types to jump to definition

## Benefits

### Before JSDoc
```javascript
// No type information
const createRecipe = async (recipeData) => {
  // What properties does recipeData have?
  // What does this return?
};
```

### After JSDoc
```javascript
/**
 * Create new recipe
 * @param {RecipeCreateData} recipeData - Recipe data
 * @returns {Promise<Recipe>} Created recipe
 */
export const createRecipe = async (recipeData) => {
  // IDE knows exactly what properties are available
  // and what types they should be
};
```

## Type Checking Commands

### Check Types with TypeScript Compiler
```bash
# Check specific file
npx tsc --noEmit --allowJs --checkJs src/services/api.js

# Check all files (respects jsconfig.json)
npx tsc --noEmit
```

### Build (includes type checking in IDE)
```bash
npm run build
```

## Migration to TypeScript (Future)

If full TypeScript migration is desired in the future:

1. Rename `.js` → `.ts` and `.jsx` → `.tsx`
2. Replace JSDoc type annotations with TypeScript interfaces/types
3. Update `jsconfig.json` to `tsconfig.json`
4. Update Vite config if needed

The JSDoc annotations provide a smooth migration path since they already document all types.

## Maintenance

When adding new:
- **Components**: Add JSDoc for props and return type
- **API Functions**: Document parameters and return types
- **Types**: Add to appropriate file in `/src/types/`
- **Utilities**: Document all function parameters and returns

## Resources

- [JSDoc Official Documentation](https://jsdoc.app/)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [VS Code IntelliSense](https://code.visualstudio.com/docs/languages/javascript#_intellisense)
