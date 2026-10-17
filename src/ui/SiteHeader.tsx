"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Laboratorio" },
  { href: "/galeria", label: "Galería" },
] as const;

/** Una ruta está activa si es la misma o una subpágina (/galeria/lagrange → Galería). */
function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-ink/15 bg-paper">
      <nav
        aria-label="Principal"
        className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-3"
      >
        <span className="mr-auto text-lg font-bold">Gravity Lab</span>
        {LINKS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={active ? "font-bold underline underline-offset-4" : "hover:underline"}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
