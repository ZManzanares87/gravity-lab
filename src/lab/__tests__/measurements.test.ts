import { describe, expect, it } from "vitest";
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

  it("en la Estación Espacial, el peso es un 89 % del peso en el suelo", () => {
    const altitude = SCENES.altura;
    const [ground] = measure(altitude.buildBodies({ altitude: 0.01, objectMass: 1 }), altitude.G);
    const [station] = measure(altitude.buildBodies({ altitude: 400, objectMass: 1 }), altitude.G);
    expect(station!.force / ground!.force).toBeCloseTo(0.885, 2);
  });
});

describe("medidas tras un contacto", () => {
  it("la altura y la velocidad de un cuerpo apoyado son exactamente 0, sin ruido numérico", async () => {
    const { advance, createSimulation, snapshot } = await import("@/physics/simulation");
    const scene = SCENES.lanzamiento;
    const params = { speed: 3, angle: 0, launchAltitude: 500 };
    const { simulation, contacts } = advance(createSimulation(scene.buildBodies(params), scene.run!.physics), 3600);
    expect(contacts).toHaveLength(1);

    const [projectile] = measure(snapshot(simulation).bodies, scene.G);
    expect(projectile!.altitude).toBe(0);
    expect(projectile!.speed).toBe(0);
  });
});
