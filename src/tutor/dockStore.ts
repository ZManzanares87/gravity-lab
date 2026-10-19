import { create } from "zustand";

/**
 * Estado del panel flotante del tutor. Es estado de interfaz, no del laboratorio:
 * por eso vive aparte del store del laboratorio.
 */
interface TutorDockState {
  readonly open: boolean;
  /** El tutor respondió con el panel cerrado. */
  readonly unread: boolean;
  setOpen(open: boolean): void;
  markUnread(): void;
}

export const useTutorDock = create<TutorDockState>()((set) => ({
  open: false,
  unread: false,
  // Abrir el panel es leer lo que haya.
  setOpen: (open) => set(open ? { open, unread: false } : { open }),
  markUnread: () => set({ unread: true }),
}));
