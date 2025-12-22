/**
 * @typedef {import('../types/recipe').Tag} Tag
 */

/**
 * Tag badge component - displays a tag label with color styling
 * @param {Object} props
 * @param {Tag|null} props.tag - Tag object to display
 * @returns {JSX.Element|null}
 */
const TagBadge = ({ tag }) => {
  if (!tag) return null;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{
        backgroundColor: `${tag.color}15`,
        color: tag.color,
        border: `1px solid ${tag.color}30`
      }}
    >
      {tag.name}
    </span>
  );
};

export default TagBadge;
