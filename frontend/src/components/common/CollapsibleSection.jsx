import { useState } from "react";

/**
 * Collapsible section component with dropdown arrow and count badge
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {number} props.count - Number of items in section
 * @param {boolean} [props.defaultExpanded=true] - Whether section is expanded by default
 * @param {React.ReactNode} props.children - Section content
 * @param {string} [props.storageKey] - Optional localStorage key for persisting state
 * @returns {JSX.Element}
 */
const CollapsibleSection = ({
  title,
  count,
  defaultExpanded = true,
  children,
  storageKey,
}) => {
  // Load initial state from localStorage if storageKey is provided
  const getInitialExpanded = () => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return defaultExpanded;
  };

  const [isExpanded, setIsExpanded] = useState(getInitialExpanded);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // Persist state to localStorage if storageKey is provided
    if (storageKey) {
      localStorage.setItem(storageKey, String(newExpanded));
    }
  };

  return (
    <div className="mb-6">
      {/* Section Header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 mb-4 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left group"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title} section`}
      >
        {/* Dropdown Arrow */}
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>

        {/* Title and Count */}
        <div className="flex items-center gap-2 flex-1">
          <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h2>
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
            {count}
          </span>
        </div>
      </button>

      {/* Section Content */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? "max-h-[50000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;
