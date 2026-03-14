"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/header";
import { ArrowLeft, Loader2, Clock } from "lucide-react";
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      loadData(session.access_token, session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/login");
    });
    return () => subscription.unsubscribe();
  }, [id]);

  async function loadData(token: string, _userId: string) {
    const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { router.push("/login"); return; }
    const userData = await res.json();
    setUser(userData);

    const procRes = await fetch(`/api/processos/${id}`);
    if (!procRes.ok) { router.push("/processos"); return; }
    const { processo, andamentos: ands } = await procRes.json();
    setProcesso(processo);
    setAndamentos(ands || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!processo) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FA]">
      <Header role={user!.role} nome={user!.nome} />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/processos"
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-xs mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para processos
          </Link>

          {/* Header do processo */}
          <div className="bg-white border border-[#E5E7EB] rounded shadow-sm p-6 mb-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h1 className="font-serif text-xl font-semibold text-gray-900 tracking-tight">{processo.cliente}</h1>
                {processo.pasta && (
                  <span className="text-gray-400 text-sm mt-0.5 block">{processo.pasta}</span>
                )}
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded border border-blue-100 flex-shrink-0">
                {processo.tribunal}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Número CNJ</span>
                <p className="text-gray-800 font-mono text-sm mt-1">{processo.numero_cnj}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Responsável</span>
                <p className="text-gray-800 text-sm mt-1">{processo.responsavel?.nome || "—"}</p>
              </div>
              {processo.discussao && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Discussão</span>
                  <p className="text-gray-600 text-sm mt-1">{processo.discussao}</p>
                </div>
              )}
            </div>

            {/* Andamento atual */}
            <div className="mt-5 p-4 bg-[#F8F9FA] rounded border border-[#E5E7EB]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Andamento atual</span>
                {processo.data_andamento && (
                  <span className="text-gray-400 text-xs ml-auto">
                    {new Date(processo.data_andamento).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
              <p className="text-gray-800 text-sm">{processo.andamento_atual || "Sem andamento registrado"}</p>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white border border-[#E5E7EB] rounded shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E5E7EB]">
              <h2 className="font-serif font-semibold text-gray-900">Histórico de andamentos</h2>
            </div>

            {andamentos.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                Nenhum andamento registrado ainda.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {andamentos.map((a, i) => (
                  <div key={a.id} className="px-5 py-4 flex gap-4">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? "bg-blue-400" : "bg-gray-300"}`} />
                      {i < andamentos.length - 1 && <div className="w-px flex-1 bg-[#E5E7EB] min-h-4" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-gray-800 text-sm">{a.descricao}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-400 text-xs">
                          {new Date(a.data_andamento).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="text-gray-300 text-xs">
                          · detectado em {new Date(a.detectado_em).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
