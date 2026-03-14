"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/header";
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
    if (!userData || userData.role !== "admin") { router.push("/dashboard"); return; }
    setUser(userData);

    const { data } = await supabase
      .from("jt_usuarios").select("*").order("nome");
    setUsuarios(data || []);
    setLoading(false);
  }

  async function toggleAtivo(u: Usuario) {
    await supabase.from("jt_usuarios").update({ ativo: !u.ativo }).eq("id", u.id);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) loadData(session.user.id);
  }

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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-gray-900 tracking-tight">Usuários</h1>
              <p className="text-gray-500 text-sm mt-0.5">{usuarios.length} usuários cadastrados</p>
            </div>
            <button
              onClick={() => setModalAberto(true)}
              className="inline-flex items-center gap-2 bg-gray-900 hover:opacity-90 text-white text-xs font-medium px-4 py-2 rounded-full transition"
            >
              <Plus className="w-3.5 h-3.5" /> Novo usuário
            </button>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border border-[#E5E7EB]">
                          <span className="text-gray-600 text-xs font-bold">{u.nome[0]?.toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{u.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-500">{u.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        u.role === "admin"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>
                        {u.role === "admin" ? "Admin" : "Advogado"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.ativo ? "text-green-600" : "text-gray-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.ativo ? "bg-green-400" : "bg-gray-300"}`} />
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.id !== user!.id && (
                        <button
                          onClick={() => toggleAtivo(u)}
                          className="text-gray-300 hover:text-gray-600 transition-colors"
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
        </div>
      </main>

      {modalAberto && (
        <NovoUsuarioModal
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
