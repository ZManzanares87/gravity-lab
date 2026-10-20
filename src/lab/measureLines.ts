import type { Body, Vec2 } from "@/physics/types";
import { formatDistance } from "./format";
import { withoutNoise } from "./measurements";

interface DrawingContext {
  readonly context: CanvasRenderingContext2D;
  toScreen(point: Vec2): { x: number; y: number };
  readonly scale: number;
  readonly width: number;
  readonly ink: string;
  readonly fontFamily: string;
  /** Radio en pantalla a partir del cual el cuerpo central se dibuja como suelo plano. */
  readonly flatThresholdPx: number;
}

/**
 * Línea de cota de cada cuerpo hasta el cuerpo central, como en un plano:
 * - Si el cuerpo central se ve como suelo plano (Superficie): línea continua
 *   hasta el suelo, con la altura.
 * - Si se ve entero (Lanzamiento): línea discontinua hasta su centro,
 *   con la distancia r. Es la r de la fórmula: al centro, no al suelo.
 *
 * Devuelve esa distancia al centro (o null) para mostrarla también fuera del
 * canvas: así no desaparece cuando el cuerpo se sale del dibujo.
 */
export function drawMeasureLines(drawing: DrawingContext, bodies: readonly Body[], centralId = "tierra"): string | null {
  const { context, toScreen, scale, width, ink, fontFamily, flatThresholdPx } = drawing;
  const central = bodies.find((body) => body.id === centralId);
  if (!central) return null;
  const flat = central.radius * scale > flatThresholdPx;
  let centerDistance: string | null = null;

  context.save();
  context.strokeStyle = ink;
  context.fillStyle = ink;
  context.lineWidth = 1;
  context.font = `400 13px ${fontFamily}`;

  bodies.forEach((body) => {
    if (body.id === centralId) return;
    const dx = body.position.x - central.position.x;
    const dy = body.position.y - central.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return;
    const altitude = withoutNoise(distance - central.radius - body.radius);
    // Apoyado en el suelo, la cota no aporta nada: ya se ve que ha llegado.
    if (flat && altitude === 0) return;
    // Dirección del centro del cuerpo central hacia el cuerpo.
    const ux = dx / distance;
    const uy = dy / distance;

    const start = flat
      ? toScreen({ x: body.position.x - ux * body.radius, y: body.position.y - uy * body.radius })
      : toScreen(body.position);
    const end = flat
      ? toScreen({ x: central.position.x + ux * central.radius, y: central.position.y + uy * central.radius })
      : toScreen(central.position);
    const r = formatDistance(distance);
    if (!flat) centerDistance = r;
    const label = flat ? formatDistance(altitude) : `r = ${r}`;

    context.setLineDash(flat ? [] : [6, 5]);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();

    // Pequeñas marcas perpendiculares en los extremos, como en un plano.
    const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
    const px = (-(end.y - start.y) / length) * 5;
    const py = ((end.x - start.x) / length) * 5;
    context.setLineDash([]);
    [start, end].forEach(({ x, y }) => {
      context.beginPath();
      context.moveTo(x - px, y - py);
      context.lineTo(x + px, y + py);
      context.stroke();
    });

    // El texto, junto a la mitad de la línea, hacia el lado con más espacio.
    const middleX = (start.x + end.x) / 2;
    const middleY = (start.y + end.y) / 2;
    const onRight = middleX >= width / 2;
    context.textAlign = onRight ? "left" : "right";
    context.fillText(label, onRight ? middleX + 8 : middleX - 8, middleY);
  });

  context.restore();
  return centerDistance;
}
