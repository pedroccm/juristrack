"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function NovoUsuarioModal({ onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "advogado" });
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao criar usuário.");
      setLoading(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E5E7EB] rounded shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-serif font-semibold text-gray-900">Novo usuário</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome completo *</label>
            <input
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">E-mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Senha inicial *</label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => set("senha", e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Perfil *</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="advogado">Advogado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2.5 text-red-600 text-xs">
              {error}
            </div>
          )}

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
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Criando...</> : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
