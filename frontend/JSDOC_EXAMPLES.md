# JSDoc Type Annotations - Examples

This document provides real-world examples of how the JSDoc type annotations improve the development experience.

## Example 1: API Function with Type Safety

### Before (No Types)
```javascript
// What does this function return? What parameters does it take?
export const fetchRecipes = async (searchQuery, categoryId, tagIds) => {
  const params = {};
  if (searchQuery) params.q = searchQuery;
  if (categoryId) params.category = categoryId;
  if (tagIds && tagIds.length > 0) params.tags = tagIds.join(',');
  
  const response = await apiClient.get("/api/recipes", { params });
  return response.data; // What type is this?
};
```

### After (With JSDoc)
```javascript
/**
 * Fetch all recipes with optional filters
 * @param {string} [searchQuery=""] - Search term to filter by title
 * @param {number|null} [categoryId=null] - Category ID to filter by
 * @param {number[]} [tagIds=[]] - Tag IDs to filter by (AND logic)
 * @returns {Promise<Recipe[]>} Array of recipes
 */
export const fetchRecipes = async (searchQuery = "", categoryId = null, tagIds = []) => {
  const params = {};
  if (searchQuery) params.q = searchQuery;
  if (categoryId) params.category = categoryId;
  if (tagIds && tagIds.length > 0) params.tags = tagIds.join(',');
  
  const response = await apiClient.get("/api/recipes", { params });
  return response.data; // IDE knows this is Recipe[]
};
```

**Benefits:**
- IDE shows parameter types and descriptions when you type the function name
- Autocomplete suggests correct parameter types
- Hover over the function to see full documentation
- Return type is known, so accessing recipe properties is type-safe

## Example 2: Component Props with IntelliSense

### Before (No Types)
```jsx
const RecipeCard = ({ recipe }) => {
  // IDE doesn't know what properties recipe has
  // Could typo recipe.titel instead of recipe.title
  return (
    <div>
      <h3>{recipe.title}</h3>
      <p>{recipe.description}</p>
      {/* What other properties are available? */}
    </div>
  );
};
```

### After (With JSDoc)
```jsx
/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 */

/**
 * Recipe card component - displays a recipe in card format
 * @param {Object} props
 * @param {Recipe} props.recipe - Recipe object to display
 * @returns {JSX.Element}
 */
const RecipeCard = ({ recipe }) => {
  // IDE knows recipe has: id, title, type, url, description, etc.
  // Autocomplete shows all available properties
  // Typos are caught: recipe.titel → error!
  return (
    <div>
      <h3>{recipe.title}</h3> {/* ✓ IDE confirms this property exists */}
      <p>{recipe.description}</p> {/* ✓ Optional property handled */}
      <span>{recipe.type}</span> {/* ✓ Type is 'Link'|'Document'|'Manual' */}
    </div>
  );
};
```

**Benefits:**
- Autocomplete suggests all available recipe properties
- IDE warns if you access a property that doesn't exist
- Hover over `recipe` to see the full Recipe type definition
- Optional properties are clearly marked

## Example 3: Type Imports and Reuse

### Type Definition (recipe.js)
```javascript
/**
 * @typedef {Object} Recipe
 * @property {string} id - Recipe ID (GUID)
 * @property {string} title - Recipe title
 * @property {'Link'|'Document'|'Manual'} type - Recipe type
 * @property {string} [url] - External recipe URL (for Link type)
 * @property {boolean} isFavorite - Whether recipe is favorited
 * @property {Category} [category] - Recipe category
 * @property {Tag[]} tags - Recipe tags
 */
```

### Usage in Multiple Files
```javascript
// In RecipeCard.jsx
/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 */
const RecipeCard = ({ recipe }) => { /* ... */ };

// In RecipeList.jsx
/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 */
const RecipeList = ({ recipes }) => { /* recipes is Recipe[] */ };

// In api.js
/**
 * @typedef {import('../types/recipe').Recipe} Recipe
 */
export const fetchRecipe = async (id) => { /* returns Promise<Recipe> */ };
```

**Benefits:**
- Single source of truth for types
- Changes to type definitions propagate everywhere
- IDE can jump to type definition with Cmd/Ctrl + Click
- Consistent types across entire codebase

## Example 4: Error Detection

### Caught by Type Checking

```javascript
/**
 * @param {Recipe} recipe
 */
function displayRecipe(recipe) {
  console.log(recipe.titel); // ❌ IDE error: Property 'titel' does not exist
                              // Did you mean 'title'?
  
  console.log(recipe.type);   // ✓ OK
  
  recipe.type = "PDF";        // ❌ IDE error: Type '"PDF"' is not assignable
                              // Expected: 'Link'|'Document'|'Manual'
}
```

