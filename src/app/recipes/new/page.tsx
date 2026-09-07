"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type IngredientRow = { name: string; qty: string; unit: string };

export default function NewRecipePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [servings, setServings] = useState("4");
  const [sourceUrl, setSourceUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: "", qty: "", unit: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIngredient(index: number, field: keyof IngredientRow, value: string) {
    setIngredients((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addIngredientRow() {
    setIngredients((rows) => [...rows, { name: "", qty: "", unit: "" }]);
  }

  function removeIngredientRow(index: number) {
    setIngredients((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          servings: Number(servings),
          source_url: sourceUrl,
          instructions,
          notes,
          ingredients: ingredients
            .filter((row) => row.name.trim())
            .map((row) => ({
              name: row.name,
              qty: Number(row.qty),
              unit: row.unit,
            })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create recipe");
      router.push(`/recipes/${json.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">New Recipe</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Servings</label>
          <input
            required
            type="number"
            min={1}
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="w-32 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Source URL (optional)</label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((row, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="qty"
                  value={row.qty}
                  onChange={(e) => updateIngredient(i, "qty", e.target.value)}
                  className="w-16 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="unit"
                  value={row.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                  className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="ingredient name"
                  value={row.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeIngredientRow(i)}
                  className="text-neutral-400 hover:text-red-600 px-2"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredientRow}
            className="mt-2 text-sm text-neutral-600 hover:underline"
          >
            + Add ingredient
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Instructions (optional)</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save recipe"}
        </button>
      </form>
    </main>
  );
}
