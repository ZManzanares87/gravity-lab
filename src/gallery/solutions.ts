import type { Body, PhysicsConfig, Vec2 } from "@/physics/types";
import { vec, ZERO } from "@/physics/vec2";

/**
 * Las seis soluciones periódicas del problema de los tres cuerpos.
 * Unidades abstractas: G = 1 y las tres masas valen 1.
 */
export const GALLERY_PHYSICS: PhysicsConfig = { G: 1, dt: 1e-4 };

export interface Source {
  readonly label: string;
  readonly url?: string;
}

export interface ThreeBodySolution {
  /** Identificador para la URL: /galeria/<slug>. */
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  /** Tiempo que tarda la órbita en repetirse. */
  readonly period: number;
  readonly bodies: readonly Body[];
  readonly source: Source;
  /** Limitaciones conocidas: estabilidad, precisión de los datos. */
  readonly notes?: string;
}

type Triple = readonly [Vec2, Vec2, Vec2];

function threeBodies([p1, p2, p3]: Triple, [v1, v2, v3]: Triple): Body[] {
  return [
    { id: "a", name: "Cuerpo A", mass: 1, radius: 0, position: p1, velocity: v1 },
    { id: "b", name: "Cuerpo B", mass: 1, radius: 0, position: p2, velocity: v2 },
    { id: "c", name: "Cuerpo C", mass: 1, radius: 0, position: p3, velocity: v3 },
  ];
}

/**
 * Configuración de Šuvakov y Dmitrašinović (2013): los tres cuerpos en línea,
 * A en x = −1, B en x = 1 y C en el centro. A y B con la misma velocidad
 * (vx, vy); C con −2·(vx, vy), para que el sistema no se desplace.
 */
function suvakovBodies(vx: number, vy: number): Body[] {
  return threeBodies(
    [vec(-1, 0), vec(1, 0), ZERO],
    [vec(vx, vy), vec(vx, vy), vec(-2 * vx, -2 * vy)],
  );
}

/**
 * Triángulo equilátero de lado √3 (radio 1) girando a velocidad angular
 * ω = √(3·G·m / L³) = 3^(−1/4), la que equilibra exactamente la gravedad.
 */
function lagrangeBodies(): Body[] {
  const omega = 3 ** -0.25;
  const at = (angle: number) => vec(Math.cos(angle), Math.sin(angle));
  const tangent = (angle: number) => vec(-omega * Math.sin(angle), omega * Math.cos(angle));
  const angles = [Math.PI / 2, (7 * Math.PI) / 6, (11 * Math.PI) / 6] as const;
  return threeBodies(
    [at(angles[0]), at(angles[1]), at(angles[2])],
    [tangent(angles[0]), tangent(angles[1]), tangent(angles[2])],
  );
}

const SUVAKOV_2013: Source = {
  label: "Šuvakov y Dmitrašinović, Physical Review Letters 110, 114301 (2013)",
  url: "https://arxiv.org/abs/1303.0181",
};

const LI_LIAO_2013: Source = {
  label: "Šuvakov (15 cifras), publicado en Li y Liao, arXiv:1312.6796 (2013)",
  url: "https://arxiv.org/abs/1312.6796",
};

const FIGURE_EIGHT_V3 = vec(0.93240737, 0.86473146);

export const SOLUTIONS: readonly ThreeBodySolution[] = [
  {
    slug: "lagrange",
    name: "Lagrange",
    summary:
      "Los tres cuerpos forman un triángulo equilátero que gira sin deformarse. Es la solución más antigua: la describió Lagrange en 1772.",
    period: 2 * Math.PI * 3 ** 0.25,
    bodies: lagrangeBodies(),
    source: { label: "Solución analítica clásica (Lagrange, 1772)" },
    notes: "Con tres masas iguales es inestable: cualquier pequeño error la deforma tras unas vueltas.",
  },
  {
    slug: "figura-de-ocho",
    name: "Figura de ocho",
    summary:
      "Los tres cuerpos se persiguen por una misma curva con forma de ocho. La encontró Moore en 1993 y Chenciner y Montgomery demostraron su existencia en 2000.",
    period: 6.32591398,
    bodies: threeBodies(
      [vec(-0.97000436, 0.24308753), vec(0.97000436, -0.24308753), ZERO],
      [
        vec(-FIGURE_EIGHT_V3.x / 2, -FIGURE_EIGHT_V3.y / 2),
        vec(-FIGURE_EIGHT_V3.x / 2, -FIGURE_EIGHT_V3.y / 2),
        FIGURE_EIGHT_V3,
      ],
    ),
    source: {
      label: "Chenciner y Montgomery, Annals of Mathematics 152 (2000); condiciones de C. Simó",
      url: "https://arxiv.org/abs/math/0011268",
    },
    notes: "Estable: pequeñas perturbaciones no la destruyen.",
  },
  {
    slug: "butterfly-i",
    name: "Butterfly I",
    summary:
      "Las trayectorias dibujan dos alas simétricas. Una de las trece familias nuevas que encontraron Šuvakov y Dmitrašinović en 2013.",
    period: 6.23564136316479,
    bodies: suvakovBodies(0.306892758965492, 0.125506782829762),
    source: LI_LIAO_2013,
    notes: "Inestable: según Li y Liao, se aleja de la órbita periódica hacia t ≈ 130.",
  },
  {
    slug: "goggles",
    name: "Goggles",
    summary:
      "Su forma recuerda a unas gafas. También de Šuvakov y Dmitrašinović (2013).",
    period: 10.4668176954385,
    bodies: suvakovBodies(0.0833000564575194, 0.127889282226563),
    source: LI_LIAO_2013,
    notes: "Muy inestable: según Li y Liao, se aleja de la órbita periódica hacia t ≈ 55.",
  },
  {
    slug: "moth-i",
    name: "Moth I",
    summary:
      "Las trayectorias recuerdan a una polilla. Otra de las familias de Šuvakov y Dmitrašinović (2013).",
    period: 14.8939,
    bodies: suvakovBodies(0.46444, 0.39606),
    source: SUVAKOV_2013,
    notes: "Solo hay publicadas condiciones con 5 cifras, menos precisas que las del resto.",
  },
  {
    slug: "yin-yang-i",
    name: "Yin-Yang I",
    summary:
      "Las órbitas se entrelazan como el símbolo del yin y el yang. De Šuvakov y Dmitrašinović (2013).",
    period: 10.9625630756217,
    bodies: suvakovBodies(0.282698682308198, 0.327208786129952),
    source: LI_LIAO_2013,
    notes: "Inestable: según Li y Liao, se aleja de la órbita periódica hacia t ≈ 135.",
  },
];

export function findSolution(slug: string): ThreeBodySolution | undefined {
  return SOLUTIONS.find((solution) => solution.slug === slug);
}
