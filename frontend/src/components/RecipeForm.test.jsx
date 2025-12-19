import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/testUtils";

// Mock modules before importing components
vi.mock("../services/api", () => ({
  recipesApi: {
    create: vi.fn(),
  },
  uploadsApi: {
    getPresignedUploadUrl: vi.fn(),
    uploadToPresignedUrl: vi.fn(),
  },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: "test-user-123",
      email: "test@example.com",
      getIdToken: async () => "mock-token",
    },
  })),
}));

// Import after mocking
import RecipeForm from "./RecipeForm";
import * as api from "../services/api";

describe("RecipeForm", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render form with title", () => {
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    expect(screen.getByText("Add New Recipe")).toBeInTheDocument();
  });

  it("should render title input field", () => {
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    expect(titleInput).toBeInTheDocument();
  });

  it("should render recipe type radio buttons", () => {
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    expect(screen.getByLabelText(/^Link$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Document$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Manual$/)).toBeInTheDocument();
  });

  it("should default to link type", () => {
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const linkRadio = screen.getByLabelText(/^Link$/);
    expect(linkRadio).toBeChecked();
  });

  it("should show URL field for link type", () => {
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    expect(screen.getByLabelText(/Recipe URL/i)).toBeInTheDocument();
  });

  it("should show file upload field when document type is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    expect(screen.getByLabelText(/Upload Document/i)).toBeInTheDocument();
  });

  it("should show content textarea when manual type is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const manualRadio = screen.getByLabelText(/^Manual$/);
    await user.click(manualRadio);

    // Check for segregated fields
    expect(screen.getByLabelText(/Description \(Optional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ingredients \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Instructions \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes \(Optional\)/i)).toBeInTheDocument();
  });

  it("should show error when title is empty on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
  });

  it("should show error when URL is empty for link type", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.clear(urlInput);

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    expect(
      await screen.findByText("URL is required for link recipes"),
    ).toBeInTheDocument();
  });

  it("should show error when file is missing for document type", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    expect(
      await screen.findByText("File is required for document recipes"),
    ).toBeInTheDocument();
  });

  it("should show error when content is empty for manual type", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const manualRadio = screen.getByLabelText(/^Manual$/);
    await user.click(manualRadio);

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    expect(
      await screen.findByText("Either Ingredients or Instructions must be provided for manual recipes"),
    ).toBeInTheDocument();
  });

  it("should submit link recipe with valid data", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockResolvedValue({
      id: "123",
      title: "Test Recipe",
    });

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.type(urlInput, "https://example.com/recipe");

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.recipesApi.create).toHaveBeenCalled();
      const callArgs = api.recipesApi.create.mock.calls[0][0];
      expect(callArgs).toEqual({
        title: "Test Recipe",
        type: "link",
        url: "https://example.com/recipe",
        previewImageUrl: null,
        description: null,
        siteName: null,
      });
    });
  });

  it("should submit manual recipe with valid data", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockResolvedValue({
      id: "123",
      title: "Test Recipe",
    });

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const manualRadio = screen.getByLabelText(/^Manual$/);
    await user.click(manualRadio);

    const ingredientsInput = screen.getByLabelText(/Ingredients \*/i);
    await user.type(ingredientsInput, "Test ingredients");

    const instructionsInput = screen.getByLabelText(/Instructions \*/i);
    await user.type(instructionsInput, "Test instructions");

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.recipesApi.create).toHaveBeenCalled();
      const callArgs = api.recipesApi.create.mock.calls[0][0];
      expect(callArgs.title).toBe("Test Recipe");
      expect(callArgs.type).toBe("manual");
      // Content should be JSON string
      expect(callArgs.content).toBeDefined();
      const parsedContent = JSON.parse(callArgs.content);
      expect(parsedContent.ingredients).toBe("Test ingredients");
      expect(parsedContent.instructions).toBe("Test instructions");
      // Verify metadata fields are NOT included
      expect(callArgs.previewImageUrl).toBeUndefined();
      expect(callArgs.description).toBeUndefined();
      expect(callArgs.siteName).toBeUndefined();
    });
  });

  it("should call onSuccess after successful submission", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockResolvedValue({
      id: "123",
      title: "Test Recipe",
    });

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.type(urlInput, "https://example.com/recipe");

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("should call onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should reset form after successful submission", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockResolvedValue({
      id: "123",
      title: "Test Recipe",
    });

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.type(urlInput, "https://example.com/recipe");

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(titleInput).toHaveValue("");
      expect(urlInput).toHaveValue("");
    });
  });

  it("should disable submit button while uploading", async () => {
    const user = userEvent.setup();
    api.uploadsApi.getPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://upload.example.com",
      key: "test-key",
    });
    api.uploadsApi.uploadToPresignedUrl.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    const fileInput = screen.getByLabelText(/Upload Document/i);
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    await user.upload(fileInput, file);

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    // Button should be disabled during upload
    await waitFor(() => {
      const button = screen.getByText(/Add Recipe|Uploading.../);
      expect(button).toBeDisabled();
    });
  });

  it("should trim whitespace from title", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockResolvedValue({
      id: "123",
      title: "Test Recipe",
    });

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "  Test Recipe  ");

    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.type(urlInput, "https://example.com/recipe");

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.recipesApi.create).toHaveBeenCalled();
      const callArgs = api.recipesApi.create.mock.calls[0][0];
      expect(callArgs.title).toBe("Test Recipe");
    });
  });

  it("should handle API error gracefully", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockRejectedValue({
      response: { data: { message: "Server error" } },
    });

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.type(urlInput, "https://example.com/recipe");

    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    expect(await screen.findByText(/Server error/)).toBeInTheDocument();
  });

  // File validation tests
  it("should show error when file exceeds max size (10MB)", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    const fileInput = screen.getByLabelText(/Upload Document/i);
    // Create a file larger than 10MB (10 * 1024 * 1024 bytes)
    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.pdf", {
      type: "application/pdf",
    });

    await user.upload(fileInput, largeFile);

    expect(
      await screen.findByText(/File size must be less than 10MB/),
    ).toBeInTheDocument();
  });

  it("should accept valid PDF file", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    const fileInput = screen.getByLabelText(/Upload Document/i);
    const validFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    await user.upload(fileInput, validFile);

    // Should show file info and no error
    expect(await screen.findByText(/Selected: test.pdf/)).toBeInTheDocument();
    expect(
      screen.queryByText(/File size must be less than/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/)).not.toBeInTheDocument();
  });

  it("should accept valid image file (JPEG)", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    const fileInput = screen.getByLabelText(/Upload Document/i);
    const validFile = new File(["image data"], "recipe.jpg", {
      type: "image/jpeg",
    });

    await user.upload(fileInput, validFile);

    expect(await screen.findByText(/Selected: recipe.jpg/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/)).not.toBeInTheDocument();
  });

  it("should show file size hint in UI", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    expect(screen.getByText(/Max file size: 10MB/)).toBeInTheDocument();
    expect(
      screen.getByText(/Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG/),
    ).toBeInTheDocument();
  });

  it("should have accept attribute with correct file types", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    const fileInput = screen.getByLabelText(/Upload Document/i);
    expect(fileInput).toHaveAttribute(
      "accept",
      ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
    );
  });

  it("should clear metadata fields when switching from link to manual type", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockResolvedValue({
      id: "123",
      title: "Test Recipe",
    });

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    // Start with link type and enter URL
    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.type(urlInput, "https://example.com/recipe");

    // Switch to manual type
    const manualRadio = screen.getByLabelText(/^Manual$/);
    await user.click(manualRadio);

    // Enter manual content in segregated fields
    const ingredientsInput = screen.getByLabelText(/Ingredients \*/i);
    await user.type(ingredientsInput, "Test ingredients");

    // Submit the form
    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    // Verify that metadata fields are NOT included in the API call
    await waitFor(() => {
      expect(api.recipesApi.create).toHaveBeenCalled();
      const callArgs = api.recipesApi.create.mock.calls[0][0];
      expect(callArgs.title).toBe("Test Recipe");
      expect(callArgs.type).toBe("manual");
      // Content should be JSON string
      expect(callArgs.content).toBeDefined();
      const parsedContent = JSON.parse(callArgs.content);
      expect(parsedContent.ingredients).toBe("Test ingredients");
      // Verify metadata fields are NOT included
      expect(callArgs.previewImageUrl).toBeUndefined();
      expect(callArgs.description).toBeUndefined();
      expect(callArgs.siteName).toBeUndefined();
      expect(callArgs.url).toBeUndefined();
    });
  });

  it("should clear metadata fields when switching from link to document type", async () => {
    const user = userEvent.setup();
    api.recipesApi.create.mockResolvedValue({
      id: "123",
      title: "Test Recipe",
    });
    api.uploadsApi.getPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://upload.example.com",
      key: "test-key",
    });
    api.uploadsApi.uploadToPresignedUrl.mockResolvedValue({});

    renderWithProviders(
      <RecipeForm onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const titleInput = screen.getByLabelText(/Recipe Title/i);
    await user.type(titleInput, "Test Recipe");

    // Start with link type and enter URL
    const urlInput = screen.getByLabelText(/Recipe URL/i);
    await user.type(urlInput, "https://example.com/recipe");

    // Switch to document type
    const documentRadio = screen.getByLabelText(/^Document$/);
    await user.click(documentRadio);

    // Upload a file
    const fileInput = screen.getByLabelText(/Upload Document/i);
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    await user.upload(fileInput, file);

    // Submit the form
    const submitButton = screen.getByText(/Add Recipe/);
    await user.click(submitButton);

    // Verify that metadata fields are NOT included in the API call
    await waitFor(() => {
      expect(api.recipesApi.create).toHaveBeenCalled();
      const callArgs = api.recipesApi.create.mock.calls[0][0];
      expect(callArgs.title).toBe("Test Recipe");
      expect(callArgs.type).toBe("document");
      expect(callArgs.storageKey).toBe("test-key");
      // Verify metadata fields are NOT included
      expect(callArgs.previewImageUrl).toBeUndefined();
      expect(callArgs.description).toBeUndefined();
      expect(callArgs.siteName).toBeUndefined();
      expect(callArgs.url).toBeUndefined();
    });
  });
});
