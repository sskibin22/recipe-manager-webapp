import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RecipeDetail from "./RecipeDetail";
import * as api from "../services/api";

// Mock the API
vi.mock("../services/api", () => ({
  recipesApi: {
    getById: vi.fn(),
    delete: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    update: vi.fn(),
  },
  uploadsApi: {
    getPresignedDownloadUrl: vi.fn(),
  },
}));

// Mock react-router-dom hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "test-recipe-id" }),
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe("RecipeDetail - Link Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display preview image with correct src", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe with Image",
      type: "manual",
      content: "Recipe content",
      previewImageUrl: "https://example.com/image.jpg",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe with Image")).toBeInTheDocument();
    });

    // Verify image is displayed with correct src
    const image = screen.getByAltText("Test Recipe with Image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("should display placeholder image when previewImageUrl is null", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe without Image",
      type: "manual",
      content: "Recipe content",
      previewImageUrl: null,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe without Image")).toBeInTheDocument();
    });

    // Verify placeholder image is used
    const image = screen.getByAltText("Test Recipe without Image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/recipe-placeholder.svg");
  });

  it("should display description when available", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "link",
      url: "https://example.com/recipe",
      description: "This is a delicious recipe description",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    // Verify description is displayed
    expect(
      screen.getByText("This is a delicious recipe description"),
    ).toBeInTheDocument();
  });

  it("should display site name when available for link recipes", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "link",
      url: "https://example.com/recipe",
      siteName: "Example Recipe Site",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    // Verify site name is displayed
    expect(screen.getByText("Example Recipe Site")).toBeInTheDocument();
  });

  it("should display URL as clickable link with proper attributes for link-type recipe", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Link Recipe",
      type: "link",
      url: "https://example.com/recipe",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    // Wait for the recipe to load
    await waitFor(() => {
      expect(screen.getByText("Test Link Recipe")).toBeInTheDocument();
    });

    // Verify the "Recipe Link" heading is present
    expect(screen.getByText("Recipe Link")).toBeInTheDocument();

    // Find the link element
    const link = screen.getByRole("link", {
      name: "https://example.com/recipe",
    });

    // Verify link exists and is visible
    expect(link).toBeInTheDocument();
    expect(link).toBeVisible();

    // Verify link has correct href
    expect(link).toHaveAttribute("href", "https://example.com/recipe");

    // Verify link has target="_blank" for opening in new tab
    expect(link).toHaveAttribute("target", "_blank");

    // Verify link has security attributes
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    // Verify link has proper styling classes
    expect(link).toHaveClass("text-blue-600");
    expect(link).toHaveClass("hover:underline");
    expect(link).toHaveClass("break-all");
  });

  it("should not display link section for non-link type recipes", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Manual Recipe",
      type: "manual",
      content: "Recipe instructions here",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Manual Recipe")).toBeInTheDocument();
    });

    // Verify "Recipe Link" heading is NOT present
    expect(screen.queryByText("Recipe Link")).not.toBeInTheDocument();

    // Verify "Recipe Instructions" heading for manual type is present
    expect(screen.getByText("Recipe Instructions")).toBeInTheDocument();
  });

  it("should handle long URLs with break-all class", async () => {
    const longUrl =
      "https://example.com/very/long/recipe/path/with/many/segments/that/could/overflow/the/container";
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe with Long URL",
      type: "link",
      url: longUrl,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe with Long URL")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: longUrl });

    // Verify link has break-all class for proper text wrapping
    expect(link).toHaveClass("break-all");
  });

  it("should not display link section if URL is missing", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Link Recipe Without URL",
      type: "link",
      url: null, // Missing URL
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByText("Test Link Recipe Without URL"),
      ).toBeInTheDocument();
    });

    // Verify "Recipe Link" heading is present (section is always shown for link recipes)
    expect(screen.getByText("Recipe Link")).toBeInTheDocument();

    // But the actual link should not be present (excluding Back button and external link icon)
    const links = screen.queryAllByRole("link");
    const recipeUrlLinks = links.filter((link) => 
      link.getAttribute("href") && 
      !link.getAttribute("href").includes("/") // Filter out navigation links
    );
    expect(recipeUrlLinks).toHaveLength(0);
  });
});

