"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/header";
import { FileText, AlertCircle, CheckCircle, Play, Loader2, Clock, ChevronRight } from "lucide-react";
import type { Processo, Monitoramento, Usuario } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [ultimoMonitoramento, setUltimoMonitoramento] = useState<Monitoramento | null>(null);
  const [monitorando, setMonitorando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); return; }
      setAuthUserId(session.user.id);
      loadData(session.access_token, session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.push("/login");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!monitorando || !authUserId) return;
    const interval = setInterval(async () => {
      const monitRes = await fetch("/api/monitoramentos");
      const data = await monitRes.json();
      if (data?.status === "concluido" || data?.status === "erro") {
        setMonitorando(false);
        setUltimoMonitoramento(data);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) loadData(session.access_token, session.user.id);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [monitorando, authUserId]);

  async function loadData(token: string, userId: string) {
    const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { router.push("/login"); return; }
    const userData = await res.json();
    setUser(userData);

    const procUrl = userData.role === "advogado"
      ? `/api/processos?responsavel_id=${userId}`
      : "/api/processos";
    const procRes = await fetch(procUrl);
    const processosData = await procRes.json();
    setProcessos(Array.isArray(processosData) ? processosData : []);

    const monitRes = await fetch("/api/monitoramentos");
    const monit = await monitRes.json();
    setUltimoMonitoramento(monit);
    setLoading(false);
  }

  async function rodarMonitoramento() {
    const res = await fetch("/api/monitorar", { method: "POST" });
    const data = await res.json();
    if (data.ok) setMonitorando(true);
  }

  const mudancasHoje = processos.filter((p) => {
    if (!p.data_andamento) return false;
    const hoje = new Date().toISOString().slice(0, 10);
    return p.data_andamento.slice(0, 10) >= hoje;
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

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-gray-500 text-sm mt-0.5">Bom dia, {user!.nome.split(" ")[0]}</p>
            </div>
            {user!.role === "admin" && (
              <button
                onClick={rodarMonitoramento}
                disabled={monitorando}
                className="inline-flex items-center gap-2 bg-gray-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-full transition"
              >
                {monitorando
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Monitorando...</>
                  : <><Play className="w-3.5 h-3.5" /> Rodar monitoramento</>}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard icon={<FileText className="w-4 h-4 text-blue-500" />} label="Processos ativos" value={processos.length} bg="bg-blue-50" />
            <StatCard icon={<AlertCircle className="w-4 h-4 text-amber-500" />} label="Com andamento recente" value={mudancasHoje.length} bg="bg-amber-50" />
            <StatCard
              icon={<CheckCircle className="w-4 h-4 text-green-500" />}
              label="Último monitoramento"
              value={ultimoMonitoramento ? new Date(ultimoMonitoramento.iniciado_em).toLocaleDateString("pt-BR") : "—"}
              bg="bg-green-50"
            />
          </div>

          {/* Recent */}
          <div className="bg-white border border-[#E5E7EB] rounded shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between">
              <span className="font-serif font-semibold text-gray-900">Andamentos recentes</span>
              {mudancasHoje.length > 0 && (
                <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-amber-200">
                  {mudancasHoje.length} novos
                </span>
              )}
            </div>
            {mudancasHoje.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-sm">
                Nenhum andamento recente detectado.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {mudancasHoje.map((p) => (
                  <Link
                    key={p.id}
                    href={`/processos/${p.id}`}
                    className="px-5 py-4 flex items-start gap-4 hover:bg-[#F8F9FA] transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-50 text-blue-700 text-xs font-mono px-1.5 py-0.5 rounded border border-blue-100">
                          {p.tribunal}
                        </span>
                        {user!.role === "admin" && p.responsavel && (
                          <span className="text-gray-400 text-xs">{p.responsavel.nome}</span>
                        )}
                      </div>
                      <p className="text-gray-900 text-sm font-medium truncate">{p.cliente}</p>
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{p.andamento_atual}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <Clock className="w-3 h-3" />
                        {p.data_andamento ? new Date(p.data_andamento).toLocaleDateString("pt-BR") : "—"}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-1 ml-auto transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded shadow-sm p-5">
      <div className={`inline-flex p-2 rounded ${bg} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900 font-serif tracking-tight">{value}</div>
      <div className="text-gray-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}
