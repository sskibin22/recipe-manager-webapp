# Recipe Filter Functionality Documentation

## Overview
The filter functionality allows users to filter recipes by category and type on the landing page. Filters work in combination with the existing search functionality and provide visual feedback through badges and filter chips.

## Components

### 1. FilterPanel Component (`/frontend/src/components/FilterPanel.jsx`)

A dropdown panel that appears when the filter button is clicked.

**Features:**
- Fetches categories from the backend API
- Displays checkboxes for category selection
- Displays checkboxes for recipe type selection (Manual, Link, Document)
- Shows "Apply" and "Clear All" buttons
- Closes when clicking outside the panel (using useRef and mousedown event listener)
- Responsive design (max-width constraint for mobile)

**Props:**
- `filters`: Object containing current filter state `{ categories: [], types: [] }`
- `onFiltersChange`: Callback function to update filter state
- `onClose`: Callback function to close the panel

**State Management:**
- Local state for selected categories and types
- Uses TanStack Query to fetch categories from `/api/categories`

### 2. FilterChips Component (`/frontend/src/components/FilterChips.jsx`)

Displays active filters as removable chips below the search bar.

**Features:**
- Shows category chips with color indicators
- Shows type chips 
- Individual remove button (X) for each filter
- "Clear all" text button to remove all filters at once
- Only renders when filters are active
- Color-coded: categories (blue), types (green)

**Props:**
- `filters`: Current filter state
- `onRemoveCategory`: Callback to remove a specific category filter
- `onRemoveType`: Callback to remove a specific type filter
- `onClearAll`: Callback to clear all filters

### 3. Landing Page Updates (`/frontend/src/pages/Landing.jsx`)

**Changes Made:**
1. Added filter state: `const [filters, setFilters] = useState({ categories: [], types: [] })`
2. Added filter panel open/close state: `const [isFilterOpen, setIsFilterOpen] = useState(false)`
3. Updated TanStack Query to include filters in query key for proper cache invalidation
4. Implemented client-side filtering for:
   - Multiple types (backend only supports single category filter)
   - Multiple categories when more than one is selected
5. Added handler functions:
   - `handleFiltersChange`: Update filter state
   - `handleRemoveCategory`: Remove single category filter
   - `handleRemoveType`: Remove single type filter
   - `handleClearAllFilters`: Clear all active filters

**UI Structure:**
```
┌─────────────────────────────────────────────────────┐
│ [Search Bar]  [Filter Button 🔽 (2)]  [Add Recipe]  │
│                                                       │
│ Active filters: [Dinner ×] [Link ×] Clear all        │
│                                                       │
│ [Recipe Grid]                                         │
└─────────────────────────────────────────────────────┘
```

## Filter Logic

### Backend Filtering (Server-Side)
- Single category filter via query parameter: `?category=<categoryId>`
- Search query via parameter: `?q=<searchTerm>`
- Backend endpoint: `GET /api/recipes?category=X&q=search`

### Frontend Filtering (Client-Side)
- Multiple category filters: Applied client-side on fetched results
- Type filters: Applied client-side on fetched results
- Rationale: Backend doesn't support multiple category or type filtering, so we filter the complete result set on the client

### Filter Combination Logic
```javascript
// Fetch from API (single category if only one selected, otherwise all recipes)
const categoryId = filters.categories?.length === 1 ? filters.categories[0] : null;
const allRecipes = await fetchRecipes(searchQuery, categoryId, []);

// Apply client-side filtering for types and multiple categories
const filteredRecipes = allRecipes.filter((recipe) => {
  // Filter by types if any are selected
  if (filters.types?.length > 0 && !filters.types.includes(recipe.type)) {
    return false;
  }
  
  // Filter by multiple categories if more than one is selected
  if (filters.categories?.length > 1) {
    if (!recipe.category || !filters.categories.includes(recipe.category.id)) {
      return false;
    }
  }
  
  return true;
});
```

## User Flows

