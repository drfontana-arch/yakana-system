import Link from "next/link";
import Image from "next/image";
import { Plus, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { InventarioTabs } from "@/components/inventario/inventario-tabs";
import { createClient } from "@/lib/supabase/server";
import { WEIGHT_CATEGORIES, type Yarn } from "@/lib/types/yarn";

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grosor?: string; sort?: string }>;
}) {
  const { q, grosor, sort } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("yarns").select("*");

  if (q) {
    query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  }
  if (grosor) {
    query = query.eq("weight_category", grosor);
  }

  const sortColumn =
    sort === "brand" ? "brand" : sort === "quantity" ? "quantity_skeins" : "name";
  query = query.order(sortColumn, { ascending: true, nullsFirst: false });

  const { data: yarns } = await query.returns<Yarn[]>();

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Tu stock de lanas, materiales y herramientas."
      />
      <InventarioTabs active="lanas" />

      <div className="mb-6 flex flex-wrap items-start justify-end gap-4">
        <Link
          href="/inventario/nueva"
          className="flex items-center gap-2 rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
        >
          <Plus size={18} />
          Nueva lana
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o marca..."
          className="flex-1 min-w-[200px] rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        />
        <select
          name="grosor"
          defaultValue={grosor ?? ""}
          className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          <option value="">Todos los grosores</option>
          {WEIGHT_CATEGORIES.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort ?? "name"}
          className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          <option value="name">Ordenar: Nombre</option>
          <option value="brand">Ordenar: Marca</option>
          <option value="quantity">Ordenar: Cantidad</option>
        </select>
        <button
          type="submit"
          className="rounded-yakana border border-linen bg-offwhite px-4 py-2 text-sm font-medium text-navy hover:bg-linen"
        >
          Filtrar
        </button>
      </form>

      {!yarns || yarns.length === 0 ? (
        <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-8 text-center text-sm text-charcoal/70">
          Todavía no cargaste ninguna lana.{" "}
          <Link href="/inventario/nueva" className="font-medium text-terracotta">
            Agregá la primera
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {yarns.map((yarn) => {
            const weightLabel = WEIGHT_CATEGORIES.find(
              (w) => w.value === yarn.weight_category,
            )?.label;
            return (
              <Link
                key={yarn.id}
                href={`/inventario/${yarn.id}`}
                className="flex gap-4 rounded-yakana border border-linen bg-offwhite p-4 transition-colors hover:border-terracotta"
              >
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-yakana border border-linen"
                  style={{ backgroundColor: yarn.color_hex ?? "#e8e0d0" }}
                >
                  {yarn.photo_url ? (
                    <Image
                      src={yarn.photo_url}
                      alt={yarn.name}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-lg italic text-navy">
                    {yarn.name}
                  </p>
                  <p className="truncate text-xs text-charcoal/60">
                    {[yarn.brand, weightLabel].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-charcoal/70">
                    {yarn.quantity_skeins != null ? (
                      <span>{yarn.quantity_skeins} madejas</span>
                    ) : null}
                    {yarn.quantity_grams != null ? (
                      <span>{yarn.quantity_grams} g</span>
                    ) : null}
                    {yarn.cost_per_skein != null ? (
                      <span>${yarn.cost_per_skein} / madeja</span>
                    ) : null}
                  </div>
                  {yarn.location ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-charcoal/60">
                      <MapPin size={12} />
                      {yarn.location}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
