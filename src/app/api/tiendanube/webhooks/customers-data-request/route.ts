import { NextRequest, NextResponse } from "next/server";
import { verifyTiendaNubeSignature } from "@/lib/tiendanube/webhook-verify";

// Required by TiendaNube for every app. Fired when a shopper asks for a copy
// of the data an app holds about them. Yakana Studio never stores customer
// data from TiendaNube, so there's nothing to report — just verify and
// acknowledge.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-linkedstore-hmac-sha256");
  if (!verifyTiendaNubeSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
