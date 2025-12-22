/**
 * Manual recipe fields component - Description, ingredients, instructions, notes
 * @param {Object} props
 * @param {string} props.description - Description value
 * @param {(desc: string) => void} props.onDescriptionChange - Callback for description
 * @param {string} props.ingredients - Ingredients value
 * @param {(ing: string) => void} props.onIngredientsChange - Callback for ingredients
 * @param {string} props.instructions - Instructions value
 * @param {(inst: string) => void} props.onInstructionsChange - Callback for instructions
 * @param {string} props.notes - Notes value
 * @param {(notes: string) => void} props.onNotesChange - Callback for notes
 * @param {File|null} props.displayImageFile - Selected display image file
 * @param {(e: Event) => void} props.onDisplayImageChange - Callback when display image changes
 * @returns {JSX.Element}
 */
const ManualRecipeFields = ({
  description,
  onDescriptionChange,
  ingredients,
  onIngredientsChange,
  instructions,
  onInstructionsChange,
  notes,
  onNotesChange,
  displayImageFile,
  onDisplayImageChange,
}) => {
  return (
    <>
      <div className="mb-4">
        <label
          htmlFor="manualDescription"
          className="block text-sm font-medium mb-1"
        >
          Description (Optional)
        </label>
        <textarea
          id="manualDescription"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="A brief overview of the recipe..."
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="manualIngredients"
          className="block text-sm font-medium mb-1"
        >
          Ingredients *
        </label>
        <textarea
          id="manualIngredients"
          value={ingredients}
          onChange={(e) => onIngredientsChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="8"
          placeholder="- 2 cups flour&#10;- 1 cup sugar&#10;- 3 eggs&#10;- ..."
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="manualInstructions"
          className="block text-sm font-medium mb-1"
        >
          Instructions *
        </label>
        <textarea
          id="manualInstructions"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="10"
          placeholder="1. Preheat oven to 350°F&#10;2. Mix dry ingredients...&#10;3. ..."
        />
      </div>

      <div className="mb-4">
        <label htmlFor="manualNotes" className="block text-sm font-medium mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="manualNotes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder="Additional tips, variations, or storage instructions..."
        />
      </div>

      <div className="mb-4">
        <label htmlFor="displayImage" className="block text-sm font-medium mb-1">
          Display Image (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Max file size: 5MB. Allowed types: JPG, PNG, GIF, WEBP
        </p>
        <input
          type="file"
          id="displayImage"
          onChange={onDisplayImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          accept=".jpg,.jpeg,.png,.gif,.webp"
        />
        {displayImageFile && (
          <p className="text-xs text-green-600 mt-1">
            Selected: {displayImageFile.name} (
            {(displayImageFile.size / (1024 * 1024)).toFixed(2)}MB)
          </p>
        )}
      </div>
    </>
  );
};

export default ManualRecipeFields;
