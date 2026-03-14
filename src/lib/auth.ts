import { supabase } from "./supabase";
import type { Usuario } from "./types";

export async function getAuthUser(): Promise<{ session: { user: { id: string }; access_token: string } | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  return { session };
}

export async function getUsuario(accessToken: string): Promise<Usuario | null> {
  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}
