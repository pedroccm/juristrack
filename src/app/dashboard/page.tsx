"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/sidebar";
import { FileText, AlertCircle, CheckCircle, Play, Loader2, Clock } from "lucide-react";
import type { Processo, Monitoramento, Usuario } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [ultimoMonitoramento, setUltimoMonitoramento] = useState<Monitoramento | null>(null);
  const [monitorando, setMonitorando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { router.push("/login"); return; }
      setAuthUserId(session.user.id);
      loadData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Polling: enquanto monitorando, verifica status a cada 3s
  useEffect(() => {
    if (!monitorando || !authUserId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("jt_monitoramentos")
        .select("*")
        .order("iniciado_em", { ascending: false })
        .limit(1)
        .single();
      if (data?.status === "concluido" || data?.status === "erro") {
        setMonitorando(false);
        setUltimoMonitoramento(data);
        loadData(authUserId);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [monitorando, authUserId]);

  async function loadData(userId: string) {
    const { data: userData } = await supabase
      .from("jt_usuarios")
      .select("*")
      .eq("id", userId)
      .single();

    if (!userData) { router.push("/login"); return; }
    setUser(userData);

    // Carrega processos (admin vê todos, advogado vê só os seus)
    let query = supabase
      .from("jt_processos")
      .select("*, responsavel:jt_usuarios(id, nome, email, role, ativo, created_at)")
      .eq("status", "ativo")
      .order("updated_at", { ascending: false });

    if (userData.role === "advogado") {
      query = query.eq("responsavel_id", userId);
    }

    const { data: processosData } = await query;
    setProcessos(processosData || []);

    // Último monitoramento
    const { data: monit } = await supabase
      .from("jt_monitoramentos")
      .select("*")
      .order("iniciado_em", { ascending: false })
      .limit(1)
      .single();

    setUltimoMonitoramento(monit);
    setLoading(false);
  }

  async function rodarMonitoramento() {
    const res = await fetch("/api/monitorar", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setMonitorando(true); // polling começa aqui, para quando N8N finalizar
    }
  }

  const mudancasHoje = processos.filter((p) => {
    if (!p.data_andamento) return false;
    const hoje = new Date().toISOString().slice(0, 10);
    return p.data_andamento.slice(0, 10) >= hoje;
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Bom dia, {user!.nome.split(" ")[0]}</p>
          </div>

          {user!.role === "admin" && (
            <button
              onClick={rodarMonitoramento}
              disabled={monitorando}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {monitorando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Monitorando...</>
              ) : (
                <><Play className="w-4 h-4" /> Rodar monitoramento</>
              )}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5 text-blue-400" />}
            label="Processos ativos"
            value={processos.length}
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
            label="Com andamento recente"
            value={mudancasHoje.length}
            bg="bg-amber-500/10"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-green-400" />}
            label="Último monitoramento"
            value={ultimoMonitoramento
              ? new Date(ultimoMonitoramento.iniciado_em).toLocaleDateString("pt-BR")
              : "—"}
            bg="bg-green-500/10"
          />
        </div>

        {/* Processos com andamento recente */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Andamentos recentes</h2>
            {mudancasHoje.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                {mudancasHoje.length} novos
              </span>
            )}
          </div>

          {mudancasHoje.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Nenhum andamento recente detectado.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {mudancasHoje.map((p) => (
                <ProcessoRow key={p.id} processo={p} showResponsavel={user!.role === "admin"} />
              ))}
            </div>
          )}
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-4`}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-sm mt-1">{label}</div>
    </div>
  );
}

function ProcessoRow({ processo, showResponsavel }: { processo: Processo; showResponsavel: boolean }) {
  return (
    <div className="px-6 py-4 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/20 text-blue-400 text-xs font-mono px-2 py-0.5 rounded">
              {processo.tribunal}
            </span>
            {showResponsavel && processo.responsavel && (
              <span className="text-slate-500 text-xs">{processo.responsavel.nome}</span>
            )}
          </div>
          <p className="text-white text-sm font-medium truncate">{processo.cliente}</p>
          <p className="text-slate-400 text-sm mt-0.5 line-clamp-2">{processo.andamento_atual}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Clock className="w-3 h-3" />
            {processo.data_andamento
              ? new Date(processo.data_andamento).toLocaleDateString("pt-BR")
              : "—"}
          </div>
          <p className="text-slate-600 text-xs mt-1 font-mono">{processo.numero_cnj.slice(0, 20)}...</p>
        </div>
      </div>
    </div>
  );
}
