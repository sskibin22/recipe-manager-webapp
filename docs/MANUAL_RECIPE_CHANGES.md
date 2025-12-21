# Manual Recipe Form - UI Changes Documentation

## Overview
This document describes the UI changes made to the Manual Recipe form to provide segregated input fields for better organization and user experience.

## Changes Summary

### Before (Old Implementation)
- Single "Recipe Content" textarea field
- Users had to manually format ingredients and instructions
- No structure or guidance for content organization

### After (New Implementation)
- Segregated fields for:
  1. **Description** (Optional) - Brief overview of the recipe
  2. **Ingredients** (*Required) - List of ingredients with quantities
  3. **Instructions** (*Required) - Step-by-step cooking instructions
  4. **Notes** (Optional) - Additional tips, variations, or storage info

## Form Fields

### RecipeForm (Create Mode)

#### Title Field
- Location: Top of form
- Type: Text input
- Required: Yes
- Placeholder: "My Favorite Recipe"

#### Recipe Type Selection
- Options: Link, Document, Manual
- When "Manual" is selected, shows segregated fields below

#### Manual Recipe Fields (when Manual type is selected)

1. **Description**
   - Type: Textarea (3 rows)
   - Required: No
   - Placeholder: "A brief overview of the recipe..."
   - Purpose: Provide context and summary

2. **Ingredients**
   - Type: Textarea (8 rows)
   - Required: Yes*
   - Placeholder: "- 2 cups flour\n- 1 cup sugar\n- 3 eggs\n- ..."
   - Purpose: List all recipe ingredients

3. **Instructions**
   - Type: Textarea (10 rows)
   - Required: Yes*
   - Placeholder: "1. Preheat oven to 350°F\n2. Mix dry ingredients...\n3. ..."
   - Purpose: Provide step-by-step cooking instructions

4. **Notes**
   - Type: Textarea (4 rows)
   - Required: No
   - Placeholder: "Additional tips, variations, or storage instructions..."
   - Purpose: Extra information, tips, and variations

*Note: At least one of Ingredients OR Instructions must be provided

#### Display Image Upload
- Location: After all text fields
- Type: File input
- Required: No
- Accepts: JPG, PNG, GIF, WEBP (max 5MB)
- Purpose: Add a visual representation of the recipe

### RecipeDetail (View/Edit Mode)

#### Edit Mode
- Shows the same segregated fields as RecipeForm
- Pre-populates fields from stored JSON content
- Handles legacy plain text content (maps to Instructions field)
- Validation: Same as create mode

#### Readonly Mode (Non-Edit)
- Displays content as unified, cohesive recipe
- Each section has its own heading and styled container:
  - "Description" (if present)
  - "Ingredients" (if present)
  - "Instructions" (if present)
  - "Notes" (if present)
- Sections are visually separated with:
  - Clear headings (text-lg font-semibold)
  - Light gray background (bg-gray-50)
  - Rounded borders (rounded-lg)
  - Proper spacing (space-y-6)
- Maintains readability while showing structure

## Data Storage

### JSON Format
Content is stored as JSON in the existing `Content` field:

```json
{
  "description": "A delicious homemade recipe...",
  "ingredients": "- 2 cups flour\n- 1 cup sugar...",
  "instructions": "1. Preheat oven\n2. Mix ingredients...",
  "notes": "Store in airtight container..."
}
```

### Backward Compatibility
- Old recipes with plain text content still work
- Plain text is automatically mapped to the "Instructions" field
- No migration required

## Validation Rules

### Create Mode (RecipeForm)
- Title: Required
- Recipe Type: Required (Link, Document, or Manual)
- For Manual type:
  - At least Ingredients OR Instructions must be provided
  - Description and Notes are optional

### Edit Mode (RecipeDetail)
- Same validation as create mode
- User can edit all fields
- Empty optional fields don't trigger validation errors

## User Experience Improvements

1. **Better Organization**: Users now have clear guidance on where to input different types of information
2. **Structured Data**: Recipes are more consistently formatted across the application
3. **Easier Editing**: Users can focus on one section at a time when creating or editing
4. **Backward Compatible**: Existing recipes continue to work without issues
5. **Visual Clarity**: Readonly view presents information in a well-organized, easy-to-read format

## Technical Implementation

### Helper Functions
- `parseRecipeContent(content)` - Parses JSON or legacy plain text
- `serializeRecipeContent(content)` - Converts form data to JSON
- `isStructuredContent(content)` - Checks if content is structured JSON

### Component Updates
- **RecipeForm.jsx**: Added state variables and form fields for segregated content
- **RecipeDetail.jsx**: Updated both edit mode (segregated fields) and readonly mode (unified view)
- **recipeContent.js**: New utility file with helper functions

### Testing
- All existing tests updated to work with new structure
- New tests verify JSON serialization/deserialization
- 84 unit tests passing
- No E2E test changes required (API contract unchanged)
