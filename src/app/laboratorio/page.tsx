import type { Metadata } from "next";
import { DataPanel } from "@/lab/components/DataPanel";
import { ExperimentPanel } from "@/lab/components/ExperimentPanel";
import { LabCanvas } from "@/lab/components/LabCanvas";
import { LabChart } from "@/lab/components/LabChart";
import { LawDialog } from "@/lab/components/LawDialog";
import { ParamControls } from "@/lab/components/ParamControls";
import { SceneNav } from "@/lab/components/SceneNav";
import { TutorPanel } from "@/tutor/components/TutorPanel";

export const metadata: Metadata = {
  title: "Laboratorio",
};

export default function LabPage() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)_300px] lg:items-start">
      <h1 className="sr-only">Laboratorio de gravedad</h1>

      {/* En móvil, la simulación va primero; en escritorio, en la columna central. */}
      <section aria-label="Simulación" className="order-first lg:order-none lg:col-start-2 lg:row-start-1">
        <LabCanvas />
        <LabChart />
        <DataPanel />
      </section>

      <div className="space-y-8 lg:col-start-1 lg:row-start-1">
        <SceneNav />
        <LawDialog />
        <ExperimentPanel />
        <ParamControls />
      </div>

      <aside
        aria-label="Tutor"
        className="border border-ink/20 bg-paper p-4 lg:col-start-3 lg:row-start-1"
      >
        <TutorPanel />
      </aside>
    </main>
  );
}
