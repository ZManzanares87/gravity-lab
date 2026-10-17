export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-bold">Gravity Lab</h1>
      <p className="mt-4 text-lg text-ink-soft">
        Página provisional para revisar la identidad visual: papel, tinta y los colores de los
        tres cuerpos.
      </p>
      <ul className="mt-8 flex gap-6 text-lg font-bold">
        <li className="text-body-a">Cuerpo A</li>
        <li className="text-body-b">Cuerpo B</li>
        <li className="text-body-c">Cuerpo C</li>
      </ul>
      <a href="#" className="mt-8 inline-block underline">
        Enlace para probar el foco con Tab
      </a>
      <p className="mt-4 tabular-nums text-ink-soft">t = 1,43 s · F = 9,82 N</p>
    </main>
  );
}
