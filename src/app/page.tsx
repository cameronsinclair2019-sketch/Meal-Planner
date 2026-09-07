"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/supabase";

export default function Home() {
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load products");
        setProducts(json.products);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">TJ&apos;s Price Book</h1>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products..."
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base"
        autoFocus
      />

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
      {loading && <p className="mt-4 text-neutral-500 text-sm">Loading...</p>}

      <ul className="mt-4 divide-y divide-neutral-200">
        {products.map((p) => (
          <li key={p.sku} className="flex items-baseline justify-between py-2">
            <div>
              <p className="text-sm">{p.name}</p>
              <p className="text-xs text-neutral-500">
                {p.sku}
                {p.package_size ? ` · ${p.package_size}` : ""}
                {p.category ? ` · ${p.category}` : ""}
              </p>
            </div>
            <p className="text-sm font-medium tabular-nums">
              ${p.price.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>

      {!loading && products.length === 0 && (
        <p className="mt-4 text-neutral-500 text-sm">No products found.</p>
      )}
    </main>
  );
}
