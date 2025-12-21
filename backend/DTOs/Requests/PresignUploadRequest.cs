namespace RecipeManager.Api.DTOs.Requests;

public record PresignUploadRequest(
    string FileName,
    string ContentType
);
