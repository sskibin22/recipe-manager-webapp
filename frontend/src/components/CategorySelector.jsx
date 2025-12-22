/**
 * @typedef {import('../types/recipe').Category} Category
 */

import { useCategoriesQuery } from "../hooks";

/**
 * Category selector component - dropdown for selecting recipe category
 * @param {Object} props
 * @param {number|null} props.selectedCategoryId - Currently selected category ID
 * @param {(categoryId: number|null) => void} props.onChange - Callback when category selection changes
 * @returns {JSX.Element}
 */
const CategorySelector = ({ selectedCategoryId, onChange }) => {
  const { data: categories, isLoading } = useCategoriesQuery();

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Category <span className="text-gray-400">(Optional)</span>
      </label>
      <select
        value={selectedCategoryId || ""}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">No category</option>
        {categories?.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategorySelector;
