"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2 } from "lucide-react";
import type { Usuario } from "@/lib/types";

const TRIBUNAIS = ["TJSP","TJRJ","TJSC","TJRN","TJPE","TJBA","TJCE","TJES","TJPB","TJSE","TJAL","TRF1","TRF3","TRF4","TRF6","STF","STJ"];

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function NovoProcessoModal({ onClose, onSaved }: Props) {
  const [advogados, setAdvogados] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    numero_cnj: "",
    tribunal: "TJSP",
    cliente: "",
    pasta: "",
    discussao: "",
    responsaveis_ids: [] as string[],
  });

  useEffect(() => {
    supabase.from("jt_usuarios").select("*").eq("ativo", true).order("nome").then(({ data }) => {
      setAdvogados(data || []);
    });
  }, []);

  function toggleResponsavel(id: string) {
    setForm((f) => ({
      ...f,
      responsaveis_ids: f.responsaveis_ids.includes(id)
        ? f.responsaveis_ids.filter((r) => r !== id)
        : [...f.responsaveis_ids, id],
    }));
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (form.responsaveis_ids.length === 0) {
      alert("Selecione ao menos um responsável.");
      setLoading(false);
      return;
    }

    const { data: proc, error } = await supabase.from("jt_processos").insert({
      numero_cnj: form.numero_cnj,
      tribunal: form.tribunal,
      cliente: form.cliente,
      pasta: form.pasta,
      discussao: form.discussao,
      status: "ativo",
    }).select().single();

    if (error || !proc) {
      alert("Erro ao salvar: " + (error?.message || "desconhecido"));
      setLoading(false);
      return;
    }

    // Insere os responsáveis
    await supabase.from("jt_processo_responsaveis").insert(
      form.responsaveis_ids.map((uid) => ({ processo_id: proc.id, usuario_id: uid }))
    );

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-lg">Novo processo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Número CNJ *</label>
              <input
                value={form.numero_cnj}
                onChange={(e) => set("numero_cnj", e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Tribunal *</label>
              <select
                value={form.tribunal}
                onChange={(e) => set("tribunal", e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {TRIBUNAIS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Pasta / Matter</label>
              <input
                value={form.pasta}
                onChange={(e) => set("pasta", e.target.value)}
                placeholder="PR12345"
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Cliente *</label>
              <input
                value={form.cliente}
                onChange={(e) => set("cliente", e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Discussão / Matéria</label>
              <textarea
                value={form.discussao}
                onChange={(e) => set("discussao", e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1.5">Responsáveis *</label>
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                {advogados.map((a) => {
                  const selected = form.responsaveis_ids.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleResponsavel(a.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {a.nome}
                    </button>
                  );
                })}
              </div>
              {form.responsaveis_ids.length > 0 && (
                <p className="text-slate-500 text-xs mt-1">{form.responsaveis_ids.length} selecionado(s)</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar processo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
