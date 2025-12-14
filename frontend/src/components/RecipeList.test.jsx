import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import RecipeList from './RecipeList';
import { renderWithProviders, mockRecipes } from '../test/testUtils';

describe('RecipeList', () => {
  it('should display loading state', () => {
    renderWithProviders(<RecipeList recipes={[]} isLoading={true} error={null} />);
    
    // Look for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should display error state', () => {
    const errorMessage = 'Failed to load recipes';
    renderWithProviders(<RecipeList recipes={[]} isLoading={false} error={new Error(errorMessage)} />);
    
    expect(screen.getByText(/Failed to load recipes/i)).toBeInTheDocument();
    expect(screen.getByText(/Please try again/i)).toBeInTheDocument();
  });

  it('should display empty state when no recipes', () => {
    renderWithProviders(<RecipeList recipes={[]} isLoading={false} error={null} />);
    
    expect(screen.getByText(/No recipes found/i)).toBeInTheDocument();
    expect(screen.getByText(/Add your first recipe to get started!/i)).toBeInTheDocument();
  });

  it('should render recipe cards when recipes are provided', () => {
    renderWithProviders(<RecipeList recipes={mockRecipes} isLoading={false} error={null} />);
    
    // Check that both recipes are rendered
    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('Another Recipe')).toBeInTheDocument();
  });

  it('should render correct number of recipe cards', () => {
    renderWithProviders(<RecipeList recipes={mockRecipes} isLoading={false} error={null} />);
    
    // Should render 2 recipe cards
    const recipeCards = screen.getAllByRole('link');
    expect(recipeCards).toHaveLength(2);
  });

  it('should handle null recipes gracefully', () => {
    renderWithProviders(<RecipeList recipes={null} isLoading={false} error={null} />);
    
    expect(screen.getByText(/No recipes found/i)).toBeInTheDocument();
  });

  it('should handle undefined recipes gracefully', () => {
    renderWithProviders(<RecipeList recipes={undefined} isLoading={false} error={null} />);
    
    expect(screen.getByText(/No recipes found/i)).toBeInTheDocument();
  });
});
