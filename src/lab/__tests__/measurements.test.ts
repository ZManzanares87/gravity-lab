import { describe, expect, it } from "vitest";
import { EARTH_RADIUS } from "@/physics/constants";
import { measure } from "../measurements";
import { SCENES } from "../scenes";

describe("medidas", () => {
  const surface = SCENES.superficie;
  const [bowling, tennis] = measure(surface.buildBodies(surface.defaults), surface.G);

  it("la bola de bolos pesa unos 68,7 N y la pelota unos 0,57 N", () => {
    expect(bowling!.force).toBeCloseTo(68.7, 0);
    expect(tennis!.force).toBeCloseTo(0.57, 2);
  });

  it("las dos aceleran igual, a unos 9,8 m/s²", () => {
    expect(bowling!.acceleration).toBeCloseTo(9.82, 1);
    expect(bowling!.acceleration).toBeCloseTo(tennis!.acceleration, 4);
  });

  it("la altura se mide desde la parte de abajo de cada bola", () => {
    expect(bowling!.altitude).toBeCloseTo(10, 6);
    expect(tennis!.altitude).toBeCloseTo(10, 6);
  });

  it("al doble de distancia del centro de la Tierra, la fuerza es un cuarto", () => {
    const launch = SCENES.lanzamiento;
    const [ground] = measure(launch.buildBodies({ speed: 0, angle: 0, launchAltitude: 0 }), launch.G);
    const [far] = measure(
      launch.buildBodies({ speed: 0, angle: 0, launchAltitude: EARTH_RADIUS / 1000 }),
      launch.G,
    );
    expect(far!.force / ground!.force).toBeCloseTo(0.25, 6);
  });
});

describe("medidas tras un contacto", () => {
  it("la altura y la velocidad de un cuerpo apoyado son exactamente 0, sin ruido numérico", async () => {
    const { advance, createSimulation, snapshot } = await import("@/physics/simulation");
    const scene = SCENES.lanzamiento;
    const params = { speed: 3, angle: 0, launchAltitude: 500 };
    const { simulation, contacts } = advance(createSimulation(scene.buildBodies(params), scene.run.physics), 3600);
    expect(contacts).toHaveLength(1);

    const [projectile] = measure(snapshot(simulation).bodies, scene.G);
    expect(projectile!.altitude).toBe(0);
    expect(projectile!.speed).toBe(0);
  });
});
