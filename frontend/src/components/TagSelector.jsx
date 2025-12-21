/**
 * @typedef {import('../types/recipe').Tag} Tag
 */

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { tagsApi } from "../services/api";

/**
 * Tag selector component - searchable multi-select for recipe tags
 * @param {Object} props
 * @param {number[]} [props.selectedTagIds=[]] - Array of selected tag IDs
 * @param {(tagIds: number[]) => void} props.onChange - Callback when tag selection changes
 * @returns {JSX.Element}
 */
const TagSelector = ({ selectedTagIds = [], onChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { data: allTags, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: tagsApi.getAll,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTags = allTags?.filter(
    (tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedTagIds.includes(tag.id)
  ) || [];

  const selectedTags = allTags?.filter((tag) => selectedTagIds.includes(tag.id)) || [];

  const handleAddTag = (tagId) => {
    if (!selectedTagIds.includes(tagId)) {
      onChange([...selectedTagIds, tagId]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveTag = (tagId) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  // Group tags by type for better display
  const groupedFilteredTags = filteredTags.reduce((acc, tag) => {
    const typeLabel = {
      0: "Dietary",
      1: "Prep Time",
      2: "Cuisine",
      3: "Custom"
    }[tag.type] || "Other";
    
    if (!acc[typeLabel]) acc[typeLabel] = [];
    acc[typeLabel].push(tag);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading tags...</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Tags <span className="text-gray-400">(Optional)</span>
      </label>
      
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                border: `1px solid ${tag.color}30`
              }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:opacity-70"
                aria-label={`Remove ${tag.name}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search and add tags..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Dropdown List */}
        {showDropdown && filteredTags.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {Object.entries(groupedFilteredTags).map(([typeLabel, tags]) => (
              <div key={typeLabel}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wide">
                  {typeLabel}
                </div>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleAddTag(tag.id)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-500">
        Click on a tag to add it. Selected tags can be removed by clicking the X.
      </p>
    </div>
  );
};

export default TagSelector;
