"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/header";
import { Plus, Search, Loader2, ChevronRight } from "lucide-react";
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      loadData(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/login");
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
    if (userData.role === "advogado") query = query.eq("responsavel_id", userId);

    const { data } = await query;
    setProcessos(data || []);
    setLoading(false);
  }

  const filtrados = processos.filter((p) => {
    const termo = busca.toLowerCase();
    const matchBusca = !busca ||
      p.cliente.toLowerCase().includes(termo) ||
      p.numero_cnj.includes(termo) ||
      p.pasta?.toLowerCase().includes(termo);
    const matchTribunal = !tribunal || p.tribunal === tribunal;
    return matchBusca && matchTribunal;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FA]">
      <Header role={user!.role} nome={user!.nome} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left pane — filters + list */}
        <aside className="w-72 bg-white border-r border-[#E5E7EB] flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="font-serif font-semibold text-sm text-gray-900">Processos ativos</span>
            {user!.role === "admin" && (
              <button
                onClick={() => setModalAberto(true)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Novo processo"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-[#E5E7EB] space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            <select
              value={tribunal}
              onChange={(e) => setTribunal(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Todos os tribunais</option>
              {TRIBUNAIS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
            {filtrados.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-xs">Nenhum processo encontrado.</div>
            ) : (
              filtrados.map((p) => (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  className="block px-4 py-3 hover:bg-[#F8F9FA] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{p.cliente}</p>
                      {p.pasta && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{p.pasta}</p>}
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-blue-100 flex-shrink-0">
                      {p.tribunal}
                    </span>
                  </div>
                  {p.andamento_atual && (
                    <p className="text-[11px] text-gray-400 mt-1.5 line-clamp-2">{p.andamento_atual}</p>
                  )}
                </Link>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[#E5E7EB]">
            <p className="text-[11px] text-gray-400">{filtrados.length} processos</p>
          </div>
        </aside>

        {/* Center — table */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-semibold text-gray-900 tracking-tight">Processos</h1>
            <p className="text-gray-500 text-sm mt-0.5">{filtrados.length} processos ativos</p>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente / Pasta</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tribunal</th>
                  {user!.role === "admin" && (
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                  )}
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Último andamento</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-900">{p.cliente}</p>
                      {p.pasta && <p className="text-xs text-gray-400 mt-0.5">{p.pasta}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-500 font-mono">{p.numero_cnj}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded border border-blue-100">
                        {p.tribunal}
                      </span>
                    </td>
                    {user!.role === "admin" && (
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600">{p.responsavel?.nome || "—"}</span>
                      </td>
                    )}
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-sm text-gray-600 truncate">{p.andamento_atual || "—"}</p>
                      {p.data_andamento && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(p.data_andamento).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/processos/${p.id}`}>
                        <ChevronRight className="w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                      Nenhum processo encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {modalAberto && (
        <NovoProcessoModal
          onClose={() => setModalAberto(false)}
          onSaved={async () => {
            setModalAberto(false);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) loadData(session.user.id);
          }}
        />
      )}
    </div>
  );
}
