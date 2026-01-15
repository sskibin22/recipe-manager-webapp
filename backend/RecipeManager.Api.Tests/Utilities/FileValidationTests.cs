using FluentAssertions;
using RecipeManager.Api.Utilities;

namespace RecipeManager.Api.Tests.Utilities;

[TestFixture]
public class FileValidationTests
{
    #region Document Type Validation Tests

    [Test]
    public void IsValidDocumentType_WithValidPdfContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("application/pdf");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentType_WithValidDocContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("application/msword");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentType_WithValidDocxContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentType_WithValidTextContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("text/plain");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentType_WithValidJpegContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("image/jpeg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentType_WithValidPngContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("image/png");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentType_WithInvalidContentType_ReturnsFalse()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("application/zip");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void IsValidDocumentType_WithNull_ReturnsFalse()
    {
        // Act
        var result = FileValidation.IsValidDocumentType(null);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void IsValidDocumentType_WithEmptyString_ReturnsFalse()
    {
        // Act
        var result = FileValidation.IsValidDocumentType("");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void IsValidDocumentType_IsCaseInsensitive()
    {
        // Act
        var result1 = FileValidation.IsValidDocumentType("APPLICATION/PDF");
        var result2 = FileValidation.IsValidDocumentType("Application/Pdf");

        // Assert
        result1.Should().BeTrue();
        result2.Should().BeTrue();
    }

    #endregion

    #region Document Extension Validation Tests

    [Test]
    public void IsValidDocumentExtension_WithValidPdfExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".pdf");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentExtension_WithValidDocExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".doc");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentExtension_WithValidDocxExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".docx");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentExtension_WithValidTxtExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".txt");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentExtension_WithValidJpgExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".jpg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentExtension_WithValidJpegExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".jpeg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentExtension_WithValidPngExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".png");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidDocumentExtension_WithInvalidExtension_ReturnsFalse()
    {
        // Act
        var result = FileValidation.IsValidDocumentExtension(".zip");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void IsValidDocumentExtension_IsCaseInsensitive()
    {
        // Act
        var result1 = FileValidation.IsValidDocumentExtension(".PDF");
        var result2 = FileValidation.IsValidDocumentExtension(".Pdf");

        // Assert
        result1.Should().BeTrue();
        result2.Should().BeTrue();
    }

    #endregion

    #region Image Type Validation Tests

    [Test]
    public void IsValidImageType_WithValidJpegContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageType("image/jpeg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageType_WithValidPngContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageType("image/png");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageType_WithValidGifContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageType("image/gif");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageType_WithValidWebpContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageType("image/webp");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageType_WithInvalidContentType_ReturnsFalse()
    {
        // Act
        var result = FileValidation.IsValidImageType("application/pdf");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void IsValidImageType_WithNull_ReturnsFalse()
    {
        // Act
        var result = FileValidation.IsValidImageType(null);

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void IsValidImageType_IsCaseInsensitive()
    {
        // Act
        var result1 = FileValidation.IsValidImageType("IMAGE/JPEG");
        var result2 = FileValidation.IsValidImageType("Image/Png");

        // Assert
        result1.Should().BeTrue();
        result2.Should().BeTrue();
    }

    #endregion

    #region Image Extension Validation Tests

    [Test]
    public void IsValidImageExtension_WithValidJpgExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageExtension(".jpg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageExtension_WithValidJpegExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageExtension(".jpeg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageExtension_WithValidPngExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageExtension(".png");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageExtension_WithValidGifExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageExtension(".gif");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageExtension_WithValidWebpExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.IsValidImageExtension(".webp");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void IsValidImageExtension_WithInvalidExtension_ReturnsFalse()
    {
        // Act
        var result = FileValidation.IsValidImageExtension(".pdf");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void IsValidImageExtension_IsCaseInsensitive()
    {
        // Act
        var result1 = FileValidation.IsValidImageExtension(".JPG");
        var result2 = FileValidation.IsValidImageExtension(".Png");

        // Assert
        result1.Should().BeTrue();
        result2.Should().BeTrue();
    }

    #endregion

    #region ValidateDocumentFile Tests

    [Test]
    public void ValidateDocumentFile_WithValidContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.ValidateDocumentFile("application/pdf", "document.pdf");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateDocumentFile_WithValidExtensionButInvalidContentType_ReturnsTrue()
    {
        // Act - Should fallback to extension validation
        var result = FileValidation.ValidateDocumentFile("application/octet-stream", "document.pdf");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateDocumentFile_WithValidContentTypeButInvalidExtension_ReturnsTrue()
    {
        // Act - Content type takes precedence
        var result = FileValidation.ValidateDocumentFile("application/pdf", "document.xyz");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateDocumentFile_WithInvalidContentTypeAndExtension_ReturnsFalse()
    {
        // Act
        var result = FileValidation.ValidateDocumentFile("application/zip", "archive.zip");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void ValidateDocumentFile_WithNullContentTypeAndValidExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.ValidateDocumentFile(null, "document.pdf");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateDocumentFile_WithNullBoth_ReturnsFalse()
    {
        // Act
        var result = FileValidation.ValidateDocumentFile(null, null);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region ValidateImageFile Tests

    [Test]
    public void ValidateImageFile_WithValidContentType_ReturnsTrue()
    {
        // Act
        var result = FileValidation.ValidateImageFile("image/jpeg", "photo.jpg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateImageFile_WithValidExtensionButInvalidContentType_ReturnsTrue()
    {
        // Act - Should fallback to extension validation
        var result = FileValidation.ValidateImageFile("application/octet-stream", "photo.jpg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateImageFile_WithValidContentTypeButInvalidExtension_ReturnsTrue()
    {
        // Act - Content type takes precedence
        var result = FileValidation.ValidateImageFile("image/jpeg", "photo.xyz");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateImageFile_WithInvalidContentTypeAndExtension_ReturnsFalse()
    {
        // Act
        var result = FileValidation.ValidateImageFile("application/pdf", "document.pdf");

        // Assert
        result.Should().BeFalse();
    }

    [Test]
    public void ValidateImageFile_WithNullContentTypeAndValidExtension_ReturnsTrue()
    {
        // Act
        var result = FileValidation.ValidateImageFile(null, "photo.jpg");

        // Assert
        result.Should().BeTrue();
    }

    [Test]
    public void ValidateImageFile_WithNullBoth_ReturnsFalse()
    {
        // Act
        var result = FileValidation.ValidateImageFile(null, null);

        // Assert
        result.Should().BeFalse();
    }

    #endregion

    #region Constants Tests

    [Test]
    public void AllowedDocumentTypesDescription_HasCorrectValue()
    {
        // Assert
        FileValidation.AllowedDocumentTypesDescription.Should().Be("PDF, DOC, DOCX, TXT, JPG, PNG");
    }

    [Test]
    public void AllowedImageTypesDescription_HasCorrectValue()
    {
        // Assert
        FileValidation.AllowedImageTypesDescription.Should().Be("JPEG, PNG, GIF, WEBP");
    }

    [Test]
    public void AllowedDocumentTypes_ContainsExpectedTypes()
    {
        // Assert
        FileValidation.AllowedDocumentTypes.Should().Contain("application/pdf");
        FileValidation.AllowedDocumentTypes.Should().Contain("application/msword");
        FileValidation.AllowedDocumentTypes.Should().Contain("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        FileValidation.AllowedDocumentTypes.Should().Contain("text/plain");
        FileValidation.AllowedDocumentTypes.Should().Contain("image/jpeg");
        FileValidation.AllowedDocumentTypes.Should().Contain("image/png");
        FileValidation.AllowedDocumentTypes.Should().HaveCount(6);
    }

    [Test]
    public void AllowedDocumentExtensions_ContainsExpectedExtensions()
    {
        // Assert
        FileValidation.AllowedDocumentExtensions.Should().Contain(".pdf");
        FileValidation.AllowedDocumentExtensions.Should().Contain(".doc");
        FileValidation.AllowedDocumentExtensions.Should().Contain(".docx");
        FileValidation.AllowedDocumentExtensions.Should().Contain(".txt");
        FileValidation.AllowedDocumentExtensions.Should().Contain(".jpg");
        FileValidation.AllowedDocumentExtensions.Should().Contain(".jpeg");
        FileValidation.AllowedDocumentExtensions.Should().Contain(".png");
        FileValidation.AllowedDocumentExtensions.Should().HaveCount(7);
    }

    [Test]
    public void AllowedImageTypes_ContainsExpectedTypes()
    {
        // Assert
        FileValidation.AllowedImageTypes.Should().Contain("image/jpeg");
        FileValidation.AllowedImageTypes.Should().Contain("image/png");
        FileValidation.AllowedImageTypes.Should().Contain("image/gif");
        FileValidation.AllowedImageTypes.Should().Contain("image/webp");
        FileValidation.AllowedImageTypes.Should().HaveCount(4);
    }

    [Test]
    public void AllowedImageExtensions_ContainsExpectedExtensions()
    {
        // Assert
        FileValidation.AllowedImageExtensions.Should().Contain(".jpg");
        FileValidation.AllowedImageExtensions.Should().Contain(".jpeg");
        FileValidation.AllowedImageExtensions.Should().Contain(".png");
        FileValidation.AllowedImageExtensions.Should().Contain(".gif");
        FileValidation.AllowedImageExtensions.Should().Contain(".webp");
        FileValidation.AllowedImageExtensions.Should().HaveCount(5);
    }

    #endregion
}
