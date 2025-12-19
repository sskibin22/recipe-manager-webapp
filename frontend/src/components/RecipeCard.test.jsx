import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecipeCard from "./RecipeCard";
import { renderWithProviders, mockRecipe } from "../test/testUtils";
import * as api from "../services/api";

// Mock the API module
vi.mock("../services/api", () => ({
  recipesApi: {
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
}));

describe("RecipeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render recipe title", () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />);

    expect(screen.getByText("Test Recipe")).toBeInTheDocument();
  });

  it("should display recipe type", () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />);

    expect(screen.getByText(/manual/i)).toBeInTheDocument();
  });

  it("should display creation date", () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />);

    expect(screen.getByText(/Added/i)).toBeInTheDocument();
  });

  it("should render link to recipe detail page", () => {
    renderWithProviders(<RecipeCard recipe={mockRecipe} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/recipe/${mockRecipe.id}`);
  });

  it("should display URL for link type recipes", () => {
    const linkRecipe = {
      ...mockRecipe,
      type: "link",
      url: "https://example.com/recipe",
    };

    renderWithProviders(<RecipeCard recipe={linkRecipe} />);

    expect(screen.getByText("https://example.com/recipe")).toBeInTheDocument();
  });

  it("should display content preview for manual type recipes", () => {
    const manualRecipe = {
      ...mockRecipe,
      type: "manual",
      content: "Test content for manual recipe",
    };

    renderWithProviders(<RecipeCard recipe={manualRecipe} />);

    expect(
      screen.getByText("Test content for manual recipe"),
    ).toBeInTheDocument();
  });

  it("should show filled star icon when recipe is favorited", () => {
    const favoriteRecipe = { ...mockRecipe, isFavorite: true };
    renderWithProviders(<RecipeCard recipe={favoriteRecipe} />);

    const favoriteButton = screen.getByLabelText(/Remove from favorites/i);
    expect(favoriteButton).toBeInTheDocument();
  });

  it("should show empty star icon when recipe is not favorited", () => {
    const nonFavoriteRecipe = { ...mockRecipe, isFavorite: false };
    renderWithProviders(<RecipeCard recipe={nonFavoriteRecipe} />);

    const favoriteButton = screen.getByLabelText(/Add to favorites/i);
    expect(favoriteButton).toBeInTheDocument();
  });

  it("should call addFavorite when clicking unfavorited star", async () => {
    const nonFavoriteRecipe = { ...mockRecipe, isFavorite: false };
    api.recipesApi.addFavorite.mockResolvedValue({});

    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(
      <RecipeCard recipe={nonFavoriteRecipe} />,
      {
        initialQueryData: {
          '["recipes"]': [nonFavoriteRecipe],
        },
      }
    );

    const favoriteButton = screen.getByLabelText(/Add to favorites/i);
    await user.click(favoriteButton);

    // Verify optimistic update happened in the cache
    await waitFor(() => {
      const recipes = queryClient.getQueryData(["recipes"]);
      expect(recipes[0].isFavorite).toBe(true);
    });
    
    // Verify API was called
    expect(api.recipesApi.addFavorite).toHaveBeenCalledWith(nonFavoriteRecipe.id);
  });

  it("should call removeFavorite when clicking favorited star", async () => {
    const favoriteRecipe = { ...mockRecipe, isFavorite: true };
    api.recipesApi.removeFavorite.mockResolvedValue({});

    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(
      <RecipeCard recipe={favoriteRecipe} />,
      {
        initialQueryData: {
          '["recipes"]': [favoriteRecipe],
        },
      }
    );

    const favoriteButton = screen.getByLabelText(/Remove from favorites/i);
    await user.click(favoriteButton);

    // Verify optimistic update happened in the cache
    await waitFor(() => {
      const recipes = queryClient.getQueryData(["recipes"]);
      expect(recipes[0].isFavorite).toBe(false);
    });
    
    // Verify API was called
    expect(api.recipesApi.removeFavorite).toHaveBeenCalledWith(favoriteRecipe.id);
  });

  it("should toggle favorite state optimistically", async () => {
    const nonFavoriteRecipe = { ...mockRecipe, isFavorite: false };
    
    // Mock a slow API to verify optimistic update happens before API completes
    let resolveApiCall;
    api.recipesApi.addFavorite.mockImplementation(
      () => new Promise((resolve) => { resolveApiCall = resolve; })
    );

    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(
      <RecipeCard recipe={nonFavoriteRecipe} />,
      {
        initialQueryData: {
          '["recipes"]': [nonFavoriteRecipe],
        },
      }
    );

    const favoriteButton = screen.getByLabelText(/Add to favorites/i);
    const clickPromise = user.click(favoriteButton);

    // Verify optimistic update happened immediately (before API completes)
    await waitFor(() => {
      const recipes = queryClient.getQueryData(["recipes"]);
      expect(recipes[0].isFavorite).toBe(true);
    });
    
    // Clean up - resolve the API call
    resolveApiCall({});
    await clickPromise;
  });

  it("should display correct icon for link type", () => {
    const linkRecipe = { ...mockRecipe, type: "link" };
    renderWithProviders(<RecipeCard recipe={linkRecipe} />);

    expect(screen.getByText(/link/i)).toBeInTheDocument();
  });

  it("should display correct icon for document type", () => {
    const documentRecipe = { ...mockRecipe, type: "document" };
    renderWithProviders(<RecipeCard recipe={documentRecipe} />);

    expect(screen.getByText(/document/i)).toBeInTheDocument();
  });

  it("should display correct icon for manual type", () => {
    const manualRecipe = { ...mockRecipe, type: "manual" };
    renderWithProviders(<RecipeCard recipe={manualRecipe} />);

    expect(screen.getByText(/manual/i)).toBeInTheDocument();
  });

  it("should disable favorite button during mutation", async () => {
    const nonFavoriteRecipe = { ...mockRecipe, isFavorite: false };

    let resolvePromise;
    // Mock a slow API response that we control
    api.recipesApi.addFavorite.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () => resolve({});
        }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RecipeCard recipe={nonFavoriteRecipe} />);

    const favoriteButton = screen.getByLabelText(/Add to favorites/i);

    // Click and don't wait for completion
    const clickPromise = user.click(favoriteButton);

    // Button should be disabled during mutation
    await waitFor(() => {
      expect(favoriteButton).toBeDisabled();
    });

    // Resolve the promise to clean up
    if (resolvePromise) {
      resolvePromise();
    }
    await clickPromise;
  });

  it("should show spinner during mutation", async () => {
    const nonFavoriteRecipe = { ...mockRecipe, isFavorite: false };

    let resolvePromise;
    // Mock a slow API response that we control
    api.recipesApi.addFavorite.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () => resolve({});
        }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RecipeCard recipe={nonFavoriteRecipe} />);

    const favoriteButton = screen.getByLabelText(/Add to favorites/i);

    // Click and don't wait for completion
    const clickPromise = user.click(favoriteButton);

    // Spinner should be visible
    await waitFor(() => {
      const spinner = favoriteButton.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    // Resolve the promise to clean up
    if (resolvePromise) {
      resolvePromise();
    }
    await clickPromise;
  });

  it("should apply opacity styles when pending", async () => {
    const nonFavoriteRecipe = { ...mockRecipe, isFavorite: false };

    let resolvePromise;
    // Mock a slow API response that we control
    api.recipesApi.addFavorite.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () => resolve({});
        }),
    );

    const user = userEvent.setup();
    renderWithProviders(<RecipeCard recipe={nonFavoriteRecipe} />);

    const favoriteButton = screen.getByLabelText(/Add to favorites/i);

    // Click and don't wait for completion
    const clickPromise = user.click(favoriteButton);

    // Button should have opacity class
    await waitFor(() => {
      expect(favoriteButton).toHaveClass("opacity-50");
    });

    // Resolve the promise to clean up
    if (resolvePromise) {
      resolvePromise();
    }
    await clickPromise;
  });

  it("should display placeholder image when previewImageUrl is null", () => {
    const recipeWithoutImage = { ...mockRecipe, previewImageUrl: null };
    renderWithProviders(<RecipeCard recipe={recipeWithoutImage} />);

    const image = screen.getByAltText(mockRecipe.title);
    expect(image).toHaveAttribute("src", "/recipe-placeholder.svg");
  });

  it("should display placeholder image when previewImageUrl is empty", () => {
    const recipeWithoutImage = { ...mockRecipe, previewImageUrl: "" };
    renderWithProviders(<RecipeCard recipe={recipeWithoutImage} />);

    const image = screen.getByAltText(mockRecipe.title);
    expect(image).toHaveAttribute("src", "/recipe-placeholder.svg");
  });

  it("should display actual image when previewImageUrl is provided", () => {
    const recipeWithImage = {
      ...mockRecipe,
      previewImageUrl: "https://example.com/image.jpg",
    };
    renderWithProviders(<RecipeCard recipe={recipeWithImage} />);

    const image = screen.getByAltText(mockRecipe.title);
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("should always render image container for consistent layout", () => {
    const recipeWithoutImage = { ...mockRecipe, previewImageUrl: null };
    const { container } = renderWithProviders(
      <RecipeCard recipe={recipeWithoutImage} />,
    );

    // Check that the image container div exists
    const imageContainer = container.querySelector(".h-48");
    expect(imageContainer).toBeInTheDocument();
  });
});
