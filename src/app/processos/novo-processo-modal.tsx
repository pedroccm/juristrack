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

    await supabase.from("jt_processo_responsaveis").insert(
      form.responsaveis_ids.map((uid) => ({ processo_id: proc.id, usuario_id: uid }))
    );

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E5E7EB] rounded shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-serif font-semibold text-gray-900">Novo processo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Número CNJ *</label>
              <input
                value={form.numero_cnj}
                onChange={(e) => set("numero_cnj", e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
                required
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Tribunal *</label>
              <select
                value={form.tribunal}
                onChange={(e) => set("tribunal", e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {TRIBUNAIS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Pasta / Matter</label>
              <input
                value={form.pasta}
                onChange={(e) => set("pasta", e.target.value)}
                placeholder="PR12345"
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Cliente *</label>
              <input
                value={form.cliente}
                onChange={(e) => set("cliente", e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Discussão / Matéria</label>
              <textarea
                value={form.discussao}
                onChange={(e) => set("discussao", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Responsáveis *</label>
              <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded p-3 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {advogados.map((a) => {
                  const selected = form.responsaveis_ids.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleResponsavel(a.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                        selected
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-[#E5E7EB] hover:border-gray-400"
                      }`}
                    >
                      {a.nome}
                    </button>
                  );
                })}
              </div>
              {form.responsaveis_ids.length > 0 && (
                <p className="text-gray-400 text-xs mt-1">{form.responsaveis_ids.length} selecionado(s)</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#F8F9FA] hover:bg-gray-100 text-gray-600 font-medium rounded-full transition text-sm border border-[#E5E7EB]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-900 hover:opacity-90 disabled:opacity-50 text-white font-medium rounded-full transition text-sm flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</> : "Salvar processo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
