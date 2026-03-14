"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-gray-900 rounded mb-4">
            <span className="text-white font-serif font-bold text-lg leading-none">J</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900 tracking-tight">JurisTrack</h1>
          <p className="text-gray-500 text-sm mt-1">Monitoramento de processos jurídicos</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E5E7EB] rounded p-8 shadow-sm">
          <h2 className="font-serif font-semibold text-lg text-gray-900 mb-6">Entrar na conta</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded px-3 py-2.5 text-red-600 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium py-2.5 px-4 rounded-full transition mt-1"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">v{process.env.NEXT_PUBLIC_APP_VERSION}</p>
      </div>
    </div>
  );
}
