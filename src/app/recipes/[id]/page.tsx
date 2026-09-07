"use client";

import { use, useEffect, useState, useCallback } from "react";
import type { RecipeDetail, RecipeIngredientLine, ProductCandidate } from "@/lib/types";

function IngredientMapper({
  line,
  onMapped,
}: {
  line: RecipeIngredientLine;
  onMapped: () => void;
}) {
  const [query, setQuery] = useState(line.name);
  const [candidates, setCandidates] = useState<ProductCandidate[]>([]);
  const [selected, setSelected] = useState<ProductCandidate | null>(null);
  const [packageYield, setPackageYield] = useState("");
  const [yieldUnit, setYieldUnit] = useState(line.unit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setCandidates([]);
      return;
    }
    fetch(`/api/products/candidates?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((json) => setCandidates(json.products ?? []));
  }, []);

  useEffect(() => {
    search(line.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.name]);

  async function confirmMapping() {
    if (!selected || !packageYield.trim() || !yieldUnit.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredient_id: line.ingredient_id,
          product_sku: selected.sku,
          package_yield: Number(packageYield),
          yield_unit: yieldUnit,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save mapping");
      onMapped();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-medium text-amber-800 mb-2">
        UNMAPPED — find the TJ&apos;s product for &quot;{line.name}&quot;
      </p>

      <div className="flex gap-2 mb-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          placeholder="Search products..."
          className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </div>

      <ul className="max-h-48 overflow-y-auto divide-y divide-neutral-200 border border-neutral-200 rounded-md bg-white">
        {candidates.map((c) => (
          <li key={c.sku}>
            <button
              type="button"
              onClick={() => setSelected(c)}
              className={`w-full text-left px-2 py-1.5 text-sm hover:bg-neutral-50 ${
                selected?.sku === c.sku ? "bg-neutral-100" : ""
              }`}
            >
              {c.name} — ${c.price.toFixed(2)}
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div className="mt-3 flex items-end gap-2">
          <div>
            <label className="block text-xs text-neutral-600">
              1 package of &quot;{selected.name}&quot; yields
            </label>
            <input
              value={packageYield}
              onChange={(e) => setPackageYield(e.target.value)}
              placeholder="qty"
              className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
            />
          </div>
          <input
            value={yieldUnit}
            onChange={(e) => setYieldUnit(e.target.value)}
            placeholder="unit"
            className="w-24 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={confirmMapping}
            disabled={saving}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Confirm mapping"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-red-600 text-xs">{error}</p>}
    </div>
  );
}

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<RecipeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/recipes/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="mx-auto max-w-2xl px-4 py-8 text-red-600 text-sm">{error}</p>;
  if (!data) return <p className="mx-auto max-w-2xl px-4 py-8 text-neutral-500 text-sm">Loading...</p>;

  const unmappedCount = data.ingredients.filter((i) => !i.mapping).length;
  const shoppingCost = data.ingredients.reduce(
    (sum, i) => sum + (i.mapping?.price ?? 0),
    0
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">{data.recipe.name}</h1>
      <p className="text-sm text-neutral-500 mb-1">{data.recipe.servings} servings</p>
      {data.recipe.source_url && (
        <a
          href={data.recipe.source_url}
          className="text-sm text-blue-600 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {data.recipe.source_url}
        </a>
      )}

      {unmappedCount > 0 ? (
        <p className="mt-4 text-sm font-medium text-amber-700">
          {unmappedCount} ingredient{unmappedCount > 1 ? "s" : ""} unmapped — cost below is
          incomplete
        </p>
      ) : (
        <p className="mt-4 text-sm font-medium text-green-700">
          All ingredients mapped — shopping cost: ${shoppingCost.toFixed(2)}
        </p>
      )}

      <ul className="mt-4 divide-y divide-neutral-200">
        {data.ingredients.map((line) => (
          <li key={line.id} className="py-3">
            <p className="text-sm">
              {line.qty} {line.unit} {line.name}
            </p>
            {line.mapping ? (
              <p className="text-xs text-neutral-500 mt-0.5">
                → {line.mapping.product_name} (${line.mapping.price.toFixed(2)}, 1 package ={" "}
                {line.mapping.package_yield} {line.mapping.yield_unit})
              </p>
            ) : (
              <IngredientMapper line={line} onMapped={load} />
            )}
          </li>
        ))}
      </ul>

      {data.recipe.instructions && (
        <div className="mt-6">
          <h2 className="text-sm font-medium mb-1">Instructions</h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">
            {data.recipe.instructions}
          </p>
        </div>
      )}

      {data.recipe.notes && (
        <div className="mt-4">
          <h2 className="text-sm font-medium mb-1">Notes</h2>
          <p className="text-sm text-neutral-700 whitespace-pre-wrap">{data.recipe.notes}</p>
        </div>
      )}
    </main>
  );
}
