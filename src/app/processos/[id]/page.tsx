"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/sidebar";
import { ArrowLeft, Loader2, Clock, ExternalLink } from "lucide-react";
import type { Processo, Andamento, Usuario } from "@/lib/types";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ProcessoDetalhe() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState<Usuario | null>(null);
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [andamentos, setAndamentos] = useState<Andamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push("/login"); return; }

    const { data: userData } = await supabase
      .from("jt_usuarios").select("*").eq("id", authUser.id).single();
    if (!userData) { router.push("/login"); return; }
    setUser(userData);

    const { data: proc } = await supabase
      .from("jt_processos")
      .select("*, responsavel:jt_usuarios(id, nome, email, role, ativo, created_at)")
      .eq("id", id)
      .single();

    setProcesso(proc);

    const { data: ands } = await supabase
      .from("jt_andamentos")
      .select("*")
      .eq("processo_id", id)
      .order("data_andamento", { ascending: false });

    setAndamentos(ands || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!processo) return null;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar role={user!.role} nome={user!.nome} />

      <main className="flex-1 p-8 max-w-4xl">
        <Link href="/processos" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar para processos
        </Link>

        {/* Header do processo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">{processo.cliente}</h1>
              {processo.pasta && (
                <span className="text-slate-500 text-sm">{processo.pasta}</span>
              )}
            </div>
            <span className="bg-blue-500/20 text-blue-400 text-sm font-semibold px-3 py-1 rounded-lg flex-shrink-0">
              {processo.tribunal}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Número CNJ</span>
              <p className="text-slate-200 font-mono mt-0.5">{processo.numero_cnj}</p>
            </div>
            <div>
              <span className="text-slate-500">Responsável</span>
              <p className="text-slate-200 mt-0.5">{processo.responsavel?.nome || "—"}</p>
            </div>
            {processo.discussao && (
              <div className="col-span-2">
                <span className="text-slate-500">Discussão</span>
                <p className="text-slate-300 mt-0.5">{processo.discussao}</p>
              </div>
            )}
          </div>

          {/* Andamento atual */}
          <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Andamento atual</span>
              {processo.data_andamento && (
                <span className="text-slate-500 text-xs ml-auto">
                  {new Date(processo.data_andamento).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
            <p className="text-white text-sm">{processo.andamento_atual || "Sem andamento registrado"}</p>
          </div>
        </div>

        {/* Histórico */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-white font-semibold">Histórico de andamentos</h2>
          </div>

          {andamentos.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-sm">
              Nenhum andamento registrado ainda.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {andamentos.map((a, i) => (
                <div key={a.id} className="px-6 py-4 flex gap-4">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-blue-400" : "bg-slate-600"}`} />
                    {i < andamentos.length - 1 && <div className="w-px flex-1 bg-slate-800 min-h-4" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-slate-200 text-sm">{a.descricao}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-500 text-xs">
                        {new Date(a.data_andamento).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-slate-600 text-xs">
                        · detectado em {new Date(a.detectado_em).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
