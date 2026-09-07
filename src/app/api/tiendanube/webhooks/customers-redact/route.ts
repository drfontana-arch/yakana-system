import { NextRequest, NextResponse } from "next/server";
import { verifyTiendaNubeSignature } from "@/lib/tiendanube/webhook-verify";

// Required by TiendaNube for every app. Fired when a shopper asks a merchant
// to delete their personal data. Yakana Studio never stores customer data
// from TiendaNube (only product/order info shown transiently), so there's
// nothing to erase here — just verify and acknowledge.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-linkedstore-hmac-sha256");
  if (!verifyTiendaNubeSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
