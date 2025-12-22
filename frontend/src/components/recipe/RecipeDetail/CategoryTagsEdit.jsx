/**
 * Component for editing category and tags
 */

import { CategorySelector, TagSelector } from "../../common/Selectors";

export default function CategoryTagsEdit({
  editedCategoryId,
  setEditedCategoryId,
  editedTagIds,
  setEditedTagIds,
}) {
  return (
    <div className="p-6 border-t border-gray-200 space-y-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        Category and Tags
      </h2>

      {/* Category Selector */}
      <div>
        <CategorySelector
          selectedCategoryId={editedCategoryId}
          onChange={setEditedCategoryId}
        />
      </div>

      {/* Tag Selector */}
      <div>
        <TagSelector
          selectedTagIds={editedTagIds}
          onChange={setEditedTagIds}
        />
      </div>
    </div>
  );
}
