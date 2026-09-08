import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body: { name: string; price: number } = await request.json();

  if (!body.name?.trim() || !body.price) {
    return NextResponse.json(
      { error: "name and price are required" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const sku = `manual-${randomUUID().slice(0, 8)}`;

  const { error } = await admin.from("products").insert({
    sku,
    name: body.name.trim(),
    price: body.price,
    store_code: "manual",
    last_updated: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sku, name: body.name.trim(), price: body.price });
}
