"use client";

import { SCENE_ORDER, SCENES } from "../scenes";
import { useLabStore } from "../store";

/** Los cuatro experimentos, en el orden sugerido. Se puede saltar a cualquiera. */
export function SceneNav() {
  const sceneId = useLabStore((state) => state.sceneId);
  const dispatch = useLabStore((state) => state.dispatch);

  return (
    <nav aria-label="Experimentos">
      <ol className="space-y-1">
        {SCENE_ORDER.map((id, index) => {
          const current = id === sceneId;
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={current ? "step" : undefined}
                onClick={() => dispatch({ type: "loadScene", scene: id })}
                className={`w-full px-3 py-2 text-left ${
                  current ? "bg-ink font-bold text-paper" : "hover:bg-ink/5"
                }`}
              >
                {index + 1}. {SCENES[id].title}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
