"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RecipeListItem } from "@/lib/types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setRecipes(json.recipes);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Recipes</h1>
        <Link
          href="/recipes/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white"
        >
          + New recipe
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p className="text-neutral-500 text-sm">Loading...</p>}

      <ul className="divide-y divide-neutral-200">
        {recipes.map((r) => {
          const allMapped = r.ingredient_count > 0 && r.mapped_count === r.ingredient_count;
          return (
            <li key={r.id} className="py-3">
              <Link href={`/recipes/${r.id}`} className="block">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-neutral-500">
                  {r.servings} servings ·{" "}
                  <span className={allMapped ? "text-green-700" : "text-amber-700"}>
                    {r.mapped_count}/{r.ingredient_count} ingredients mapped
                  </span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      {!loading && recipes.length === 0 && (
        <p className="text-neutral-500 text-sm">No recipes yet.</p>
      )}
    </main>
  );
}
