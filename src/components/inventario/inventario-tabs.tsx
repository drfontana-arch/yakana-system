import Link from "next/link";
import clsx from "clsx";

export function InventarioTabs({ active }: { active: "lanas" | "materiales" }) {
  const tabs = [
    { key: "lanas", label: "Lanas", href: "/inventario" },
    { key: "materiales", label: "Materiales y herramientas", href: "/inventario/materiales" },
  ] as const;

  return (
    <div className="mb-6 flex gap-2 border-b border-linen">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={clsx(
            "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-terracotta text-terracotta"
              : "border-transparent text-charcoal/60 hover:text-navy",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
