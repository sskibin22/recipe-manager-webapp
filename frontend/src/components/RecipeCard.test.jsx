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
  categoriesApi: {
    getAll: vi.fn(() => Promise.resolve([])),
  },
  tagsApi: {
    getAll: vi.fn(() => Promise.resolve([])),
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

  it("should display content preview for manual type recipes with legacy plain text", () => {
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

  it("should display description from parsed JSON for manual recipe", () => {
    const manualRecipe = {
      ...mockRecipe,
      type: "manual",
      content: JSON.stringify({
        description: "A delicious recipe",
        ingredients: "2 cups flour\n1 cup sugar",
        instructions: "Mix and bake",
        notes: "Best served warm"
      }),
      description: null, // No separate description field
    };

    renderWithProviders(<RecipeCard recipe={manualRecipe} />);

    expect(screen.getByText("A delicious recipe")).toBeInTheDocument();
    // Should NOT show the ingredients or instructions
    expect(screen.queryByText(/2 cups flour/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mix and bake/)).not.toBeInTheDocument();
  });

  it("should fallback to ingredients when description is empty in manual recipe", () => {
    const manualRecipe = {
      ...mockRecipe,
      type: "manual",
      content: JSON.stringify({
        description: "",
        ingredients: "2 cups flour\n1 cup sugar\n3 eggs",
        instructions: "Mix and bake",
        notes: ""
      }),
      description: null,
    };

    renderWithProviders(<RecipeCard recipe={manualRecipe} />);

    expect(screen.getByText(/2 cups flour/)).toBeInTheDocument();
  });

  it("should fallback to instructions when both description and ingredients are empty", () => {
    const manualRecipe = {
      ...mockRecipe,
      type: "manual",
      content: JSON.stringify({
        description: "",
        ingredients: "",
        instructions: "Preheat oven to 350°F\nMix ingredients\nBake for 30 minutes",
        notes: ""
      }),
      description: null,
    };

    renderWithProviders(<RecipeCard recipe={manualRecipe} />);

    expect(screen.getByText(/Preheat oven to 350°F/)).toBeInTheDocument();
  });

  it("should use separate description field over parsed content description", () => {
    const manualRecipe = {
      ...mockRecipe,
      type: "manual",
      content: JSON.stringify({
        description: "Content description",
        ingredients: "2 cups flour",
        instructions: "Mix",
        notes: ""
      }),
      description: "Separate field description", // This should take priority
    };

    renderWithProviders(<RecipeCard recipe={manualRecipe} />);

    expect(screen.getByText("Separate field description")).toBeInTheDocument();
    // Should NOT show the content description
    expect(screen.queryByText("Content description")).not.toBeInTheDocument();
  });

  it("should apply line-clamp-3 class to long descriptions for CSS truncation", () => {
    // Create a long description (10 repetitions = ~590 characters)
    const longDescription = "This is a very long description that should be truncated. ".repeat(10).trim();
    const manualRecipe = {
      ...mockRecipe,
      type: "manual",
      content: JSON.stringify({
        description: longDescription,
        ingredients: "2 cups flour",
        instructions: "Mix",
        notes: ""
      }),
      description: null,
    };

    const { container } = renderWithProviders(<RecipeCard recipe={manualRecipe} />);

    // Verify the text container has line-clamp-3 class
    const textElement = container.querySelector('.line-clamp-3');
    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveTextContent(longDescription);
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

  describe("Category Display in Header", () => {
    it("should display category badge in the header row when category exists", () => {
      const recipeWithCategory = {
        ...mockRecipe,
        category: {
          id: "cat-123",
          name: "Desserts",
          color: "#FF5733",
        },
      };
      const { container } = renderWithProviders(
        <RecipeCard recipe={recipeWithCategory} />,
      );

      // Find the header row (the one with justify-between class)
      const headerRow = container.querySelector(".flex.justify-between");
      expect(headerRow).toBeInTheDocument();

      // Verify category name is displayed in the header
      expect(screen.getByText("Desserts")).toBeInTheDocument();
      
      // Verify the category badge has the correct styling
      const categoryBadge = screen.getByText("Desserts").closest("span");
      expect(categoryBadge).toHaveClass("inline-flex");
      expect(categoryBadge).toHaveClass("items-center");
    });

    it("should not display category badge when recipe has no category", () => {
      const recipeWithoutCategory = {
        ...mockRecipe,
        category: null,
      };
      renderWithProviders(<RecipeCard recipe={recipeWithoutCategory} />);

      // Category should not be displayed anywhere
      expect(screen.queryByText(/category/i)).not.toBeInTheDocument();
    });

    it("should position category after site name for link recipes", () => {
      const linkRecipeWithCategory = {
        ...mockRecipe,
        type: "link",
        siteName: "Example Site",
        category: {
          id: "cat-123",
          name: "Quick Meals",
          color: "#4CAF50",
        },
      };
      const { container } = renderWithProviders(
        <RecipeCard recipe={linkRecipeWithCategory} />,
      );

      // Get the header content area (not including favorite button)
      const headerContent = container.querySelector(".flex.items-center.gap-2");
      expect(headerContent).toBeInTheDocument();

      // Both site name and category should be in the header
      expect(screen.getByText("Example Site")).toBeInTheDocument();
      expect(screen.getByText("Quick Meals")).toBeInTheDocument();
    });

    it("should position category after recipe type for manual recipes", () => {
      const manualRecipeWithCategory = {
        ...mockRecipe,
        type: "manual",
        category: {
          id: "cat-456",
          name: "Breakfast",
          color: "#FFC107",
        },
      };
      renderWithProviders(<RecipeCard recipe={manualRecipeWithCategory} />);

      // Recipe type and category should both be visible
      expect(screen.getByText(/manual/i)).toBeInTheDocument();
      expect(screen.getByText("Breakfast")).toBeInTheDocument();
    });

    it("should position category after recipe type for document recipes", () => {
      const documentRecipeWithCategory = {
        ...mockRecipe,
        type: "document",
        category: {
          id: "cat-789",
          name: "Lunch",
          color: "#2196F3",
        },
      };
      renderWithProviders(<RecipeCard recipe={documentRecipeWithCategory} />);

      // Recipe type and category should both be visible
      expect(screen.getByText(/document/i)).toBeInTheDocument();
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    it("should maintain proper layout when category text is long", () => {
      const recipeWithLongCategory = {
        ...mockRecipe,
        category: {
          id: "cat-999",
          name: "Very Long Category Name That Might Wrap",
          color: "#9C27B0",
        },
      };
      const { container } = renderWithProviders(
        <RecipeCard recipe={recipeWithLongCategory} />,
      );

      // Header should have flex-wrap to handle long content
      const headerContent = container.querySelector(
        ".flex.items-center.gap-2.flex-wrap",
      );
      expect(headerContent).toBeInTheDocument();

      // Category should still be visible
      expect(
        screen.getByText("Very Long Category Name That Might Wrap"),
      ).toBeInTheDocument();
    });

    it("should keep favorite button on the right side with category present", () => {
      const recipeWithCategory = {
        ...mockRecipe,
        isFavorite: false,
        category: {
          id: "cat-321",
          name: "Dinner",
          color: "#E91E63",
        },
      };
      const { container } = renderWithProviders(
        <RecipeCard recipe={recipeWithCategory} />,
      );

      // Header should maintain justify-between layout
      const headerRow = container.querySelector(".flex.justify-between");
      expect(headerRow).toBeInTheDocument();

      // Favorite button should still be present
      const favoriteButton = screen.getByLabelText(/Add to favorites/i);
      expect(favoriteButton).toBeInTheDocument();

      // Category should also be present
      expect(screen.getByText("Dinner")).toBeInTheDocument();
    });
  });
});
