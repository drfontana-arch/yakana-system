import {
  LayoutDashboard,
  Palette,
  Calculator,
  SwatchBook,
  PackageSearch,
  FolderKanban,
  BookOpen,
  Smartphone,
  Store,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/estudio", label: "Diagrama", icon: Palette },
  { href: "/calculadora", label: "Calculadora", icon: Calculator },
  { href: "/colores", label: "Colores", icon: SwatchBook },
  { href: "/inventario", label: "Inventario", icon: PackageSearch },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/contenido", label: "Contenido", icon: Smartphone },
  { href: "/tienda", label: "Tienda", icon: Store },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];
