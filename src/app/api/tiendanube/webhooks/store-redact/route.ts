import { NextRequest, NextResponse } from "next/server";
import { verifyTiendaNubeSignature } from "@/lib/tiendanube/webhook-verify";

// Required by TiendaNube for every app. Fired when a merchant asks TiendaNube
// to delete their store's data. Yakana Studio doesn't keep a copy of any
// TiendaNube store data beyond the connection itself, so there's nothing to
// erase here — just verify and acknowledge.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-linkedstore-hmac-sha256");
  if (!verifyTiendaNubeSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