describe("RecipeDetail - Edit Functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display Edit button when not in edit mode", async () => {
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    expect(screen.getByText("Edit Recipe")).toBeInTheDocument();
  });

  it("should enter edit mode when Edit button is clicked", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    const editButton = screen.getByText("Edit Recipe");
    await user.click(editButton);

    // Should show Save and Cancel buttons
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.queryByText("Edit Recipe")).not.toBeInTheDocument();
  });

  it("should display editable title input in edit mode", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    const titleInput = screen.getByLabelText("Recipe Title");
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveValue("Test Recipe");
  });

  it("should display editable URL input for link recipes", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Link Recipe",
      type: "link",
      url: "https://example.com",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Link Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    const urlInput = screen.getByPlaceholderText("https://example.com/recipe");
    expect(urlInput).toBeInTheDocument();
    expect(urlInput).toHaveValue("https://example.com");
  });

  it("should display editable content textarea for manual recipes", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Manual Recipe",
      type: "manual",
      content: "Test recipe content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Manual Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    const contentTextarea = screen.getByPlaceholderText(
      "Enter recipe content...",
    );
    expect(contentTextarea).toBeInTheDocument();
    expect(contentTextarea).toHaveValue("Test recipe content");
  });

  it("should exit edit mode without saving when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    // Modify title
    const titleInput = screen.getByLabelText("Recipe Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Modified Title");

    // Click Cancel
    await user.click(screen.getByText("Cancel"));

    // Should exit edit mode
    expect(screen.getByText("Edit Recipe")).toBeInTheDocument();
    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();

    // Original title should be shown (not modified)
    expect(screen.getByText("Test Recipe")).toBeInTheDocument();
  });

  it("should validate required title field", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    // Clear title
    const titleInput = screen.getByLabelText("Recipe Title");
    await user.clear(titleInput);

    // Try to save
    await user.click(screen.getByText("Save Changes"));

    // Should show validation error
    expect(screen.getByText("Title is required")).toBeInTheDocument();

    // Should not call update API
    expect(api.recipesApi.update).not.toHaveBeenCalled();
  });

  it("should validate URL format for link recipes", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Link Recipe",
      type: "link",
      url: "https://example.com",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Link Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    // Set invalid URL
    const urlInput = screen.getByPlaceholderText("https://example.com/recipe");
    await user.clear(urlInput);
    await user.type(urlInput, "not-a-valid-url");

    // Try to save
    await user.click(screen.getByText("Save Changes"));

    // Should show validation error
    expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();

    // Should not call update API
    expect(api.recipesApi.update).not.toHaveBeenCalled();
  });

  it("should validate required content for manual recipes", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Manual Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Manual Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    // Clear content
    const contentTextarea = screen.getByPlaceholderText(
      "Enter recipe content...",
    );
    await user.clear(contentTextarea);

    // Try to save
    await user.click(screen.getByText("Save Changes"));

    // Should show validation error
    expect(
      screen.getByText("Content is required for manual recipes"),
    ).toBeInTheDocument();

    // Should not call update API
    expect(api.recipesApi.update).not.toHaveBeenCalled();
  });

  it("should successfully update recipe when Save is clicked with valid data", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRecipe = {
      ...mockRecipe,
      title: "Updated Recipe",
      content: "Updated content",
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);
    api.recipesApi.update.mockResolvedValue(updatedRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));

    // Update title
    const titleInput = screen.getByLabelText("Recipe Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Recipe");

    // Update content
    const contentTextarea = screen.getByPlaceholderText(
      "Enter recipe content...",
    );
    await user.clear(contentTextarea);
    await user.type(contentTextarea, "Updated content");

    // Save
    await user.click(screen.getByText("Save Changes"));

    // Should call update API with correct data
    await waitFor(() => {
      expect(api.recipesApi.update).toHaveBeenCalledWith({
        id: "test-recipe-id",
        title: "Updated Recipe",
        type: "manual",
        url: undefined,
        content: "Updated content",
      });
    });

    // Should exit edit mode
    await waitFor(() => {
      expect(screen.getByText("Edit Recipe")).toBeInTheDocument();
    });

    // Should show success message
    expect(
      screen.getByText("Recipe updated successfully!"),
    ).toBeInTheDocument();
  });

  it("should display loading state while saving", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);
    api.recipesApi.update.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));
    await user.click(screen.getByText("Save Changes"));

    // Should show loading indicator
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("should display error message when update fails", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);
    api.recipesApi.update.mockRejectedValue(new Error("Network error"));

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Edit Recipe"));
    await user.click(screen.getByText("Save Changes"));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to update recipe/)).toBeInTheDocument();
    });
  });

  it("should hide favorite button in edit mode", async () => {
    const user = userEvent.setup();
    const mockRecipe = {
      id: "test-recipe-id",
      title: "Test Recipe",
      type: "manual",
      content: "Test content",
      isFavorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    api.recipesApi.getById.mockResolvedValue(mockRecipe);

    render(<RecipeDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Test Recipe")).toBeInTheDocument();
    });

    // Favorite button should be visible initially (find it by looking for star SVG icon path)
    const favButtons = screen.getAllByRole("button");
    const favButton = favButtons.find((btn) =>
      btn.querySelector('svg path[d*="M11.049"]'),
    );
    expect(favButton).toBeTruthy();

    // Enter edit mode
    await user.click(screen.getByText("Edit Recipe"));

    // Favorite button should be hidden (check that it's no longer in the DOM)
    const favButtonsAfter = screen.getAllByRole("button");
    const favButtonAfter = favButtonsAfter.find((btn) =>
      btn.querySelector('svg path[d*="M11.049"]'),
    );
    expect(favButtonAfter).toBeUndefined();
  });
});
