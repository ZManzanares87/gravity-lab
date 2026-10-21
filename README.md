# Gravity Lab

Una aplicación web para que una persona adulta sin formación en física entienda la **ley de gravitación universal** (F = G · m₁ · m₂ / r²) a base de predecir, mirar y entender, con un **tutor con IA** que conversa, se adapta y prepara experimentos. Incluye además una **galería de seis órbitas periódicas** del problema de los tres cuerpos.

- **Versión desplegada:** https://gravity-lab-rosy.vercel.app
- **Repositorio:** https://github.com/ZManzanares87/gravity-lab

---

## Cómo verla

### Online (recomendado)

Abre https://gravity-lab-rosy.vercel.app. No hace falta configurar nada: el tutor usa mi clave de Anthropic, con un límite de gasto (ver [Costes y protección](#costes-y-protección)).

### En local

Requisitos: Node.js 20.9 o superior (lo pide Next.js 16) y pnpm.

```bash
git clone https://github.com/ZManzanares87/gravity-lab.git
cd gravity-lab
pnpm install
cp .env.example .env.local   # y pon tu clave en ANTHROPIC_API_KEY
pnpm dev                     # http://localhost:3000
```

Otras órdenes:

```bash
pnpm exec tsc --noEmit   # tipos
pnpm lint                # ESLint
pnpm test                # tests (Vitest)
pnpm build && pnpm start # versión de producción
```

### Docker

No se incluye. La prueba pide al menos una de las dos vías de entrega, y la versión desplegada la cubre sin montar nada. En local basta con `pnpm` y una clave propia. Preferí dedicar el tiempo a la experiencia de aprendizaje antes que entregar una configuración de Docker que no hubiera podido probar a fondo.

## Variables de entorno

| Variable | ¿Obligatoria? | Para qué |
|---|---|---|
| `ANTHROPIC_API_KEY` | Solo para el tutor | Sin ella, la app funciona en **modo reducido**: experimentos, explicaciones, la ley y la galería funcionan igual, y el panel del tutor avisa claramente de que no está disponible (la ruta responde 503 con el código `tutor-no-disponible`). |
| `TUTOR_MODEL` | No | Modelo del tutor. Por defecto, `claude-haiku-5-5`. |

Hay un `.env.example` en el repositorio. Los `.env*` están en `.gitignore`, con la excepción `!.env.example`.

---

## Parte A: el laboratorio

### El recorrido

- **Bienvenida (`/`)**: qué vas a descubrir y cómo funciona cada experimento. El botón para empezar está al final, después de las explicaciones.
- **Laboratorio (`/laboratorio`)**: tres experimentos planteados como preguntas. Cada uno descubre una pieza de la ley:

| Experimento | Pieza de la ley |
|---|---|
| ¿Influye la masa en la caída? | m₁ · m₂: si una masa se duplica, la fuerza se duplica |
| ¿Por qué la Luna no se cae? | r²: al doble de distancia, cuatro veces menos fuerza |
| ¿Y si hay tres cuerpos? | Universal: todo atrae a todo |

### Predice → Mira → Entiende

Cada experimento sigue el mismo patrón, porque equivocarse con una apuesta propia y comprobarlo se recuerda mejor que leer la respuesta:

1. **Predice**: solo se ven la pregunta y las opciones. No hay controles que distraigan.
2. **Mira**: al comprobar, la simulación arranca sola. Cuando llega al resultado, aparecen «¿Ha pasado lo que esperabas?» y el botón **Entender por qué**. Nada se revela solo: la persona decide cuándo pasar a la explicación.
3. **Entiende**: resultado, una explicación corta, la pieza de la ley que se descubre y una invitación a probar otros valores en «Experimenta tú».

El paso no se guarda aparte: el store tiene una sola **fase** (`predict`, `watch`, `ready`, `understand`) y la interfaz la lee. Así no puede haber combinaciones imposibles, y reproducir libremente nunca se salta la predicción. Hay tests que recorren la máquina de estados entera.

### La ley

