import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { id, lineId } = await params;
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("recipe_ingredients")
    .delete()
    .eq("id", lineId)
    .eq("recipe_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
