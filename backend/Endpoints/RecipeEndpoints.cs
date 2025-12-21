using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeManager.Api.Data;
using RecipeManager.Api.DTOs.Queries;
using RecipeManager.Api.DTOs.Requests;
using RecipeManager.Api.DTOs.Responses;
using RecipeManager.Api.Extensions;
using RecipeManager.Api.Mapping;
using RecipeManager.Api.Models;
using RecipeManager.Api.Services;

namespace RecipeManager.Api.Endpoints;

public static class RecipeEndpoints
{
    public static IEndpointRouteBuilder MapRecipeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/recipes", async (
            CreateRecipeRequest request,
            IRecipeService recipeService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var recipe = await recipeService.CreateRecipeAsync(request, userId.Value);
            return Results.Created($"/api/recipes/{recipe.Id}", recipe);
        })
        .WithName("CreateRecipe")
        .WithOpenApi();

        app.MapGet("/api/recipes", async (
            [AsParameters] RecipeQueryParameters queryParams,
            IRecipeService recipeService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var recipes = await recipeService.GetRecipesAsync(queryParams, userId.Value);
            return Results.Ok(recipes);
        })
        .WithName("GetRecipes")
        .WithOpenApi();

        app.MapGet("/api/recipes/{id:guid}", async (
            Guid id,
            IRecipeService recipeService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var recipe = await recipeService.GetRecipeAsync(id, userId.Value);
            if (recipe == null) return Results.NotFound();

            return Results.Ok(recipe);
        })
        .WithName("GetRecipe")
        .WithOpenApi();

        app.MapPut("/api/recipes/{id:guid}", async (
            Guid id,
            UpdateRecipeRequest request,
            IRecipeService recipeService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var recipe = await recipeService.UpdateRecipeAsync(id, request, userId.Value);
            if (recipe == null) return Results.NotFound();

            return Results.Ok(recipe);
        })
        .WithName("UpdateRecipe")
        .WithOpenApi();

        app.MapDelete("/api/recipes/{id:guid}", async (
            Guid id,
            IRecipeService recipeService,
            IUserContextService userContext) =>
        {
            var userId = userContext.GetCurrentUserId();
            if (userId == null) return ProblemDetailsExtensions.UnauthorizedProblem();

            var deleted = await recipeService.DeleteRecipeAsync(id, userId.Value);
            if (!deleted) return Results.NotFound();

            return Results.NoContent();
        })
        .WithName("DeleteRecipe")
        .WithOpenApi();

        return app;
    }
}

