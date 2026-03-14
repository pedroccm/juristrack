import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const N8N_WEBHOOK = "http://165.227.197.59:5678/webhook/juristrack-monitorar";

export async function POST() {
  // Cria registro de monitoramento
  const { data: monit, error } = await supabase
    .from("jt_monitoramentos")
    .insert({ status: "rodando", total_processos: 0, total_mudancas: 0, total_nao_encontrados: 0 })
    .select()
    .single();

  if (error || !monit) {
    return NextResponse.json({ ok: false, error: error?.message }, { status: 500 });
  }

  // Dispara o N8N de forma assíncrona (não aguarda conclusão)
  fetch(N8N_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monitoramento_id: monit.id }),
  }).catch(() => {}); // ignora erro — o N8N processa em background

  return NextResponse.json({ ok: true, monitoramento_id: monit.id });
}
