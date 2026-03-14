import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [procResult, andResult] = await Promise.all([
    supabaseAdmin.from("jt_processos").select("*").eq("id", id).single(),
    supabaseAdmin.from("jt_andamentos").select("*").eq("processo_id", id).order("data_andamento", { ascending: false }),
  ]);

  if (procResult.error) return NextResponse.json({ error: procResult.error.message }, { status: 404 });

  return NextResponse.json({
    processo: procResult.data,
    andamentos: andResult.data || [],
  });
}