«Consultar la ley de gravitación universal» abre un `<dialog>` nativo: primero la idea (todo atrae a todo), después la fórmula y cada letra en su orden (F, G, m₁ · m₂, r²). Cada pieza indica en qué experimento se descubre. Ese texto se calcula a partir del orden y los títulos de los experimentos, de modo que no puede desfasarse si cambian. La ley se entiende entera **sin la IA**.

### La simulación

- Canvas 2D propio, solo de visualización. Toda la interacción está en controles HTML nativos.
- Los cuerpos demasiado pequeños para verse a escala **no se agrandan**: se dibujan con un círculo hueco, y una leyenda bajo el dibujo lo explica solo cuando aparece alguno.
- Bajo el dibujo, una franja de datos: el **tiempo** y, en la órbita, la **distancia desde el centro de la Tierra**. Así siguen visibles aunque el proyectil salga del dibujo. La distancia sale del mismo cálculo que la cota del canvas.
- Las etiquetas de los cuerpos buscan un hueco libre, así que dos cuerpos en el mismo sitio no se pisan el nombre.
- La escena de tres cuerpos usa unidades abstractas (como la galería), así que sus deslizadores muestran **palabras en los extremos** («Cerca … Lejos», «0 … Como A y B») en lugar de números sin sentido.
- En tres cuerpos, las estrellas son puntuales y la gravedad entre ellas se suaviza a distancias muy cortas, así que se cruzan sin chocar. El sistema arranca sin impulso neto, de modo que se queda a la vista. Como usa unidades abstractas, esta escena no muestra reloj.

---

## El tutor con IA

### Integración

AI SDK de Vercel con `@ai-sdk/anthropic`, en la ruta `/api/tutor`, con respuestas en streaming. El modelo es pequeño y rápido, configurable con `TUTOR_MODEL`, y tiene el razonamiento extendido desactivado.

### Cómo se comporta

- **Conversa, no da discursos**: frases cortas, como mucho tres por mensaje, y espera a que la persona responda antes de seguir.
- **Tras cada predicción interviene solo**:
  - Si fallas, primero te pregunta por qué lo pensabas y después explica partiendo de tu idea, con un ejemplo cotidiano.
  - Si aciertas, te felicita y te deja elegir entre ir un paso más allá o pasar al siguiente experimento.
- **Si le preguntas, responde primero.** Si el laboratorio no puede mostrar lo que preguntas, te explica qué pasaría y te dice que aquí todavía no se puede probar, sin inventar cifras.
- **No adelanta la explicación** mientras miras la simulación, ni propone experimentos antes de que hayas predicho.
- **Retoma la conversación tras sus experimentos**: cuando la persona ya ha visto el experimento que le preparó (al tocar el suelo, tras un rato de órbita…), le pregunta qué ha visto. No interrumpe al pulsar Play.
- **Usa los conceptos con precisión**: velocidad, fuerza, masa y peso no son lo mismo, y si los confundes te lo aclara.

### Cómo se adapta

Con cada mensaje recibe el estado del laboratorio y lo usa:

1. **Tu historial de la sesión**: aciertos y fallos. Con varios fallos simplifica; si aciertas, sube el nivel.
2. **La fase en la que estás**: no es lo mismo estar prediciendo que haber visto ya la explicación.
3. **Tus valores actuales** («tu bola de 80 kg»), no ejemplos genéricos.
4. **Cómo preguntas**: si dices que no lo entiendes, lo explica desde otro ángulo.

### Opera el laboratorio, con permiso

El tutor no solo habla: con la herramienta `proponerExperimento` propone cambios (valores de los controles) y explica qué se va a ver.

- **La persona acepta o rechaza.** Solo entonces se aplican, por la misma puerta que usan los controles (`dispatch` y `validateAction`). La IA no puede hacer nada que la persona no pueda hacer.
- **La IA prepara y la persona ejecuta**: al aceptar, el experimento queda preparado y en pausa, y es la persona quien pulsa Play.
- **Solo en el experimento actual**: abrir otro le enseñaría el resultado de uno que aún no ha predicho.

Estas dos últimas reglas no dependen del prompt: las garantiza el código (`preparableActions`, una función pura con tests).

### Contexto y seguridad

