export type Recipe = {
  id: string;
  name: string;
  servings: number;
  source_url: string | null;
  instructions: string | null;
  notes: string | null;
  created_at: string;
};

export type RecipeListItem = Recipe & {
  ingredient_count: number;
  mapped_count: number;
};

export type Mapping = {
  product_sku: string;
  product_name: string;
  price: number;
  package_yield: number;
  yield_unit: string;
};

export type RecipeIngredientLine = {
  id: string;
  ingredient_id: string;
  name: string;
  qty: number;
  unit: string;
  mapping: Mapping | null;
};

export type RecipeDetail = {
  recipe: Recipe;
  ingredients: RecipeIngredientLine[];
};

export type ProductCandidate = {
  sku: string;
  name: string;
  price: number;
};
