import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { WatermarkPreview } from "@/components/configuracion/watermark-preview";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/actions/profile";

type Profile = {
  name: string | null;
  brand_name: string | null;
  default_hourly_rate: number | null;
  markup_factor: number | null;
  waste_allowance_pct: number | null;
  watermark_position: string | null;
  watermark_opacity: number | null;
  preferred_language: string | null;
  tiendanube_store_id: string | null;
};

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Perfil, tarifas, marca de agua e integraciones."
      />

      {saved ? (
        <p className="mb-4 rounded-yakana border border-olive/30 bg-olive/10 px-3 py-2 text-sm text-olive">
          Cambios guardados ✓
        </p>
      ) : null}

      <form action={updateProfile} className="max-w-2xl space-y-6">
        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Perfil</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" name="name" defaultValue={profile?.name ?? ""} />
            <Field
              label="Nombre de marca"
              name="brand_name"
              defaultValue={profile?.brand_name ?? "Yakana"}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Email</label>
              <input
                disabled
                value={user.email ?? ""}
                className="w-full rounded-yakana border border-linen bg-linen/30 px-3 py-2 text-sm text-charcoal/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Idioma</label>
              <select
                name="preferred_language"
                defaultValue={profile?.preferred_language ?? "es"}
                className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-charcoal/50">
            Por ahora toda la aplicación está en español — este selector queda guardado para
            cuando sumemos la traducción completa.
          </p>
        </section>

        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Tarifas y costos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tarifa horaria por defecto ($)"
              name="default_hourly_rate"
              type="number"
              step="0.01"
              defaultValue={profile?.default_hourly_rate ?? ""}
            />
            <Field
              label="Markup de precio (multiplicador)"
              name="markup_factor"
              type="number"
              step="0.1"
              defaultValue={profile?.markup_factor ?? 3.0}
            />
            <Field
              label="Merma de lana por defecto (%)"
              name="waste_allowance_pct"
              type="number"
              step="1"
              defaultValue={profile?.waste_allowance_pct ?? 10.0}
            />
          </div>
          <p className="mt-2 text-xs text-charcoal/50">
            Se usan como valores iniciales al crear un proyecto nuevo y al calcular en la
            Calculadora — siempre los podés cambiar puntualmente en cada uno.
          </p>
        </section>

        <section className="rounded-yakana border border-linen bg-offwhite p-4">
          <h2 className="mb-3 font-heading text-lg italic text-navy">Marca de agua</h2>
          <WatermarkPreview
            initialPosition={profile?.watermark_position ?? "bottom-right"}
            initialOpacity={profile?.watermark_opacity ?? 0.3}
          />
          <p className="mt-3 text-xs text-charcoal/50">
            Todavía no exportamos PDFs ni imágenes con marca de agua — esta preferencia queda
            guardada para cuando construyamos esa parte.
          </p>
        </section>

        <button
          type="submit"
          className="rounded-yakana bg-terracotta px-5 py-2.5 text-sm font-medium text-offwhite hover:bg-terracotta-dark"
        >
          Guardar cambios
        </button>
      </form>

      <section className="mt-6 max-w-2xl rounded-yakana border border-linen bg-offwhite p-4">
        <h2 className="mb-2 font-heading text-lg italic text-navy">Tallas personalizadas</h2>
        <p className="text-sm text-charcoal/70">
          Se editan directamente desde la{" "}
          <Link href="/calculadora" className="font-medium text-terracotta">
            Calculadora
          </Link>
          : elegí una talla, ajustá sus medidas, y usá &quot;Guardar cambios en esta talla&quot;.
        </p>
      </section>

      <section className="mt-6 max-w-2xl rounded-yakana border border-dashed border-linen bg-offwhite p-4">
        <h2 className="mb-2 font-heading text-lg italic text-navy">TiendaNube</h2>
        <p className="text-sm text-charcoal/60">
          {profile?.tiendanube_store_id
            ? "Tienda conectada."
            : "Todavía no conectaste tu tienda — lo armamos en la última etapa del proyecto, cuando tengas las credenciales de desarrollador de TiendaNube."}
        </p>
      </section>
    </div>
  );
}