- El contexto que viaja con cada mensaje describe solo el experimento actual: pregunta, controles con sus rangos, medidas del motor, fase, predicciones y piezas descubiertas.
- **No inventa números**: usa los que calcula el motor.
- **Prompt injection**: el contexto se trata como dato, no como instrucción, y el prompt lo dice explícitamente. Además, cualquier acción de la IA pasa por la misma validación que las de la persona.
- **Solo mensajes de la persona o del tutor**: la ruta rechaza cualquier mensaje con rol de sistema, para que nadie pueda colar instrucciones llamando a la API directamente.

### Costes y protección

- Límite de 30 peticiones por hora e IP, en memoria.
- Historial recortado a los últimos 20 mensajes, contexto de hasta 4000 caracteres, respuestas de hasta 600 tokens y un máximo de 30 segundos por petición.
- **Límite de gasto de 5 $** en un workspace propio de Anthropic, con una clave dedicada: es la garantía real de coste. Si se alcanza, el tutor deja de responder y todo lo demás sigue funcionando.

---

## Parte B: galería de tres cuerpos

- Seis soluciones periódicas (Lagrange, Figura de ocho, Butterfly I, Goggles, Moth I y Yin-Yang I), cada una con su URL compartible (`/galeria/[slug]`). Se generan de forma estática con `generateStaticParams` y `dynamicParams = false`.
- Las trayectorias y las miniaturas SVG se calculan en el build, en componentes de servidor. Solo el reproductor es de cliente.
- Reproductor en canvas con estela (medida en tiempo, no en fotogramas, para que no parpadee a ×4), controles de reproducción, velocidad de ×0,25 a ×4 y órbita completa si el sistema pide movimiento reducido.
- **Al volver a la galería** se recuerda la última órbita abierta y el foco vuelve a su tarjeta.
- Las condiciones iniciales no se pueden cambiar a propósito: estas órbitas solo se repiten con valores exactos, y cambiarlos sería otra funcionalidad (buscar órbitas propias).
- Fuentes: Šuvakov y Dmitrašinović, PRL 2013 (arXiv 1303.0181); Li y Liao (arXiv 1312.6796); Chenciner y Montgomery (arXiv math/0011268).

---

## Física verificada

- Motor propio en TypeScript puro (`src/physics`), sin dependencias de React ni de Next. Una regla de ESLint lo impide.
- **Integrador Yoshida de 4.º orden.** Empecé con Verlet, pero Yin-Yang I no cerraba (error de 0,045 tras un periodo). Con Yoshida, el error de cierre llega al límite de precisión de los datos publicados:

| Órbita | Error de cierre tras un periodo |
|---|---|
| Lagrange | 2,80·10⁻⁵ |
| Figura de ocho | 1,78·10⁻⁵ |
| Butterfly I | 7,52·10⁻⁴ |
| Goggles | 5,70·10⁻⁴ |
| Moth I | 1,35·10⁻⁴ (datos publicados con solo 5 dígitos) |
| Yin-Yang I | 1,66·10⁻³ |

La energía se conserva mejor que 10⁻¹¹ en todas.

**73 tests**, entre ellos:
- g ≈ 9,8 m/s² en la superficie, y la aceleración no depende de la masa.
- Al doble de distancia del centro de la Tierra, un cuarto de la fuerza: la regla exacta que enseña la app.
- Tiempo de caída √(2h/g), y dos bolas que tocan el suelo a la vez.
- Una órbita circular que cierra, y el cierre y la energía de las seis órbitas de la galería.
- En tres cuerpos, que las estrellas no chocan y que el sistema arranca sin impulso neto.
- La máquina de estados del experimento, la validación de acciones, las garantías de las propuestas del tutor, el aviso cuando la persona ha visto su experimento, el contexto del tutor y el límite de peticiones.

---

## Arquitectura

```
src/
├── app/         Rutas: / (bienvenida), /laboratorio, /galeria, /galeria/[slug], /api/tutor
├── physics/     Motor puro: tipos, gravedad, integrador, contactos (sin React)
├── simulation/  Runner fuera de React (requestAnimationFrame, programador inyectable para tests)
├── lab/         Escenas, experimentos, store, acciones y componentes del laboratorio
├── gallery/     Soluciones, trayectorias y componentes de la galería
├── tutor/       Prompt, contexto, herramientas, propuestas y componentes del tutor
└── ui/          Componentes genéricos
```

