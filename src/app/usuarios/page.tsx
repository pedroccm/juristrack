"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/layout/sidebar";
import { Plus, Loader2, UserCheck, UserX } from "lucide-react";
import type { Usuario } from "@/lib/types";
import { useRouter } from "next/navigation";
import NovoUsuarioModal from "./novo-usuario-modal";

export default function UsuariosPage() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push("/login"); return; }

    const { data: userData } = await supabase
      .from("jt_usuarios").select("*").eq("id", authUser.id).single();

    if (!userData || userData.role !== "admin") { router.push("/dashboard"); return; }
    setUser(userData);

    const { data } = await supabase
      .from("jt_usuarios").select("*").order("nome");
    setUsuarios(data || []);
    setLoading(false);
  }

  async function toggleAtivo(u: Usuario) {
    await supabase.from("jt_usuarios").update({ ativo: !u.ativo }).eq("id", u.id);
    loadData();
  }

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
            <h1 className="text-2xl font-bold text-white">Usuários</h1>
            <p className="text-slate-400 mt-1">{usuarios.length} usuários cadastrados</p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo usuário
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">E-mail</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Perfil</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{u.nome[0]?.toUpperCase()}</span>
                      </div>
                      <span className="text-white text-sm font-medium">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-sm">{u.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      u.role === "admin"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-slate-700 text-slate-300"
                    }`}>
                      {u.role === "admin" ? "Admin" : "Advogado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium w-fit ${u.ativo ? "text-green-400" : "text-slate-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? "bg-green-400" : "bg-slate-600"}`} />
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== user!.id && (
                      <button
                        onClick={() => toggleAtivo(u)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title={u.ativo ? "Desativar" : "Ativar"}
                      >
                        {u.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {modalAberto && (
        <NovoUsuarioModal
          onClose={() => setModalAberto(false)}
          onSaved={() => { setModalAberto(false); loadData(); }}
        />
      )}
    </div>
  );
}
