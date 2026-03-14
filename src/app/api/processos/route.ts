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

  if (responsavelId) {
    // Get processo IDs this user is responsible for
    const { data: links } = await supabaseAdmin
      .from("jt_processo_responsaveis")
      .select("processo_id")
      .eq("usuario_id", responsavelId);

    const ids = (links || []).map((l) => l.processo_id);
    if (ids.length === 0) return NextResponse.json([]);

    const { data, error } = await supabaseAdmin
      .from("jt_processos")
      .select("*")
      .eq("status", status)
      .in("id", ids)
      .order("updated_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Attach responsaveis
    const enriched = await attachResponsaveis(data || []);
    return NextResponse.json(enriched);
  }

  const { data, error } = await supabaseAdmin
    .from("jt_processos")
    .select("*")
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await attachResponsaveis(data || []);
  return NextResponse.json(enriched);
}

async function attachResponsaveis(processos: Record<string, unknown>[]) {
  if (processos.length === 0) return processos;

  const procIds = processos.map((p) => p.id as string);

  // Get all links for these processos
  const { data: links } = await supabaseAdmin
    .from("jt_processo_responsaveis")
    .select("processo_id, usuario_id")
    .in("processo_id", procIds);

  if (!links || links.length === 0) return processos;

  // Get unique user IDs
  const userIds = [...new Set(links.map((l) => l.usuario_id))];
  const { data: usuarios } = await supabaseAdmin
    .from("jt_usuarios")
    .select("id, nome, email, role")
    .in("id", userIds);

  const userMap = new Map((usuarios || []).map((u) => [u.id, u]));

  // Build processo -> responsaveis mapping
  const procResponsaveis = new Map<string, typeof usuarios>();
  for (const link of links) {
    const user = userMap.get(link.usuario_id);
    if (!user) continue;
    const list = procResponsaveis.get(link.processo_id) || [];
    list.push(user);
    procResponsaveis.set(link.processo_id, list);
  }

  return processos.map((p) => ({
    ...p,
    responsaveis: procResponsaveis.get(p.id as string) || [],
    responsavel: (procResponsaveis.get(p.id as string) || [])[0] || null,
  }));
}
