---
applyTo: "frontend/src/**/*.jsx,frontend/src/**/*.js,frontend/src/**/*.tsx,frontend/src/**/*.ts"
excludeAgent: "code-review"
---

# Frontend React Instructions

## Architecture Pattern
This frontend follows **React with TanStack Query** pattern:
- **Server State**: TanStack Query (React Query) for API data
- **Global State**: React Context for authentication only
- **Local State**: useState for UI-only state (modals, forms, toggles)
- **Routing**: React Router for navigation

## Critical Rules

### State Management
**NEVER** store server data in useState. ALWAYS use React Query:
```javascript
// ✅ CORRECT: Use React Query
const { data: recipes, isLoading } = useQuery({
  queryKey: ['recipes', searchQuery],
  queryFn: () => recipeService.fetchRecipes(searchQuery),
});

// ❌ WRONG: Store server data in useState
const [recipes, setRecipes] = useState([]);
useEffect(() => {
  fetchRecipes().then(setRecipes);
}, []);
```

### Component Organization
- Keep components under 200 lines
- One component per file
- Use functional components with hooks (no class components)
- Extract complex logic into custom hooks
- Feature-based directory structure:
  - `components/recipe/` - Recipe-related components
  - `components/shared/` - Reusable UI components
  - `components/auth/` - Authentication components

### Custom Hooks Pattern
- Prefix all hooks with `use`: `useRecipeForm`, `useAuth`
- Keep hooks focused on ONE responsibility
- Extract repeated React Query patterns into shared hooks
- Return objects for multiple values: `{ data, loading, error, handleSubmit }`

### React Query Best Practices
```javascript
// Query hook with proper caching
export const useRecipesQuery = (searchQuery, categoryId) => {
  return useQuery({
    queryKey: ['recipes', searchQuery, categoryId],
    queryFn: () => recipeService.fetchRecipes(searchQuery, categoryId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook with invalidation
export const useCreateRecipeMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: recipeService.createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes']);
    },
  });
};
```

### API Service Pattern
- Create one service file per domain: `recipeService.js`, `categoryService.js`
- Export named functions (not default export)
- Handle auth token injection in Axios interceptor
- Document all functions with JSDoc

### Form Handling
- Use custom hooks for form state: `useRecipeForm`
- Extract validation logic into `/utils/validation.js`
- Disable submit buttons during API calls
- Handle both client and server validation errors

### Styling
- Use Tailwind CSS utility classes
- Minimal custom CSS (only when necessary)
- Follow mobile-first responsive design
- Use Tailwind spacing scale: 2, 4, 8, 16, 24, 32

## Build Commands
- **Install**: `npm install` (run after package.json changes)
- **Dev**: `npm run dev` (starts on http://localhost:5173)
- **Build**: `npm run build`
- **Test**: `npm run test` (MUST pass before committing)
- **Lint**: `npm run lint`
- **E2E**: `npm run test:e2e` (requires backend running)

## Environment Variables
All environment variables MUST be prefixed with `VITE_`:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_BYPASS_AUTH` - Set to `"true"` for dev mode (required for Playwright tests)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`

**CRITICAL**: Restart dev server after changing `.env.local`

## Common Anti-Patterns to AVOID
- ❌ Storing server data in useState
- ❌ Duplicating API calls across components
- ❌ Mixing view and edit logic in one component
- ❌ Duplicating validation logic
- ❌ Putting all API calls in one giant file
- ❌ Ignoring loading and error states
