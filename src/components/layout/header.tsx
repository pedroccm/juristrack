"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/processos", label: "Processos" },
  { href: "/usuarios", label: "Usuários", adminOnly: true },
];

interface HeaderProps {
  role: "admin" | "advogado";
  nome: string;
}

export default function Header({ role, nome }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = navItems.filter((i) => !i.adminOnly || role === "admin");

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-12 bg-white border-b border-[#E5E7EB] flex items-center px-6 justify-between flex-shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white font-serif font-bold text-xs leading-none">J</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif font-semibold text-sm text-gray-900 tracking-tight">JurisTrack</span>
          <span className="text-[10px] text-gray-400">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex gap-1 items-center">
        {visibleItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div
          className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0"
          style={{ fontSize: 10 }}
        >
          {nome[0]?.toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
