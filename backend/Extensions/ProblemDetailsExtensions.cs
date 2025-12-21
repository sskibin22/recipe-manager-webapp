namespace RecipeManager.Api.Extensions;

public static class ProblemDetailsExtensions
{
    public static IResult BadRequestProblem(string title, string? detail = null, string? instance = null)
    {
        return Results.Problem(
            title: title,
            detail: detail,
            statusCode: StatusCodes.Status400BadRequest,
            instance: instance
        );
    }

    public static IResult UnauthorizedProblem(string? detail = null)
    {
        return Results.Problem(
            title: "Unauthorized",
            detail: detail ?? "You must be authenticated to access this resource.",
            statusCode: StatusCodes.Status401Unauthorized
        );
    }

    public static IResult NotFoundProblem(string resourceType, string? identifier = null)
    {
        var detail = identifier != null
            ? $"{resourceType} with identifier '{identifier}' was not found."
            : $"{resourceType} was not found.";

        return Results.Problem(
            title: "Not Found",
            detail: detail,
            statusCode: StatusCodes.Status404NotFound
        );
    }

    public static IResult ConflictProblem(string title, string? detail = null)
    {
        return Results.Problem(
            title: title,
            detail: detail,
            statusCode: StatusCodes.Status409Conflict
        );
    }

    public static IResult ValidationProblem(
        string title,
        Dictionary<string, string[]> errors)
    {
        return Results.ValidationProblem(
            errors: errors,
            title: title,
            statusCode: StatusCodes.Status400BadRequest
        );
    }
}
