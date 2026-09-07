import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type NewIngredientLine = {
  name: string;
  qty: number;
  unit: string;
};

type NewRecipeBody = {
  name: string;
  servings: number;
  source_url?: string;
  instructions?: string;
  notes?: string;
  ingredients: NewIngredientLine[];
};

async function resolveIngredientId(
  admin: ReturnType<typeof getSupabaseAdmin>,
  name: string
): Promise<string> {
  const trimmed = name.trim();

  const { data: byName, error: byNameError } = await admin
    .from("ingredients")
    .select("id")
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();

  if (byNameError) throw new Error(byNameError.message);
  if (byName) return byName.id;

  const { data: byAlias, error: byAliasError } = await admin
    .from("ingredients")
    .select("id")
    .contains("aliases", [trimmed])
    .limit(1)
    .maybeSingle();

  if (byAliasError) throw new Error(byAliasError.message);
  if (byAlias) return byAlias.id;

  const { data: created, error: createError } = await admin
    .from("ingredients")
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (createError) throw new Error(createError.message);
  return created.id;
}

export async function GET() {
  const admin = getSupabaseAdmin();

  const { data: recipes, error: recipesError } = await admin
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (recipesError) {
    return NextResponse.json({ error: recipesError.message }, { status: 500 });
  }

  const { data: allLines, error: linesError } = await admin
    .from("recipe_ingredients")
    .select("recipe_id, ingredient_id");

  if (linesError) {
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  const { data: mappedIngredientRows, error: mappedError } = await admin
    .from("ingredient_products")
    .select("ingredient_id");

  if (mappedError) {
    return NextResponse.json({ error: mappedError.message }, { status: 500 });
  }

  const mappedIngredientIds = new Set(
    (mappedIngredientRows ?? []).map((r) => r.ingredient_id)
  );

  const result = (recipes ?? []).map((recipe) => {
    const lines = (allLines ?? []).filter((l) => l.recipe_id === recipe.id);
    const mappedCount = lines.filter((l) =>
      mappedIngredientIds.has(l.ingredient_id)
    ).length;
    return {
      ...recipe,
      ingredient_count: lines.length,
      mapped_count: mappedCount,
    };
  });

  return NextResponse.json({ recipes: result });
}

export async function POST(request: NextRequest) {
  const body: NewRecipeBody = await request.json();

  if (!body.name?.trim() || !body.servings || !body.ingredients?.length) {
    return NextResponse.json(
      { error: "name, servings, and at least one ingredient are required" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: recipe, error: recipeError } = await admin
    .from("recipes")
    .insert({
      name: body.name.trim(),
      servings: body.servings,
      source_url: body.source_url?.trim() || null,
      instructions: body.instructions?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (recipeError) {
    return NextResponse.json({ error: recipeError.message }, { status: 500 });
  }

  const skipped: string[] = [];

  try {
    for (const line of body.ingredients) {
      if (!line.name?.trim() || line.qty == null || Number.isNaN(Number(line.qty))) {
        skipped.push(line.name ?? "(unnamed)");
        continue;
      }
      const ingredientId = await resolveIngredientId(admin, line.name);
      const { error: lineError } = await admin.from("recipe_ingredients").insert({
        recipe_id: recipe.id,
        ingredient_id: ingredientId,
        qty: line.qty,
        unit: line.unit?.trim() ?? "",
      });
      if (lineError) throw new Error(lineError.message);
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  if (skipped.length > 0) {
    return NextResponse.json(
      {
        id: recipe.id,
        warning: `Skipped ${skipped.length} ingredient(s) missing a name or quantity: ${skipped.join(", ")}`,
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ id: recipe.id });
}
