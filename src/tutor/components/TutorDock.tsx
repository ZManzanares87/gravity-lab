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
  const wasOpen = useRef(open);

  // Al abrir, el foco va al campo de escribir. Al cerrar, vuelve al botón cuando ya se ve:
  // en móvil el botón está oculto mientras el panel ocupa la pantalla.
  useEffect(() => {
    if (open) document.getElementById("tutor-mensaje")?.focus();
    else if (wasOpen.current) buttonRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // Al cerrar se vuelve a la simulación: en móvil el tutor la tapaba, y ahí está lo preparado.
  const close = () => {
    setOpen(false);
    document.getElementById("simulacion")?.scrollIntoView({ block: "nearest" });
  };

  return (
    <>
      {/* Móvil: pantalla completa. Tablet: flotante. Escritorio: desplegable bajo la guía, se abre con la barra. */}
      <div
        id="tutor-panel"
        role="region"
        aria-label="Tutor"
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
        className={`${open ? "flex" : "hidden"} fixed inset-0 z-50 flex-col bg-paper p-4 sm:inset-auto sm:right-4 sm:bottom-20 sm:z-40 sm:w-[24rem] sm:border sm:border-ink sm:shadow-lg lg:static lg:mt-4 lg:w-auto lg:shadow-none`}
      >
        {/* En móvil el panel ocupa toda la pantalla: se cierra desde aquí. */}
        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 min-h-11 px-3 font-bold underline underline-offset-4 sm:hidden"
        >
          Cerrar
        </button>
        <TutorPanel />
      </div>

      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="tutor-panel"
        onClick={() => (open ? close() : setOpen(true))}
        className={`fixed right-4 bottom-4 z-50 ${open ? "hidden sm:inline-flex" : "inline-flex"} lg:static lg:mt-4 lg:w-full lg:justify-center lg:shadow-none min-h-12 items-center gap-2 bg-ink px-5 font-bold text-paper shadow-lg hover:bg-ink/85`}
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
