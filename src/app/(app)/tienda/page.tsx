import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizeUrl, isTiendaNubeConfigured, listRecentOrders } from "@/lib/tiendanube/client";
import { disconnectTiendaNube } from "@/lib/actions/tiendanube";
import { PublishButton } from "@/components/tienda/publish-button";
import { PROJECT_TYPES } from "@/lib/types/project";
import type { Project } from "@/lib/types/project";

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("user_profiles")
        .select("tiendanube_store_id, tiendanube_access_token")
        .eq("id", user.id)
        .single<{ tiendanube_store_id: string | null; tiendanube_access_token: string | null }>()
    : { data: null };

  const isConnected = Boolean(profile?.tiendanube_store_id && profile?.tiendanube_access_token);
  const configured = isTiendaNubeConfigured();

  let orders: Awaited<ReturnType<typeof listRecentOrders>> = [];
  let ordersError = "";
  if (isConnected && profile) {
    try {
      orders = await listRecentOrders(profile.tiendanube_store_id!, profile.tiendanube_access_token!);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron traer los pedidos.";
      // TiendaNube returns a 404 "Last page is 0" instead of an empty array
      // when the store has no orders yet — that's not a real error.
      if (!message.includes("Last page is 0")) ordersError = message;
    }
  }

  const { data: projects } = isConnected
    ? await supabase
        .from("projects")
        .select("id, name, type, status, tiendanube_product_id")
        .order("updated_at", { ascending: false })
        .returns<Pick<Project, "id" | "name" | "type" | "status" | "tiendanube_product_id">[]>()
    : { data: null };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tienda"
        description="Sincronización con TiendaNube: publicar productos y ver pedidos."
      />

      {connected ? (
        <p className="rounded-yakana border border-olive/30 bg-olive/10 p-3 text-sm text-olive">
          Conectado con TiendaNube ✓
        </p>
      ) : null}
      {error ? (
        <p className="rounded-yakana border border-terracotta/30 bg-terracotta/5 p-3 text-sm text-terracotta">
          {error}
        </p>
      ) : null}

      {!configured ? (
        <p className="rounded-yakana border border-dashed border-linen bg-offwhite p-4 text-sm text-charcoal/60">
          Todavía no están cargadas las credenciales de TiendaNube (Client ID y Client Secret) en
          este proyecto. Una vez que las tengas, pedime que sigamos con la conexión.
        </p>
      ) : !isConnected ? (
        <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-4">
          <p className="mb-3 text-sm text-charcoal/70">
            Conectá tu tienda de TiendaNube para poder publicar tus proyectos como productos y ver
            los pedidos acá mismo.
          </p>
          <Link
            href={getAuthorizeUrl() ?? "#"}
            className="inline-block rounded-yakana bg-terracotta px-4 py-2 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
          >
            Conectar con TiendaNube
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-yakana border border-linen bg-offwhite p-4">
            <p className="text-sm text-charcoal/70">
              Tienda conectada — ID <span className="font-medium text-navy">{profile?.tiendanube_store_id}</span>
            </p>
            <form action={disconnectTiendaNube}>
              <button type="submit" className="text-xs font-medium text-terracotta hover:underline">
                Desconectar
              </button>
            </form>
          </div>

          <section>
            <h2 className="mb-3 font-heading text-lg italic text-navy">Publicar proyectos</h2>
            {!projects || projects.length === 0 ? (
              <p className="text-sm text-charcoal/60">Todavía no tenés proyectos para publicar.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-yakana border border-linen bg-offwhite p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy">{p.name}</p>
                      <p className="text-xs text-charcoal/60">
                        {PROJECT_TYPES.find((t) => t.value === p.type)?.label ?? "Sin tipo"} ·{" "}
                        {p.tiendanube_product_id ? "Publicado en la tienda" : "Sin publicar"}
                      </p>
                    </div>
                    <PublishButton projectId={p.id} alreadyPublished={Boolean(p.tiendanube_product_id)} />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-charcoal/50">
              El precio se toma del cálculo de costos de cada proyecto (materiales + mano de obra ×
              tu margen). Las fotos publicadas en &ldquo;Fotos y bocetos&rdquo; se suben como
              imágenes del producto.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg italic text-navy">Pedidos recientes</h2>
            {ordersError ? (
              <p className="text-sm text-terracotta">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-charcoal/60">Todavía no tenés pedidos.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-yakana border border-linen bg-offwhite p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-navy">
                        Pedido #{o.number} — {o.contact_name}
                      </p>
                      <p className="text-xs text-charcoal/60">
                        {new Date(o.created_at).toLocaleDateString("es-AR")} · {o.payment_status}
                      </p>
                    </div>
                    <span className="font-medium text-navy">
                      {o.currency} {o.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
