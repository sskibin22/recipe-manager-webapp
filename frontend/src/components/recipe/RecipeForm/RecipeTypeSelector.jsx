/**
 * Recipe type selector component - Radio buttons for selecting recipe type
 * @param {Object} props
 * @param {string} props.recipeType - Current recipe type
 * @param {(type: string) => void} props.onChange - Callback when type changes
 * @returns {JSX.Element}
 */
const RecipeTypeSelector = ({ recipeType, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Recipe Type *</label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="link"
            checked={recipeType === "link"}
            onChange={(e) => onChange(e.target.value)}
            className="mr-2"
          />
          Link
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="document"
            checked={recipeType === "document"}
            onChange={(e) => onChange(e.target.value)}
            className="mr-2"
          />
          Document
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="manual"
            checked={recipeType === "manual"}
            onChange={(e) => onChange(e.target.value)}
            className="mr-2"
          />
          Manual
        </label>
      </div>
    </div>
  );
};

export default RecipeTypeSelector;
