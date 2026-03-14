import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("jt_monitoramentos")
    .select("*")
    .order("iniciado_em", { ascending: false })
    .limit(1)
    .single();

  if (error) return NextResponse.json(null);
  return NextResponse.json(data);
}
