/**
 * Component to display manual recipe content in readonly mode (wrapper)
 */

import ManualRecipeReadonlyView from "./ManualRecipeReadonlyView";

export default function ManualRecipeView({ recipe }) {
  if (!recipe || recipe.type.toLowerCase() !== "manual") return null;

  return <ManualRecipeReadonlyView content={recipe.content} />;
}
