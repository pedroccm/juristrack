import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// List all usuarios (bypasses RLS)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("jt_usuarios")
    .select("*")
    .order("nome");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// Create new usuario
export async function POST(req: NextRequest) {
  const { nome, email, senha, role } = await req.json();

  if (!nome || !email || !senha || !role) {
    return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user: data.user });
}

// Toggle ativo status
export async function PATCH(req: NextRequest) {
  const { id, ativo } = await req.json();

  const { error } = await supabaseAdmin
    .from("jt_usuarios")
    .update({ ativo })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
