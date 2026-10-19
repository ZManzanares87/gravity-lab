import type { Metadata } from "next";
import { DataPanel } from "@/lab/components/DataPanel";
import { ExperimentHeader } from "@/lab/components/ExperimentHeader";
import { ExperimentPanel } from "@/lab/components/ExperimentPanel";
import { LabCanvas } from "@/lab/components/LabCanvas";
import { LabChart } from "@/lab/components/LabChart";
import { ParamControls } from "@/lab/components/ParamControls";
import { TutorPanel } from "@/tutor/components/TutorPanel";
import { Disclosure } from "@/ui/Disclosure";

export const metadata: Metadata = {
  title: "Laboratorio",
};

/**
 * Escritorio: simulación y plegables a la izquierda; guía y tutor a la derecha.
 * Móvil: cabecera, simulación, guía, plegables. El lateral ocupa dos filas en
 * escritorio para que el mismo HTML se ordene distinto en cada tamaño.
 */
export default function LabPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <ExperimentHeader />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:items-start">
        <section aria-label="Simulación" className="lg:col-start-1 lg:row-start-1">
          <LabCanvas />
        </section>

        <div className="flex flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <ExperimentPanel />
          <aside aria-label="Tutor" className="border border-ink/20 bg-paper p-4">
            <TutorPanel />
          </aside>
        </div>

        <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-2">
          <Disclosure title="Experimenta tú" hint="cambia los valores del experimento">
            <ParamControls />
          </Disclosure>
          <Disclosure title="Datos avanzados" hint="gráfica, tabla y fórmula">
            <LabChart />
            <DataPanel />
          </Disclosure>
        </div>
      </div>
    </main>
  );
}
