/**
 * Tipos del motor físico.
 *
 * El motor no conoce unidades: funciona igual en el Sistema Internacional
 * (metros, kilos, segundos) que en las unidades abstractas de la galería
 * (G = 1, masas = 1). Quien crea la simulación decide qué valores usar.
 */

/** Vector en 2D. Se usa para posiciones, velocidades y aceleraciones. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** Un cuerpo con masa. */
export interface Body {
  readonly id: string;
  /** Nombre visible, por ejemplo "Luna". */
  readonly name: string;
  readonly mass: number;
  /** Radio físico. 0 significa cuerpo puntual: nunca entra en contacto. */
  readonly radius: number;
  readonly position: Vec2;
  readonly velocity: Vec2;
}

/** Foto completa de la simulación en un instante. */
export interface SimState {
  /** Tiempo transcurrido desde el inicio de la simulación. */
  readonly time: number;
  readonly bodies: readonly Body[];
}

/** Parámetros fijos de una simulación. */
export interface PhysicsConfig {
  /** Constante de gravitación: la real en el laboratorio, 1 en la galería. */
  readonly G: number;
  /** Tamaño del paso de tiempo. Siempre fijo (ver bloque 2 de la especificación). */
  readonly dt: number;
  /** Suavizado de la gravedad a distancias muy cortas (Plummer): r² pasa a ser r² + ε². 0 o ausente: gravedad exacta. */
  readonly softening?: number;
}

/** Contacto entre dos cuerpos: la simulación debe pausarse y anunciarlo. */
export interface Contact {
  /** El cuerpo más ligero, que queda apoyado sobre el otro. */
  readonly bodyId: string;
  readonly otherBodyId: string;
  readonly time: number;
}
