import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecipeDetail from './RecipeDetail';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  recipesApi: {
    getById: vi.fn(),
    delete: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
  uploadsApi: {
    getPresignedDownloadUrl: vi.fn(),
  },
}));

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-recipe-id' }),
    useNavigate: () => vi.fn(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('RecipeDetail - Link Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display URL as clickable link with proper attributes for link-type recipe', async () => {
    const mockRecipe = {
      id: 'test-recipe-id',
      title: 'Test Link Recipe',
      type: 'link',
      url: 'https://example.com/recipe',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    // Wait for the recipe to load
    await waitFor(() => {
      expect(screen.getByText('Test Link Recipe')).toBeInTheDocument();
    });

    // Verify the "Recipe Link" heading is present
    expect(screen.getByText('Recipe Link')).toBeInTheDocument();

    // Find the link element
    const link = screen.getByRole('link', { name: 'https://example.com/recipe' });
    
    // Verify link exists and is visible
    expect(link).toBeInTheDocument();
    expect(link).toBeVisible();

    // Verify link has correct href
    expect(link).toHaveAttribute('href', 'https://example.com/recipe');

    // Verify link has target="_blank" for opening in new tab
    expect(link).toHaveAttribute('target', '_blank');

    // Verify link has security attributes
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    // Verify link has proper styling classes
    expect(link).toHaveClass('text-blue-600');
    expect(link).toHaveClass('hover:underline');
    expect(link).toHaveClass('break-all');
  });

  it('should not display link section for non-link type recipes', async () => {
    const mockRecipe = {
      id: 'test-recipe-id',
      title: 'Test Manual Recipe',
      type: 'manual',
      content: 'Recipe instructions here',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Manual Recipe')).toBeInTheDocument();
    });

    // Verify "Recipe Link" heading is NOT present
    expect(screen.queryByText('Recipe Link')).not.toBeInTheDocument();

    // Verify "Recipe" heading for manual type is present
    expect(screen.getByText('Recipe')).toBeInTheDocument();
  });

  it('should handle long URLs with break-all class', async () => {
    const longUrl = 'https://example.com/very/long/recipe/path/with/many/segments/that/could/overflow/the/container';
    const mockRecipe = {
      id: 'test-recipe-id',
      title: 'Test Recipe with Long URL',
      type: 'link',
      url: longUrl,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Recipe with Long URL')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: longUrl });
    
    // Verify link has break-all class for proper text wrapping
    expect(link).toHaveClass('break-all');
  });

  it('should not display link section if URL is missing', async () => {
    const mockRecipe = {
      id: 'test-recipe-id',
      title: 'Test Link Recipe Without URL',
      type: 'link',
      url: null, // Missing URL
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Link Recipe Without URL')).toBeInTheDocument();
    });

    // Verify "Recipe Link" section is not displayed when URL is missing
    expect(screen.queryByText('Recipe Link')).not.toBeInTheDocument();
  });
});
