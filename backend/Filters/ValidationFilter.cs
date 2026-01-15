using System.ComponentModel.DataAnnotations;
using System.Net;

namespace RecipeManager.Api.Filters;

/// <summary>
/// Endpoint filter that validates request DTOs using Data Annotations
/// and returns a 400 Bad Request with validation errors if validation fails.
/// </summary>
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        // Find the request parameter of type T
        var requestObject = context.Arguments.OfType<T>().FirstOrDefault();
        
        if (requestObject == null)
        {
            return await next(context);
        }

        // Validate the request object
        var validationContext = new ValidationContext(requestObject);
        var validationResults = new List<ValidationResult>();
        
        if (!Validator.TryValidateObject(requestObject, validationContext, validationResults, validateAllProperties: true))
        {
            // Build error response
            var errors = validationResults
                .Where(vr => vr.ErrorMessage != null)
                .GroupBy(vr => vr.MemberNames.FirstOrDefault() ?? "")
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(vr => vr.ErrorMessage!).ToArray()
                );

            return Results.ValidationProblem(
                errors,
                detail: "One or more validation errors occurred.",
                statusCode: (int)HttpStatusCode.BadRequest
            );
        }

        return await next(context);
    }
}
