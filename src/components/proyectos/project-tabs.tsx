"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/proyectos/${projectId}`;

  const tabs = [
    { href: base, label: "Resumen" },
    { href: `${base}/registro`, label: "Registro" },
    { href: `${base}/fotos`, label: "Fotos y bocetos" },
    { href: `${base}/tiempo`, label: "Tiempo" },
    { href: `${base}/costos`, label: "Costos" },
    { href: `${base}/patron`, label: "Patrón" },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-linen">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={clsx(
            "border-b-2 px-1 pb-2 text-sm font-medium transition-colors",
            pathname === tab.href
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
