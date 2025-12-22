import CategorySelector from "../../CategorySelector";
import TagSelector from "../../TagSelector";

/**
 * Recipe metadata fields component - Category and tags selectors
 * @param {Object} props
 * @param {number|null} props.selectedCategoryId - Selected category ID
 * @param {(id: number|null) => void} props.onCategoryChange - Callback when category changes
 * @param {number[]} props.selectedTagIds - Selected tag IDs
 * @param {(ids: number[]) => void} props.onTagsChange - Callback when tags change
 * @returns {JSX.Element}
 */
const RecipeMetadataFields = ({
  selectedCategoryId,
  onCategoryChange,
  selectedTagIds,
  onTagsChange,
}) => {
  return (
    <>
      <div className="mb-4">
        <CategorySelector
          selectedCategoryId={selectedCategoryId}
          onChange={onCategoryChange}
        />
      </div>

      <div className="mb-4">
        <TagSelector selectedTagIds={selectedTagIds} onChange={onTagsChange} />
      </div>
    </>
  );
};

export default RecipeMetadataFields;
