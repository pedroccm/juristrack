import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [procResult, andResult, linksResult] = await Promise.all([
    supabaseAdmin.from("jt_processos").select("*").eq("id", id).single(),
    supabaseAdmin.from("jt_andamentos").select("*").eq("processo_id", id).order("data_andamento", { ascending: false }),
    supabaseAdmin.from("jt_processo_responsaveis").select("usuario_id").eq("processo_id", id),
  ]);

  if (procResult.error) return NextResponse.json({ error: procResult.error.message }, { status: 404 });

  // Get responsaveis
  const userIds = (linksResult.data || []).map((l) => l.usuario_id);
  let responsaveis: Record<string, unknown>[] = [];
  if (userIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("jt_usuarios")
      .select("id, nome, email, role")
      .in("id", userIds);
    responsaveis = data || [];
  }

  return NextResponse.json({
    processo: {
      ...procResult.data,
      responsaveis,
      responsavel: responsaveis[0] || null,
    },
    andamentos: andResult.data || [],
  });
}