- **Una sola puerta para cambiar el laboratorio**: `dispatch(LabAction)` la usan los controles, «Comprobar» y la IA, y se valida en un solo sitio.
- **Una sola fuente de verdad**: el orden de los experimentos (`SCENE_ORDER`) es una tupla que usan el laboratorio, la bienvenida y la validación con Zod del tutor; los títulos viven en `EXPERIMENT_TITLES`; dónde se descubre cada pieza se calcula.
- **El estado de la simulación vive fuera de React**: el canvas lo lee directamente, sin re-renderizar en cada fotograma.
- **El contenido** (preguntas, explicaciones, piezas de la ley, soluciones) está en objetos tipados, separado del código que lo pinta.

---

## Accesibilidad

- **Lighthouse: 100 en accesibilidad** en la bienvenida, el laboratorio y la galería, incluido el contraste de color. Lighthouse solo revisa la página al cargar, así que el resto lo probé a mano.
- Todo se usa con teclado, con un foco visible único en toda la app y un enlace «Saltar al contenido». La página está declarada en español (`lang="es"`).
- Componentes nativos donde el navegador ya resuelve teclado, foco y lectores de pantalla: `<dialog>` para la ley y `<details>` para los plegables.
- **El foco acompaña al recorrido**: al comprobar va a «Mira qué pasa», al pulsar «Entender por qué» va al resultado y al pasar de experimento va a su título. Solo se mueve al avanzar, nunca al cargar la página.
- Los deslizadores anuncian su valor real (`aria-valuetext`). Los de tres cuerpos anuncian su posición entre los dos extremos.
- Los contactos se anuncian a lectores de pantalla, y la llegada del botón «Entender por qué» también, sin mover el foco. Los valores continuos, no.
- La leyenda y los datos de la simulación son texto real fuera del canvas, legible por lectores de pantalla.
- Zonas táctiles de al menos 44 px en el móvil. Se respeta `prefers-reduced-motion`.

## Responsive

- **Escritorio**: simulación a la izquierda y guía a la derecha. El canvas ocupa el alto que queda en la pantalla, así que cabe también en un portátil, y la columna derecha se queda a la vista al hacer scroll. El tutor es un desplegable bajo la guía: cerrado, una barra que avisa si el tutor ha escrito; abierto, la conversación.
- **Móvil**: una sola columna. El tutor ocupa toda la pantalla al abrirlo, como hacen los chats de soporte en móvil, y al cerrarlo devuelve a la simulación.
- **Tablet**: el tutor flota en una esquina.
- Un fallo encontrado y arreglado: en móvil la página medía 434 px en una pantalla de 390. La columna automática del grid crecía con su contenido más ancho (la gráfica que después quité). Lo arregla una columna explícita `minmax(0, 1fr)`.

---

## Decisiones y alternativas descartadas

**Física y simulación**
- **Yoshida frente a Verlet y RK4**: Verlet no cerraba las órbitas complejas. RK4 no es simpléctico y la energía deriva en simulaciones largas. Yoshida es simpléctico y de 4.º orden. *Coste*: tres cálculos de gravedad por paso.
- **Canvas propio frente a p5.js**: p5 impone su propio bucle, encaja mal con React y su fuerte es la interacción en el canvas, que aquí no se usa. Con un runner propio, la simulación se prueba sin navegador.
- **Estrellas que se cruzan en lugar de chocar.** Al principio cada estrella tenía un radio de 0,05 para una separación de 1, unas diez veces más grande de lo realista, así que chocaban a menudo y la simulación se paraba. Ahora son puntuales y la gravedad se suaviza a distancias muy cortas (suavizado de Plummer: r² pasa a ser r² + ε²). El motor lo recibe como un ajuste opcional que vale 0 por defecto, así que la caída, la órbita y la galería calculan exactamente igual. Además, las velocidades de partida se toman en el sistema del centro de masas, para que el conjunto no se desplace fuera del dibujo. *Coste*: en un acercamiento extremo, la fuerza es algo menor que la exacta.

