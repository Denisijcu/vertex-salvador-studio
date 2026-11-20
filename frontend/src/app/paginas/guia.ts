import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-guia',
  imports: [RouterLink],
  template: `
    <article class="pagina">
      <h1>Cómo usar el asistente</h1>
      <h2>Preguntar</h2>
      <p>Escriba la pregunta como se la haría a una persona. El asistente busca en la biblioteca, lee los documentos
        que encuentra y responde. Debajo de la pregunta verá qué buscó y cuántos documentos encontró.</p>
      <h2>Comprobar una respuesta</h2>
      <p>Pulse <strong>fuentes</strong> debajo de cualquier respuesta para ver, a la derecha, los documentos de los que
        sale. Pulse un documento para leerlo entero y abrir la fuente original.</p>
      <p>Si una cifra aparece <mark class="sin-respaldo">resaltada así</mark>, es que no está en ninguno de los
        documentos consultados. A veces es una fecha o un dato general; compruébela antes de citarla.</p>
      <h2>Temas discutidos</h2>
      <p>En los temas donde hay versiones distintas, el asistente dice quién sostiene cada una: el gobierno, las
        organizaciones de derechos humanos, la prensa. No da opiniones propias.</p>
      <h2>Sus propios documentos</h2>
      <p>En <a routerLink="/mis-documentos">Mis documentos</a> puede añadir informes o notas suyas. Se quedan en esta
        computadora. Para que el asistente los use, pídaselo en el chat: «busca en mis documentos…».</p>
      <h2>Si algo no funciona</h2>
      <p>Abra <a routerLink="/estado">Estado</a>. Ahí se ve si LM Studio está abierto, si el modelo está cargado y con
        cuánta memoria. Las respuestas tardan entre unos segundos y dos minutos según la computadora; mientras tanto
        verá la respuesta escribirse.</p>
    </article>
  `,
  styles: `
    .pagina { padding: 32px clamp(16px, 4vw, 56px) 64px; max-width: 66ch; }
    h1 { font-size: 32px; margin-bottom: 8px; }
    h2 { font-size: 20px; margin: 28px 0 6px; }
    p { font: 400 17px/1.65 var(--vs-serif); margin: 0 0 10px; }
  `,
})
export class Guia {}
