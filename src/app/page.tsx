import type { Metadata } from "next";
import { LabCanvas } from "@/lab/components/LabCanvas";
import { SceneNav } from "@/lab/components/SceneNav";

export const metadata: Metadata = {
  title: "Laboratorio",
};

export default function LabPage() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
      <h1 className="sr-only">Laboratorio de gravedad</h1>

      {/* En móvil, la simulación va primero; en escritorio, en la columna central. */}
      <section aria-label="Simulación" className="order-first lg:order-none lg:col-start-2">
        <LabCanvas />
      </section>

      <aside aria-label="Experimentos" className="lg:col-start-1 lg:row-start-1">
        <SceneNav />
      </aside>

      <aside aria-label="Tutor" className="border border-dashed border-ink/30 p-4 text-ink-soft">
        El tutor llegará en el siguiente paso.
      </aside>
    </main>
  );
}