**Experiencia de aprendizaje**
- **Simplificar para quien no sabe física.** Tras probar la app con personas sin formación, quité la gráfica, la tabla de datos y la fórmula con potencias de 10: abrumaban en lugar de ayudar. *Coste*: quien quiera los números exactos ya no los ve en pantalla, pero el tutor los sigue recibiendo y se los da si los pide.
- **De cuatro experimentos a tres.** El de la distancia era un medidor sin nada que mirar: su efecto solo se veía en la tabla. La distancia se explica ahora en el experimento de la órbita. Además, desapareció la única escena sin animación y, con ella, varias excepciones del código.
- **Una fase en lugar de varios booleanos**: las combinaciones imposibles no se pueden escribir, y el paso nunca contradice a la simulación.
- **Sin cajas de valor exacto en los deslizadores**: duplicaban cada control y daban sensación de caos.
- **La bienvenida en su propia ruta (`/`)**, en lugar de una capa sobre el laboratorio: cada cosa tiene su URL.

**El tutor**
- **La IA propone, prepara y espera.** Nunca cambia el laboratorio sin permiso, y nunca reproduce: la persona pulsa Play. Esto lo garantiza el código, no solo el prompt.
- **Conversación en lugar de explicación.** La primera versión respondía a cada predicción con un párrafo largo que repetía la explicación de pantalla. Ahora pregunta, escucha y explica poco a poco.
- **A pantalla completa en móvil.** Comparé con los chats de soporte (que en móvil se muestran por encima de todo) y con los paneles de Apple y de Material Design. Un panel a media altura deja ver la simulación, pero con el teclado abierto apenas queda espacio para leer.
- **Desplegable en escritorio.** Fijo y siempre abierto, en una pantalla de portátil quedaba cortado o le quitaba sitio a la guía. Cerrado ocupa una barra, y se abre cuando la persona quiere hablar con él.

**Interfaz**
- **El menú superior siempre visible.** Se planteó ocultarlo hasta pasar el ratón para ganar espacio, pero con teclado o en pantallas táctiles no existe «pasar el ratón». En su lugar, la columna de la guía y el tutor se queda a la vista al hacer scroll.

