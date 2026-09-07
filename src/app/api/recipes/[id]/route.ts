import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { RecipeIngredientLine } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { data: recipe, error: recipeError } = await admin
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (recipeError) {
    return NextResponse.json({ error: recipeError.message }, { status: 404 });
  }

  const { data: lines, error: linesError } = await admin
    .from("recipe_ingredients")
    .select("id, ingredient_id, qty, unit, ingredients(name)")
    .eq("recipe_id", id);

  if (linesError) {
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  const ingredientIds = (lines ?? []).map((l) => l.ingredient_id);

  const { data: mappings, error: mappingsError } = await admin
    .from("ingredient_products")
    .select("ingredient_id, product_sku, package_yield, yield_unit, products(name, price)")
    .in("ingredient_id", ingredientIds.length > 0 ? ingredientIds : [""]);

  if (mappingsError) {
    return NextResponse.json({ error: mappingsError.message }, { status: 500 });
  }

  const mappingByIngredient = new Map(
    (mappings ?? []).map((m) => {
      const product = Array.isArray(m.products) ? m.products[0] : m.products;
      return [
        m.ingredient_id,
        {
          product_sku: m.product_sku,
          product_name: product?.name ?? "",
          price: product?.price ?? 0,
          package_yield: m.package_yield,
          yield_unit: m.yield_unit,
        },
      ];
    })
  );

  const ingredients: RecipeIngredientLine[] = (lines ?? []).map((l) => {
    const ingredient = Array.isArray(l.ingredients) ? l.ingredients[0] : l.ingredients;
    return {
      id: l.id,
      ingredient_id: l.ingredient_id,
      name: ingredient?.name ?? "",
      qty: l.qty,
      unit: l.unit,
      mapping: mappingByIngredient.get(l.ingredient_id) ?? null,
    };
  });

  return NextResponse.json({ recipe, ingredients });
}
