const CategoryBadge = ({ category }) => {
  if (!category) return null;

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
        border: `1px solid ${category.color}40`
      }}
    >
      {category.name}
    </span>
  );
};

export default CategoryBadge;
