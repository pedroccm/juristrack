"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/sidebar";
import { Plus, Search, Filter, Loader2, ChevronRight } from "lucide-react";
import type { Processo, Usuario } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NovoProcessoModal from "./novo-processo-modal";

const TRIBUNAIS = ["TJSP","TJRJ","TJSC","TJRN","TJPE","TJBA","TJCE","TJES","TJPB","TJSE","TJAL","TRF1","TRF3","TRF4","TRF6","STF","STJ"];

export default function ProcessosPage() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [tribunal, setTribunal] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { router.push("/login"); return; }
      loadData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData(userId: string) {
    const { data: userData } = await supabase
      .from("jt_usuarios").select("*").eq("id", userId).single();
    if (!userData) { router.push("/login"); return; }
    setUser(userData);

    let query = supabase
      .from("jt_processos")
      .select("*, responsavel:jt_usuarios(id, nome, email, role, ativo, created_at)")
      .eq("status", "ativo")
      .order("updated_at", { ascending: false });

    if (userData.role === "advogado") {
      query = query.eq("responsavel_id", userId);
    }

    const { data } = await query;
    setProcessos(data || []);
    setLoading(false);
  }

  const filtrados = processos.filter((p) => {
    const termo = busca.toLowerCase();
    const matchBusca = !busca ||
      p.cliente.toLowerCase().includes(termo) ||
      p.numero_cnj.includes(termo) ||
      p.pasta.toLowerCase().includes(termo);
    const matchTribunal = !tribunal || p.tribunal === tribunal;
    return matchBusca && matchTribunal;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar role={user!.role} nome={user!.nome} />

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Processos</h1>
            <p className="text-slate-400 mt-1">{filtrados.length} processos ativos</p>
          </div>
          {user!.role === "admin" && (
            <button
              onClick={() => setModalAberto(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo processo
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, número ou pasta..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={tribunal}
            onChange={(e) => setTribunal(e.target.value)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Todos os tribunais</option>
            {TRIBUNAIS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Tabela */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente / Pasta</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Número</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tribunal</th>
                {user!.role === "admin" && (
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Responsável</th>
                )}
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Último andamento</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-white text-sm font-medium">{p.cliente}</p>
                    {p.pasta && <p className="text-slate-500 text-xs mt-0.5">{p.pasta}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-xs font-mono">{p.numero_cnj}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-2 py-1 rounded">
                      {p.tribunal}
                    </span>
                  </td>
                  {user!.role === "admin" && (
                    <td className="px-6 py-4">
                      <span className="text-slate-300 text-sm">{p.responsavel?.nome || "—"}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-slate-300 text-sm truncate">{p.andamento_atual || "—"}</p>
                    {p.data_andamento && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(p.data_andamento).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/processos/${p.id}`}>
                      <ChevronRight className="w-4 h-4 text-slate-500 hover:text-white transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nenhum processo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {modalAberto && (
        <NovoProcessoModal
          onClose={() => setModalAberto(false)}
          onSaved={() => { setModalAberto(false); loadData(); }}
        />
      )}
    </div>
  );
}
