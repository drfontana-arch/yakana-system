import Link from "next/link";
import Image from "next/image";
import { Plus, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { InventarioTabs } from "@/components/inventario/inventario-tabs";
import { createClient } from "@/lib/supabase/server";
import { SUPPLY_CATEGORIES, type Supply } from "@/lib/types/supply";

export default async function MaterialesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("supplies").select("*");

  if (q) {
    query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  }
  if (categoria) {
    query = query.eq("category", categoria);
  }

  query = query.order("category", { ascending: true }).order("name", { ascending: true });

  const { data: supplies } = await query.returns<Supply[]>();

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Tu stock de lanas, materiales y herramientas."
      />
      <InventarioTabs active="materiales" />

      <div className="mb-6 flex flex-wrap items-start justify-end gap-4">
        <Link
          href="/inventario/materiales/nuevo"
          className="flex items-center gap-2 rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
        >
          <Plus size={18} />
          Nuevo material
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
          name="categoria"
          defaultValue={categoria ?? ""}
          className="rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
        >
          <option value="">Todas las categorías</option>
          {SUPPLY_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-yakana border border-linen bg-offwhite px-4 py-2 text-sm font-medium text-navy hover:bg-linen"
        >
          Filtrar
        </button>
      </form>

      {!supplies || supplies.length === 0 ? (
        <div className="rounded-yakana border border-dashed border-linen bg-offwhite p-8 text-center text-sm text-charcoal/70">
          Todavía no cargaste agujas, ganchillos, marcadores ni accesorios.{" "}
          <Link href="/inventario/materiales/nuevo" className="font-medium text-terracotta">
            Agregá el primero
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supplies.map((supply) => {
            const categoryLabel = SUPPLY_CATEGORIES.find(
              (c) => c.value === supply.category,
            )?.label;
            return (
              <Link
                key={supply.id}
                href={`/inventario/materiales/${supply.id}`}
                className="flex gap-4 rounded-yakana border border-linen bg-offwhite p-4 transition-colors hover:border-terracotta"
              >
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-yakana border border-linen"
                  style={{ backgroundColor: supply.color_hex ?? "#e8e0d0" }}
                >
                  {supply.photo_url ? (
                    <Image
                      src={supply.photo_url}
                      alt={supply.name}
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-lg italic text-navy">
                    {supply.name}
                  </p>
                  <p className="truncate text-xs text-charcoal/60">
                    {[supply.brand, categoryLabel].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-charcoal/70">
                    {supply.size_mm != null ? <span>{supply.size_mm} mm</span> : null}
                    {supply.cable_length_cm != null ? (
                      <span>{supply.cable_length_cm} cm cable</span>
                    ) : null}
                    {supply.quantity != null ? <span>{supply.quantity} u.</span> : null}
                    {supply.cost != null ? <span>${supply.cost}</span> : null}
                  </div>
                  {supply.location ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-charcoal/60">
                      <MapPin size={12} />
                      {supply.location}
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
