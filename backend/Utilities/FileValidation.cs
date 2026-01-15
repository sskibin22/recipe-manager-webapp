namespace RecipeManager.Api.Utilities;

/// <summary>
/// Centralized file validation utility for consistent file type validation across the application.
/// </summary>
public static class FileValidation
{
    /// <summary>
    /// Allowed content types for recipe document uploads (PDF, DOC, DOCX, TXT, JPG, PNG).
    /// </summary>
    public static readonly HashSet<string> AllowedDocumentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png"
    };

    /// <summary>
    /// Allowed file extensions for recipe document uploads.
    /// </summary>
    public static readonly HashSet<string> AllowedDocumentExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png"
    };

    /// <summary>
    /// Allowed content types for image uploads (JPEG, PNG, GIF, WEBP).
    /// </summary>
    public static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp"
    };

    /// <summary>
    /// Allowed file extensions for image uploads.
    /// </summary>
    public static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp"
    };

    /// <summary>
    /// Human-readable description of allowed document types.
    /// </summary>
    public const string AllowedDocumentTypesDescription = "PDF, DOC, DOCX, TXT, JPG, PNG";

    /// <summary>
    /// Human-readable description of allowed image types.
    /// </summary>
    public const string AllowedImageTypesDescription = "JPEG, PNG, GIF, WEBP";

    /// <summary>
    /// Validates if the given content type is a valid document type.
    /// </summary>
    /// <param name="contentType">The MIME content type to validate.</param>
    /// <returns>True if valid, false otherwise.</returns>
    public static bool IsValidDocumentType(string? contentType) =>
        !string.IsNullOrWhiteSpace(contentType) && AllowedDocumentTypes.Contains(contentType);

    /// <summary>
    /// Validates if the given file extension is a valid document extension.
    /// </summary>
    /// <param name="extension">The file extension to validate (should include the dot, e.g., ".pdf").</param>
    /// <returns>True if valid, false otherwise.</returns>
    public static bool IsValidDocumentExtension(string? extension) =>
        !string.IsNullOrWhiteSpace(extension) && AllowedDocumentExtensions.Contains(extension);

    /// <summary>
    /// Validates if the given content type is a valid image type.
    /// </summary>
    /// <param name="contentType">The MIME content type to validate.</param>
    /// <returns>True if valid, false otherwise.</returns>
    public static bool IsValidImageType(string? contentType) =>
        !string.IsNullOrWhiteSpace(contentType) && AllowedImageTypes.Contains(contentType);

    /// <summary>
    /// Validates if the given file extension is a valid image extension.
    /// </summary>
    /// <param name="extension">The file extension to validate (should include the dot, e.g., ".jpg").</param>
    /// <returns>True if valid, false otherwise.</returns>
    public static bool IsValidImageExtension(string? extension) =>
        !string.IsNullOrWhiteSpace(extension) && AllowedImageExtensions.Contains(extension);

    /// <summary>
    /// Validates a file for document upload by checking both content type and extension.
    /// </summary>
    /// <param name="contentType">The MIME content type.</param>
    /// <param name="fileName">The file name including extension.</param>
    /// <returns>True if either content type or extension is valid, false otherwise.</returns>
    public static bool ValidateDocumentFile(string? contentType, string? fileName)
    {
        // Check content type first
        if (IsValidDocumentType(contentType))
        {
            return true;
        }

        // Fallback to extension validation
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            var extension = Path.GetExtension(fileName);
            return IsValidDocumentExtension(extension);
        }

        return false;
    }

    /// <summary>
    /// Validates a file for image upload by checking both content type and extension.
    /// </summary>
    /// <param name="contentType">The MIME content type.</param>
    /// <param name="fileName">The file name including extension.</param>
    /// <returns>True if either content type or extension is valid, false otherwise.</returns>
    public static bool ValidateImageFile(string? contentType, string? fileName)
    {
        // Check content type first
        if (IsValidImageType(contentType))
        {
            return true;
        }

        // Fallback to extension validation
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            var extension = Path.GetExtension(fileName);
            return IsValidImageExtension(extension);
        }

        return false;
    }
}
