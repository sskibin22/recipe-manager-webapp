/**
 * Search bar component - input field with search icon
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {(value: string) => void} props.onChange - Callback when search value changes
 * @param {string} [props.placeholder="Search recipes..."] - Placeholder text
 * @returns {JSX.Element}
 */
const SearchBar = ({ value, onChange, placeholder = "Search recipes..." }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-warmgray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-wood-300 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-transparent placeholder:text-warmgray-400"
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBar;