**Infraestructura**
- **Límite de peticiones en memoria frente a Redis**: en serverless es aproximado, porque cada instancia cuenta por su cuenta. Redis lo haría exacto, pero añade un servicio, credenciales y coste. La garantía real es el límite de gasto en Anthropic.
- **Sin Docker**: ver [Cómo verla](#docker).

---

## Limitaciones conocidas

**El tutor**
- Es un modelo de lenguaje: aunque el prompt lo acota, a veces puede ser impreciso. La fuente fiable son las explicaciones fijas, escritas a mano; el tutor las complementa.
- Se adapta en cómo habla, pero no cambia el recorrido: las preguntas y los experimentos son los mismos para todo el mundo.
- No recuerda nada entre visitas: al recargar se empieza de cero.
- Si se agota el límite de gasto, el tutor muestra un error genérico («No he podido responder…»), no uno específico de límite alcanzado.
- En iOS (cualquier navegador, porque todos usan WebKit), el teclado se superpone a la página en lugar de redimensionarla, así que al escribir puede hacer falta desplazar el chat. En Android y en escritorio se adapta solo.

**El laboratorio**
- En la caída, la velocidad inicial hacia arriba es una sola para los dos objetos. Lo natural sería una por objeto, igual que hay una masa por objeto. No dio tiempo.
- En tres cuerpos, la gravedad está suavizada a distancias muy cortas (ε = 0,05): es la técnica estándar en simulaciones de estrellas, pero en un acercamiento extremo la fuerza es algo menor que la exacta. Y como la escena usa unidades abstractas, no tiene reloj.
- En tres cuerpos, con la masa de la tercera estrella a 0 (solo A y B), sus deslizadores de distancia y velocidad no tienen efecto.
- No se puede escribir un valor exacto en los deslizadores.
- Solo modo claro.

**La galería**
- No se pueden buscar órbitas propias (el extra de la Parte B). El experimento de tres cuerpos del laboratorio permite explorar configuraciones (masa, distancia y velocidad de la tercera estrella) y es un primer paso, pero no detecta si una órbita es periódica ni deja fijar todas las condiciones iniciales.
- Moth I solo tiene cinco dígitos publicados: su error de cierre lo limitan los datos, no el motor.

**Infraestructura**
- El límite de peticiones es aproximado en serverless (ver arriba).

## Siguientes pasos

Ideas que surgieron al probar la app y que dejé fuera por tiempo:
- Dividir el experimento de tres cuerpos en dos partes: primero ver cómo se mueven dos cuerpos fuera de la Tierra y después añadir el tercero.
- Detectar si una configuración de tres cuerpos se repite: el paso que falta para buscar órbitas propias.
- Una velocidad inicial por objeto en la caída.
- Que el recorrido también se adapte cuando alguien falla (una pregunta de refuerzo o poder repetir la predicción). Ahora lo que se adapta es la conversación del tutor, no las preguntas.
- Que cada pieza del diálogo de la ley lleve directamente a su experimento.
- Que el tutor cierre el recorrido al terminar los tres experimentos.

---

## Cómo lo verifiqué

- `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm test` antes de cada commit.
- Pruebas en Chrome en incógnito, con ratón y solo con teclado, en un portátil, en la vista móvil de DevTools y en un iPhone real con la versión desplegada.
- Lighthouse (accesibilidad) sobre la versión desplegada.
- Varias personas sin formación en física probaron la versión desplegada. Su primera impresión fue que había demasiada información a la vez («demasiado caos»). De ahí salieron la página de bienvenida, el recorrido Predice → Mira → Entiende y la simplificación posterior: quitar la gráfica, los datos y un experimento, y un tutor que conversa en lugar de soltar explicaciones largas.
- Cada commit explica en su cuerpo por qué se hizo el cambio.

## Uso de IA en el desarrollo

Usé IA en dos momentos distintos.

**Para entender el problema.** Antes de escribir código, usé ChatGPT para trabajar la idea y, sobre todo, para entender yo misma la ley de gravitación universal. Me fijé en qué puntos me costaba más entender y diseñé la experiencia a partir de ellos.

**Para construirla**, usé Claude como apoyo, en un papel parecido al de un tech lead, y trabajé por fases:

1. **Acotar la idea.** Primero planteé qué quería construir y pensé en sus límites. Lo recogí en una especificación funcional con el alcance (lo imprescindible, lo que quedaba para «si da tiempo» y lo que dejaba fuera), un plan por días y un orden de recorte por si iba con retraso. El plan cambió después al probar con usuarios, pero me sirvió para decidir rápido qué era lo esencial.
2. **Decidir qué usar.** Leí documentación sobre las librerías posibles antes de elegir. Me planteé usar p5.js, porque ya la había usado en experimentos de creative coding, pero la descartamos: impone su propio bucle de dibujo, encaja mal con React y su punto fuerte es la interacción dentro del canvas, que aquí no se usa. Un canvas propio, con el bucle de la simulación fuera de React, además se puede probar sin navegador.
3. **Diseñar la arquitectura**: el motor físico separado de la interfaz, una sola puerta para cambiar el laboratorio y los datos en un único sitio.
4. **Escribir el código paso a paso.** Claude escribió buena parte del código a partir de lo que decidíamos. Yo lo apliqué cambio a cambio, lo revisé y lo comprobé (tipos, lint, tests y prueba en el navegador) antes de cada commit, y puedo explicar cada parte.
5. **Revisar con Claude Code.** Usé Claude Code para cambios mecánicos acotados (primero me enseñaba dónde iba a tocar y lo aplicaba cuando lo confirmaba) y para una revisión final del código antes de entregar: código muerto, restos de funcionalidades que había quitado, tipado y organización. Decidí yo qué arreglar. Por ejemplo, descarté su propuesta de cambiar el modelo del tutor, porque se basaba en información desfasada.

**Sobre la física.** No tengo formación en física. Para el motor y los cálculos me apoyé en la IA y en las fuentes publicadas, y lo verifiqué con tests: la caída, las órbitas, la conservación de la energía y el cierre de las órbitas de la galería. En cuatro días no puedo explicarlo como lo haría una matemática o una ingeniera, pero eso también aporta algo: la app es para personas sin formación en física, y diseñarla desde ahí me obligó a entender cada idea y a explicarla en lenguaje cotidiano.
