"use client";

import { useEffect, useRef } from "react";
import { useTutorDock } from "../dockStore";
import { TutorPanel } from "./TutorPanel";

/**
 * Botón fijo "Habla con tu tutor" y su panel. El chat queda siempre montado
 * (solo se oculta): la conversación no se pierde y el tutor puede responder
 * con el panel cerrado.
 */
export function TutorDock() {
  const open = useTutorDock((state) => state.open);
  const unread = useTutorDock((state) => state.unread);
  const setOpen = useTutorDock((state) => state.setOpen);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Al abrir, el foco va al campo de escribir.
  useEffect(() => {
    if (open) document.getElementById("tutor-mensaje")?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      <div
        id="tutor-panel"
        role="region"
        aria-label="Tutor"
        hidden={!open}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
        className="fixed inset-x-2 bottom-20 z-40 border border-ink bg-paper p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:w-[24rem]"
      >
        <TutorPanel />
      </div>

      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="tutor-panel"
        onClick={() => (open ? close() : setOpen(true))}
        className="fixed right-4 bottom-4 z-50 inline-flex min-h-12 items-center gap-2 bg-ink px-5 font-bold text-paper shadow-lg hover:bg-ink/85"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
        {open ? "Cerrar tutor" : unread ? "El tutor te ha escrito" : "Habla con tu tutor"}
        {!open && unread && <span aria-hidden="true" className="size-2.5 rounded-full bg-body-b" />}
      </button>

      {/* El aviso del chat no se oye con el panel oculto: este sí. */}
      <p className="sr-only" aria-live="polite">
        {unread ? "El tutor te ha escrito." : ""}
      </p>
    </>
  );
}
