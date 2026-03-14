import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  // Verify the JWT and get user
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Query jt_usuarios with service role (bypasses RLS)
  const { data: userData, error: dbErr } = await supabaseAdmin
    .from("jt_usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  if (dbErr || !userData) {
    return NextResponse.json({ error: dbErr?.message || "User not found in jt_usuarios" }, { status: 404 });
  }

  return NextResponse.json(userData);
}
