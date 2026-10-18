import { describe, expect, it } from "vitest";
import { EARTH_RADIUS } from "@/physics/constants";
import { advance, createSimulation, snapshot } from "@/physics/simulation";
import type { Body } from "@/physics/types";
import { length, sub } from "@/physics/vec2";
import { SCENES } from "../scenes";

function runScene(bodies: Body[], scene: { run?: { physics: { G: number; dt: number } } }, seconds: number) {
  const physics = scene.run!.physics;
  return advance(createSimulation(bodies, physics), Math.round(seconds / physics.dt));
}

describe("escenas del laboratorio", () => {
  it("Superficie: las dos bolas llegan a la vez, aunque una sea mucho más grande", () => {
    const scene = SCENES.superficie;
    const { contacts } = runScene(scene.buildBodies(scene.defaults), scene, 10);
    expect(contacts).toHaveLength(2);
  });

  it("Lanzamiento: a 2 km/s el proyectil cae", () => {
    const scene = SCENES.lanzamiento;
    const { contacts } = runScene(scene.buildBodies({ speed: 2 }), scene, 3 * 3600);
    expect(contacts[0]?.bodyId).toBe("proyectil");
  });

  it("Lanzamiento: a 7,6 km/s el proyectil da una vuelta completa sin caer", () => {
    const scene = SCENES.lanzamiento;
    // Una órbita a 500 km dura unos 95 minutos: simulamos 100.
    const { contacts, simulation } = runScene(scene.buildBodies({ speed: 7.6 }), scene, 100 * 60);
    expect(contacts).toEqual([]);
    const [earth, projectile] = snapshot(simulation).bodies;
    expect(length(sub(projectile!.position, earth!.position))).toBeGreaterThan(EARTH_RADIUS);
  });

  it("Lanzamiento: a 12 km/s el proyectil escapa", () => {
    const scene = SCENES.lanzamiento;
    const { simulation } = runScene(scene.buildBodies({ speed: 12 }), scene, 6 * 3600);
    const [earth, projectile] = snapshot(simulation).bodies;
    // Tras 6 horas está a más de 20 radios terrestres y alejándose.
    expect(length(sub(projectile!.position, earth!.position))).toBeGreaterThan(20 * EARTH_RADIUS);
  });

  it("Tercer cuerpo: sin tercera estrella, la binaria vuelve a su punto de partida", () => {
    const scene = SCENES["tercer-cuerpo"];
    const bodies = scene.buildBodies({ thirdMass: 0 });
    expect(bodies).toHaveLength(2);
    // Periodo de la órbita circular: 2π · 0,5 / √0,5 = π · √2.
    const { simulation } = runScene(bodies, scene, Math.PI * Math.SQRT2);
    const [a] = snapshot(simulation).bodies;
    expect(length(sub(a!.position, bodies[0]!.position))).toBeLessThan(1e-3);
  });

  it("Tercer cuerpo: con masa mayor que 0 aparece la tercera estrella", () => {
    expect(SCENES["tercer-cuerpo"].buildBodies({ thirdMass: 0.5 })).toHaveLength(3);
  });
});
