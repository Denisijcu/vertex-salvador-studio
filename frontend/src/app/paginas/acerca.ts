import { Component } from '@angular/core';

@Component({
  selector: 'app-acerca',
  template: `
    <article class="pagina">
      <h1>Acerca de</h1>
      <p><strong>vertex-salvador studio</strong> es un asistente local sobre la historia reciente de El Salvador y la
        campaña contra las pandillas. Funciona en esta computadora: las preguntas no salen a internet.</p>
      <h2>De dónde salen las respuestas</h2>
      <p>De una biblioteca de fragmentos tomados de fuentes públicas (prensa nacional e internacional, organismos,
        organizaciones de derechos humanos, trabajos académicos y fuentes oficiales), cada uno con su autor y su
        enlace. La biblioteca está al día hasta el 18 de noviembre de 2026.</p>
      <h2>Neutralidad</h2>
      <p>El modelo está entrenado para atribuir: dice quién afirma cada cosa y presenta las versiones enfrentadas sin
        tomar partido. No es una herramienta oficial ni habla en nombre de ningún gobierno, partido u organización.</p>
      <h2>Límites</h2>
      <p>Es un modelo pequeño que puede equivocarse. Por eso cada respuesta muestra sus fuentes y marca las cifras que
        no aparecen en ellas. Para cualquier uso público, cite la fuente original, no al asistente.</p>
      <h2>Créditos</h2>
      <p>Modelo afinado sobre Gemma 4 E4B de Google. Desarrollado por Denis Sánchez Leyva, Vertex Coders LLC. Código y
        modelo con licencia Apache 2.0; los fragmentos conservan los derechos de sus fuentes.</p>
    </article>
  `,
  styles: `
    .pagina { padding: 32px clamp(16px, 4vw, 56px) 64px; max-width: 66ch; }
    h1 { font-size: 32px; margin-bottom: 8px; }
    h2 { font-size: 20px; margin: 28px 0 6px; }
    p { font: 400 17px/1.65 var(--vs-serif); margin: 0 0 10px; }
  `,
})
export class Acerca {}
