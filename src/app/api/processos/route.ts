import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "ativo";
  const responsavelId = searchParams.get("responsavel_id");

  let query = supabaseAdmin
    .from("jt_processos")
    .select("*")
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (responsavelId) {
    query = query.eq("responsavel_id", responsavelId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
