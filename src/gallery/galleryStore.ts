import { create } from "zustand";

interface GalleryState {
  /** La última solución que se abrió en detalle, para devolverle el foco. */
  readonly lastOpenedSlug: string | null;
  setLastOpened(slug: string): void;
}

export const useGalleryStore = create<GalleryState>()((set) => ({
  lastOpenedSlug: null,
  setLastOpened: (slug) => set({ lastOpenedSlug: slug }),
}));
