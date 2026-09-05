"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import clsx from "clsx";
import { navItems } from "@/lib/nav-items";
import { signOut } from "@/lib/actions/auth";

export function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile / tablet top bar */}
      <div className="flex items-center justify-between border-b border-linen bg-offwhite px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/yakana-logo.png"
            alt="Yakana — Tejido Artesanal"
            width={32}
            height={32}
            className="rounded-full"
          />
          <span className="font-heading text-lg italic text-navy">Yakana</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-navy hover:bg-linen"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <aside
        className={clsx(
          "border-linen bg-offwhite lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r",
          open ? "flex flex-col" : "hidden",
        )}
      >
        <div className="hidden items-center gap-3 border-b border-linen px-5 py-6 lg:flex">
          <Image
            src="/brand/yakana-logo.png"
            alt="Yakana — Tejido Artesanal"
            width={44}
            height={44}
            className="rounded-full"
          />
          <div>
            <p className="font-heading text-xl italic leading-tight text-navy">Yakana</p>
            <p className="text-xs tracking-wide text-charcoal/60">Tejido Artesanal</p>
          </div>
        </div>
        <div className="andean-divider hidden lg:block" />

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-yakana px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-terracotta text-offwhite"
                    : "text-navy hover:bg-linen",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {userEmail ? (
          <div className="border-t border-linen px-3 py-4">
            <p className="truncate px-3 text-xs text-charcoal/60">{userEmail}</p>
            <form action={signOut}>
              <button
                type="submit"
                className="mt-1 flex w-full items-center gap-3 rounded-yakana px-3 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-linen"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : null}
      </aside>
    </>
  );
}
