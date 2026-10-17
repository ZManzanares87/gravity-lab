"use client";

import { useEffect } from "react";
import { solutionCardId } from "../cardId";
import { useGalleryStore } from "../galleryStore";

/** En la página de detalle: recuerda qué solución se ha abierto. */
export function RememberOpenedSolution({ slug }: { slug: string }) {
  const setLastOpened = useGalleryStore((state) => state.setLastOpened);
  useEffect(() => {
    setLastOpened(slug);
  }, [setLastOpened, slug]);
  return null;
}

/**
 * En la galería: devuelve el foco a la tarjeta de la última solución
 * abierta. focus() además desplaza la página hasta ella, así que funciona
 * igual con el botón Atrás que con el enlace "Volver a la galería".
 */
export function RestoreGalleryFocus() {
  useEffect(() => {
    const slug = useGalleryStore.getState().lastOpenedSlug;
    if (slug) document.getElementById(solutionCardId(slug))?.focus();
  }, []);
  return null;
}
