/**
 * Edit component for manual recipe fields
 */

export default function ManualRecipeEdit({
  editedManualDescription,
  setEditedManualDescription,
  editedManualIngredients,
  setEditedManualIngredients,
  editedManualInstructions,
  setEditedManualInstructions,
  editedManualNotes,
  setEditedManualNotes,
  validationErrors,
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">
        Recipe Content
      </h2>

      <div>
        <label
          htmlFor="editManualDescription"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="editManualDescription"
          value={editedManualDescription}
          onChange={(e) => setEditedManualDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
          placeholder="A brief overview of the recipe..."
        />
      </div>

      <div>
        <label
          htmlFor="editManualIngredients"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Ingredients *
        </label>
        <textarea
          id="editManualIngredients"
          value={editedManualIngredients}
          onChange={(e) => setEditedManualIngredients(e.target.value)}
          rows={8}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans ${
            validationErrors.content
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="- 2 cups flour&#10;- 1 cup sugar&#10;- 3 eggs&#10;- ..."
        />
      </div>

      <div>
        <label
          htmlFor="editManualInstructions"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Instructions *
        </label>
        <textarea
          id="editManualInstructions"
          value={editedManualInstructions}
          onChange={(e) => setEditedManualInstructions(e.target.value)}
          rows={10}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans ${
            validationErrors.content
              ? "border-red-500"
              : "border-gray-300"
          }`}
          placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients...&#10;3. ..."
        />
      </div>

      <div>
        <label
          htmlFor="editManualNotes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes (Optional)
        </label>
        <textarea
          id="editManualNotes"
          value={editedManualNotes}
          onChange={(e) => setEditedManualNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
          placeholder="Additional tips, variations, or storage instructions..."
        />
      </div>

      {validationErrors.content && (
        <p className="text-sm text-red-600">
          {validationErrors.content}
        </p>
      )}
    </div>
  );
}
