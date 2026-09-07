import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/tiendanube/client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/tienda?error=Falta+el+código+de+autorización", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const token = await exchangeCodeForToken(code);
    await supabase
      .from("user_profiles")
      .update({
        tiendanube_store_id: String(token.user_id),
        tiendanube_access_token: token.access_token,
      })
      .eq("id", user.id);
    return NextResponse.redirect(new URL("/tienda?connected=1", request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo conectar con TiendaNube.";
    return NextResponse.redirect(new URL(`/tienda?error=${encodeURIComponent(message)}`, request.url));
  }
}
