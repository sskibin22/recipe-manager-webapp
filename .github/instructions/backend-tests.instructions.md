---
applyTo: "backend/**/*Tests.cs,backend/**/*Test.cs,backend/**/Tests/**/*.cs"
---

# Backend Test Instructions

## Testing Framework
- **NUnit** for unit and integration tests
- **CustomWebApplicationFactory** for integration tests
- Tests located in `backend/RecipeManager.Api.Tests/`

## Critical Rules

### Test Organization
- Group tests by feature/domain
- Use descriptive test names: `Should_ReturnRecipe_When_ValidIdProvided`
- Follow AAA pattern: Arrange, Act, Assert
- One assertion per test when possible

### Mocking External Dependencies
Mock these services in tests:
- Firebase authentication (JWT validation)
- Cloudflare R2 storage
- Database (use in-memory SQLite for integration tests)

### Running Tests
```bash
# Run all tests
dotnet test

# Run specific test
dotnet test --filter "FullyQualifiedName~TestMethodName"

# Clean before testing (important after code changes)
dotnet clean
dotnet build
dotnet test
```

## Test Coverage Requirements
- **ALL business logic in Services/** must have unit tests
- Critical API endpoints should have integration tests
- Test both happy path AND error scenarios
- Maintain 80%+ code coverage

## Common Test Patterns

### Integration Test Setup
```csharp
[SetUp]
public async Task Setup()
{
    // Use CustomWebApplicationFactory
    // Reset database state
    // Create test data
}

[TearDown]
public async Task TearDown()
{
    // Clean up test data
}
```

### Unit Test with Mocks
```csharp
[Test]
public async Task Should_CreateRecipe_When_ValidInput()
{
    // Arrange
    var mockService = new Mock<IRecipeService>();
    // ... setup mocks
    
    // Act
    var result = await service.CreateRecipe(request);
    
    // Assert
    Assert.IsNotNull(result);
    mockService.Verify(x => x.Method(), Times.Once);
}
```

## Important Notes
- **ALWAYS** run `dotnet test` after making backend changes
- Tests MUST pass before committing code
- If tests fail after code changes, run `dotnet clean` first
- Mock external services (Firebase, R2) in tests
