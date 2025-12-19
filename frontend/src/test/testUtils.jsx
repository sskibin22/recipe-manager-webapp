import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

// Create a custom render function that includes providers
export function renderWithProviders(ui, options = {}) {
  const { initialQueryData, ...renderOptions } = options;
  
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Set initial query data if provided
  if (initialQueryData) {
    Object.entries(initialQueryData).forEach(([key, data]) => {
      queryClient.setQueryData(JSON.parse(key), data);
    });
  }

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock user for testing
export const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  displayName: "Test User",
  getIdToken: async () => "mock-token-12345",
};

// Mock recipe data
export const mockRecipe = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Test Recipe",
  type: "manual",
  content: "Test content",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  isFavorite: false,
};

export const mockRecipes = [
  mockRecipe,
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    title: "Another Recipe",
    type: "link",
    url: "https://example.com/recipe",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    isFavorite: true,
  },
];

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
