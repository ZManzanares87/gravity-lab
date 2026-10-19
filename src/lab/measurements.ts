import { accelerations } from "@/physics/gravity";
import type { Body } from "@/physics/types";
import { add, length, scale, sub, ZERO } from "@/physics/vec2";

export interface Measurement {
  readonly id: string;
  readonly name: string;
  readonly mass: number;
  /** Altura sobre la superficie del cuerpo central (null si no hay cuerpo central). */
  readonly altitude: number | null;
  /** Distancia al centro del cuerpo central o, si no hay, al centro de masas. */
  readonly distance: number;
  readonly speed: number;
  readonly acceleration: number;
  /** Fuerza total de la gravedad sobre el cuerpo: su peso, cerca de un planeta. */
  readonly force: number;
}

/** Medidas de cada cuerpo que se mueve, calculadas con el mismo motor que la simulación. */
export function measure(bodies: readonly Body[], G: number, centralId = "tierra"): Measurement[] {
  const allAccelerations = accelerations(bodies, G);
  const central = bodies.find((body) => body.id === centralId);
  const totalMass = bodies.reduce((sum, body) => sum + body.mass, 0);
  const centerOfMass = scale(
    bodies.reduce((sum, body) => add(sum, scale(body.position, body.mass)), ZERO),
    1 / totalMass,
  );
  const reference = central ? central.position : centerOfMass;

  return bodies.flatMap((body, i) => {
    if (body.id === centralId) return [];
    const acceleration = length(allAccelerations[i] ?? ZERO);
    const distance = length(sub(body.position, reference));
    return [
      {
        id: body.id,
        name: body.name,
        mass: body.mass,
        altitude: central ? distance - central.radius - body.radius : null,
        distance,
        speed: length(body.velocity),
        acceleration,
        force: body.mass * acceleration,
      },
    ];
  });
}