### Type Mismatches

```javascript
/**
 * @param {number} categoryId
 */
function filterByCategory(categoryId) {
  // ...
}

filterByCategory("5");      // ❌ IDE error: Argument of type 'string'
                           // is not assignable to parameter of type 'number'

filterByCategory(5);        // ✓ OK
```

## Example 5: Complex Type Structures

### Nested Types
```javascript
/**
 * @typedef {Object} Recipe
 * @property {Category} [category] - Recipe category
 * @property {Tag[]} tags - Recipe tags
 */

// When you access recipe.category:
const recipe = await fetchRecipe(id);
console.log(recipe.category.name);   // ✓ IDE knows Category has 'name'
console.log(recipe.category.color);  // ✓ IDE knows Category has 'color'
console.log(recipe.category.foo);    // ❌ IDE error: Property 'foo' does not exist

// When you access recipe.tags:
recipe.tags.forEach(tag => {
  console.log(tag.name);   // ✓ IDE knows Tag has 'name'
  console.log(tag.color);  // ✓ IDE knows Tag has 'color'
  console.log(tag.type);   // ✓ IDE knows Tag has 'type'
});
```

## Example 6: Function Return Types

### API Response Handling
```javascript
/**
 * @returns {Promise<Recipe[]>}
 */
async function getRecipes() {
  const recipes = await fetchRecipes();
  
  // IDE knows recipes is Recipe[]
  recipes.forEach(recipe => {
    console.log(recipe.title);    // ✓ Autocomplete available
    console.log(recipe.createdAt); // ✓ Knows this is a string (ISO 8601)
  });
  
  return recipes;
}

// When calling the function:
const myRecipes = await getRecipes();
// IDE knows myRecipes is Recipe[]
// Can access array methods and Recipe properties
```

## Example 7: Optional Parameters

### With Default Values
```javascript
/**
 * @param {string} [searchQuery=""] - Optional search term
 * @param {number|null} [categoryId=null] - Optional category filter
 */
function search(searchQuery = "", categoryId = null) {
  // IDE knows searchQuery is string (never undefined)
  // IDE knows categoryId is number|null (never undefined)
}

// All valid calls:
search();                    // ✓
search("pasta");            // ✓
search("pasta", 5);         // ✓
search("pasta", null);      // ✓
search("pasta", "invalid"); // ❌ IDE error: Expected number|null
```

## Example 8: VS Code IntelliSense Screenshots

While in VS Code (or similar IDE):

### 1. Function Parameter Help
When you type `fetchRecipes(`, you'll see:
```
fetchRecipes(searchQuery?: string, categoryId?: number | null, tagIds?: number[])
Returns: Promise<Recipe[]>

Fetch all recipes with optional filters

Parameters:
- searchQuery?: Search term to filter by title
- categoryId?: Category ID to filter by
- tagIds?: Tag IDs to filter by (AND logic)
```

### 2. Object Property Autocomplete
When you type `recipe.`, you'll see a dropdown with:
```
- id: string
- title: string
- type: 'Link'|'Document'|'Manual'
- url?: string
- storageKey?: string
- content?: string
- previewImageUrl?: string
- description?: string
- siteName?: string
- createdAt: string
- updatedAt: string
- isFavorite: boolean
- category?: Category
- tags: Tag[]
```

### 3. Type Hints on Hover
Hover over `Recipe` type and see:
```
type Recipe = {
  id: string;
  title: string;
  type: 'Link' | 'Document' | 'Manual';
  url?: string;
  // ... (full definition)
}
```

## Benefits Summary

✅ **Autocomplete**: See available properties and methods as you type
✅ **Error Detection**: Catch typos and type mismatches before running code
✅ **Documentation**: View function and parameter descriptions without leaving the editor
✅ **Refactoring**: Safely rename properties across the entire codebase
✅ **Navigation**: Jump to type definitions with Cmd/Ctrl + Click
✅ **Confidence**: Write code knowing it's type-safe
✅ **Team Collaboration**: New developers can understand the codebase faster
✅ **Maintainability**: Self-documenting code reduces need for external docs

## Getting Started

1. Open any file with type annotations in VS Code
2. Try typing a function name and see parameter hints
3. Try accessing an object property and see autocomplete
4. Hover over types and functions to see documentation
5. Cmd/Ctrl + Click on a type to jump to its definition

Enjoy improved type safety and developer experience! 🚀
