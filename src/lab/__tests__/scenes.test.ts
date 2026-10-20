import { describe, expect, it } from "vitest";
import { EARTH_RADIUS } from "@/physics/constants";
import { advance, createSimulation, snapshot } from "@/physics/simulation";
import type { Body } from "@/physics/types";
import { length, sub } from "@/physics/vec2";
import { SCENES } from "../scenes";

function runScene(bodies: Body[], scene: { run: { physics: { G: number; dt: number } } }, seconds: number) {
  const physics = scene.run.physics;
  return advance(createSimulation(bodies, physics), Math.round(seconds / physics.dt));
}

const launch = (speed: number, angle = 0) =>
  SCENES.lanzamiento.buildBodies({ speed, angle, launchAltitude: 500 });

describe("escenas del laboratorio", () => {
  it("Superficie: las dos bolas llegan a la vez, aunque una sea mucho más grande", () => {
    const scene = SCENES.superficie;
    const { contacts } = runScene(scene.buildBodies(scene.defaults), scene, 10);
    expect(contacts).toHaveLength(2);
  });

  it("Superficie: lanzadas hacia arriba, siguen llegando a la vez", () => {
    const scene = SCENES.superficie;
    const { contacts } = runScene(scene.buildBodies({ ...scene.defaults, upSpeed: 15 }), scene, 10);
    expect(contacts).toHaveLength(2);
  });

  it("Lanzamiento: a 2 km/s el proyectil cae", () => {
    const { contacts } = runScene(launch(2), SCENES.lanzamiento, 3 * 3600);
    expect(contacts[0]?.bodyId).toBe("proyectil");
  });

  it("Lanzamiento: a 7,6 km/s en horizontal da una vuelta completa sin caer", () => {
    // Una órbita a 500 km dura unos 95 minutos: simulamos 100.
    const { contacts, simulation } = runScene(launch(7.6), SCENES.lanzamiento, 100 * 60);
    expect(contacts).toEqual([]);
    const [earth, projectile] = snapshot(simulation).bodies;
    expect(length(sub(projectile!.position, earth!.position))).toBeGreaterThan(EARTH_RADIUS);
  });

  it("Lanzamiento: a 7,6 km/s pero apuntando 30° hacia abajo, cae", () => {
    const { contacts } = runScene(launch(7.6, -30), SCENES.lanzamiento, 100 * 60);
    expect(contacts[0]?.bodyId).toBe("proyectil");
  });

  it("Lanzamiento: a 12 km/s el proyectil escapa", () => {
    const { simulation } = runScene(launch(12), SCENES.lanzamiento, 6 * 3600);
    const [earth, projectile] = snapshot(simulation).bodies;
    // Tras 6 horas está a más de 20 radios terrestres y alejándose.
    expect(length(sub(projectile!.position, earth!.position))).toBeGreaterThan(20 * EARTH_RADIUS);
  });

  it("Tercer cuerpo: sin tercera estrella, la binaria vuelve a su punto de partida", () => {
    const scene = SCENES["tercer-cuerpo"];
    const bodies = scene.buildBodies(scene.defaults);
    expect(bodies).toHaveLength(2);
    // Periodo de la órbita circular: 2π · 0,5 / √0,5 = π · √2.
    const { simulation } = runScene(bodies, scene, Math.PI * Math.SQRT2);
    const [a] = snapshot(simulation).bodies;
    expect(length(sub(a!.position, bodies[0]!.position))).toBeLessThan(1e-3);
  });

  it("Tercer cuerpo: con masa mayor que 0 aparece la tercera estrella", () => {
    const scene = SCENES["tercer-cuerpo"];
    expect(scene.buildBodies({ ...scene.defaults, thirdMass: 0.5 })).toHaveLength(3);
  });
});

describe("vista de Lanzamiento", () => {
  it("la órbita elíptica de la captura (7,86 km/s, −7,77°) cabe entera en la vista", () => {
    const scene = SCENES.lanzamiento;
    const params = { speed: 7.86, angle: -7.77, launchAltitude: 500 };
    const extent = scene.view(params).maxX;

    // Simulamos 4 horas (más de dos vueltas) y medimos la distancia máxima al centro.
    let simulation = createSimulation(scene.buildBodies(params), scene.run.physics);
    let farthest = 0;
    for (let minute = 0; minute < 240; minute++) {
      simulation = advance(simulation, 60).simulation;
      const [earth, projectile] = snapshot(simulation).bodies;
      farthest = Math.max(farthest, length(sub(projectile!.position, earth!.position)));
    }
    expect(farthest).toBeLessThan(extent);
  });
});
