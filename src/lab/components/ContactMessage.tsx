"use client";

import { formatNumber } from "../format";
import { getScene } from "../scenes";
import { useLabStore } from "../store";

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Anuncia los contactos a lectores de pantalla (en pantalla, el resultado lo cuenta la guía): "Contacto con el suelo en t = 1,43 s: bola de bolos y pelota de tenis, a la vez." */
export function ContactMessage() {
  const sceneId = useLabStore((state) => state.sceneId);
  const params = useLabStore((state) => state.params);
  const contacts = useLabStore((state) => state.contacts);

  const first = contacts[0];
  let message = "";

  if (first) {
    const scene = getScene(sceneId);
    const bodies = scene.buildBodies(params);
    const nameOf = (id: string) => lowerFirst(bodies.find((body) => body.id === id)?.name ?? id);
    const names = contacts.map((contact) => nameOf(contact.bodyId));
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names.at(-1)}` : names[0];
    const clock = scene.run.clock;
    const time = `${formatNumber(first.time / clock.secondsPerUnit, 3)}${clock.unit ? ` ${clock.unit}` : ""}`;
    const together = names.length > 1 ? ", a la vez" : "";

    message =
      first.otherBodyId === "tierra"
        ? `Contacto con el suelo en t = ${time}: ${list}${together}.`
        : `Choque en t = ${time}: ${list} contra ${nameOf(first.otherBodyId)}.`;
  }

  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}