### Applying Filters
1. User clicks "Filter" button
2. Filter panel opens
3. User selects desired categories and/or types
4. User clicks "Apply"
5. Filter panel closes
6. Filter chips appear showing active filters
7. Recipe list updates to show filtered results

### Removing Individual Filters
1. User clicks "×" on a filter chip
2. That specific filter is removed
3. Recipe list updates immediately

### Clearing All Filters
1. User clicks "Clear all" in filter chips OR "Clear All" button in filter panel
2. All filters are removed
3. Recipe list shows all recipes (with search applied if present)

### Combining with Search
1. Filters and search work together
2. Backend performs search first
3. Frontend applies category/type filters on search results
4. All active filters shown in chips

## Responsive Design

### Desktop
- Filter button appears between search bar and "Add Recipe" button
- Filter panel drops down from filter button
- Full width search bar with buttons on the right

### Mobile (< 640px)
- Search bar takes full width on first row
- Filter and "Add Recipe" buttons on second row, side by side
- Filter panel has `max-w-[calc(100vw-2rem)]` to fit within viewport
- Buttons are full width on mobile (`flex-1` utility)

## Accessibility

### Filter Button
- Clear label: "Filter"
- Visual badge shows count of active filters
- Keyboard accessible (standard button element)

### Filter Panel
- Close button with aria-label: "Close filter panel"
- Checkboxes with proper labels
- Form controls follow semantic HTML

### Filter Chips
- Remove buttons with descriptive aria-labels: "Remove {filter name} filter"
- Color contrast meets WCAG AA standards

## Testing

### Unit Tests
All existing unit tests pass (96 tests):
- RecipeCard.test.jsx (33 tests)
- RecipeList.test.jsx (7 tests)
- RecipeForm.test.jsx (26 tests)
- RecipeDetail.test.jsx (30 tests)

### E2E Tests
Created test structure in `/frontend/tests/e2e/recipe-filter.spec.js` for:
- Component structure verification
- Accessibility checks
- Integration with authentication

**Note:** Full E2E tests with authentication require Firebase configuration in test environment.

### Manual Testing Checklist
- [ ] Filter button appears next to search bar
- [ ] Clicking filter button opens panel
- [ ] Categories load from API
- [ ] Selecting categories updates local state
- [ ] Selecting types updates local state
- [ ] Apply button closes panel and applies filters
- [ ] Filter chips appear when filters are active
- [ ] Badge count on filter button is correct
- [ ] Individual chip removal works
- [ ] "Clear all" removes all filters
- [ ] Filters work with search query
- [ ] Multiple categories can be selected
- [ ] Multiple types can be selected
- [ ] Clicking outside panel closes it
- [ ] Mobile layout stacks correctly
- [ ] Filter panel doesn't overflow viewport on mobile

## Future Enhancements

1. **URL Parameters**: Persist filter state in URL for shareable filtered views
2. **Backend Multiple Filters**: Update backend to support multiple category/type filters
3. **Saved Filters**: Allow users to save frequently used filter combinations
4. **Filter Presets**: Add quick filter buttons like "Favorites", "Recent", etc.
5. **Advanced Filters**: Add filters for date ranges, ingredient counts, etc.
6. **Performance**: Implement pagination when filtering large recipe sets

## API Changes Required (None)

The implementation works with existing backend API:
- `GET /api/categories` - Fetch all categories
- `GET /api/recipes?category=X&q=search` - Fetch recipes with optional filters

No backend changes were needed for this feature.

## Files Modified

### New Files
1. `/frontend/src/components/FilterPanel.jsx` - Main filter panel component
2. `/frontend/src/components/FilterChips.jsx` - Active filter chips display
3. `/frontend/tests/e2e/recipe-filter.spec.js` - E2E test structure

### Modified Files
1. `/frontend/src/pages/Landing.jsx` - Integrated filter functionality

## Dependencies

No new dependencies were added. The feature uses existing libraries:
- React (useState, useEffect, useRef hooks)
- @tanstack/react-query (for category fetching)
- Existing API client (fetchRecipes, fetchCategories)
- Tailwind CSS (for styling)
