import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type NewMappingBody = {
  ingredient_id: string;
  product_sku: string;
  package_yield: number;
  yield_unit: string;
};

export async function POST(request: NextRequest) {
  const body: NewMappingBody = await request.json();

  if (
    !body.ingredient_id ||
    !body.product_sku ||
    !body.package_yield ||
    !body.yield_unit?.trim()
  ) {
    return NextResponse.json(
      { error: "ingredient_id, product_sku, package_yield, and yield_unit are required" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  const { error } = await admin.from("ingredient_products").upsert(
    {
      ingredient_id: body.ingredient_id,
      product_sku: body.product_sku,
      package_yield: body.package_yield,
      yield_unit: body.yield_unit.trim(),
    },
    { onConflict: "ingredient_id,product_sku" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
