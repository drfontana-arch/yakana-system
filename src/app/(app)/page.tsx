import { PageHeader } from "@/components/ui/page-header";

const stats = [
  { label: "Proyectos activos", value: "—" },
  { label: "Completados este mes", value: "—" },
  { label: "Valor del stock de lanas", value: "—" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen de tus proyectos, tiempo de trabajo y actividad reciente."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-yakana border border-linen bg-offwhite p-5"
          >
            <p className="text-xs uppercase tracking-wide text-charcoal/60">
              {stat.label}
            </p>
            <p className="mt-2 font-heading text-3xl text-navy">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-yakana border border-dashed border-linen bg-offwhite p-6 text-sm text-charcoal/80">
        Cuando conectemos la base de datos vas a ver acá tus proyectos en curso,
        el cronómetro de la última sesión de trabajo y la actividad reciente.
      </div>
    </div>
  );
}
