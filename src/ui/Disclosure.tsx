import type { ReactNode } from "react";

/**
 * Sección plegable con <details> nativo: teclado, foco y lectores de pantalla
 * funcionan sin JavaScript. Lo técnico queda a un clic, no delante.
 */
export function Disclosure({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <details className="group border border-ink/20 bg-paper open:border-ink">
      <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 py-3 font-bold">
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
        {title}
        <span className="font-normal text-ink-soft">· {hint}</span>
      </summary>
      <div className="px-4 pb-5">{children}</div>
    </details>
  );
}
