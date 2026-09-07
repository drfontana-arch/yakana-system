const API_VERSION = "2025-03";
const APP_USER_AGENT = "Yakana Studio (dr.fontana@gmail.com)";

export function getAuthorizeUrl(): string | null {
  const clientId = process.env.TIENDANUBE_CLIENT_ID;
  if (!clientId) return null;
  return `https://www.tiendanube.com/apps/${clientId}/authorize`;
}

export function isTiendaNubeConfigured(): boolean {
  return Boolean(process.env.TIENDANUBE_CLIENT_ID && process.env.TIENDANUBE_CLIENT_SECRET);
}

export async function exchangeCodeForToken(
  code: string,
): Promise<{ access_token: string; user_id: string | number; scope: string }> {
  const clientId = process.env.TIENDANUBE_CLIENT_ID;
  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Todavía no están configuradas las credenciales de TiendaNube.");
  }

  const res = await fetch("https://www.tiendanube.com/apps/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
    }),
  });

  if (!res.ok) {
    throw new Error("TiendaNube rechazó la conexión — probá conectar de nuevo.");
  }
  return res.json();
}

export type TiendaNubeOrder = {
  id: number;
  number: number;
  contact_name: string;
  total: string;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
};

export async function listRecentOrders(
  storeId: string,
  accessToken: string,
): Promise<TiendaNubeOrder[]> {
  return tiendanubeFetch<TiendaNubeOrder[]>(
    storeId,
    accessToken,
    "/orders?per_page=10&sort_by=created-at-descending",
  );
}

export async function tiendanubeFetch<T = unknown>(
  storeId: string,
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`https://api.tiendanube.com/${API_VERSION}/${storeId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": APP_USER_AGENT,
      "Content-Type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TiendaNube respondió con un error (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}
