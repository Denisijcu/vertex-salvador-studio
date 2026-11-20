import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

const RE_NUMERO = /\d[\d.,]*\d|\d/g;

/** Markdown del modelo -> HTML seguro, con las cifras sin respaldo envueltas en <mark class="sin-respaldo">. */
export function respuestaHtml(markdown: string, sinRespaldo: string[]): string {
  const limpio = DOMPurify.sanitize(marked.parse(markdown || '', { async: false }) as string);
  if (!sinRespaldo.length) return limpio;
  const marcar = new Set(sinRespaldo);
  const doc = new DOMParser().parseFromString(`<div>${limpio}</div>`, 'text/html');
  const raiz = doc.body.firstElementChild!;
  const nodos: Text[] = [];
  const paseo = doc.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  while (paseo.nextNode()) nodos.push(paseo.currentNode as Text);
  for (const nodo of nodos) {
    const t = nodo.data;
    let ultimo = 0;
    const trozos: Node[] = [];
    for (const m of t.matchAll(RE_NUMERO)) {
      const n = m[0].replace(/[.,]+$/, '');
      if (!marcar.has(n)) continue;
      trozos.push(doc.createTextNode(t.slice(ultimo, m.index)));
      const mk = doc.createElement('mark');
      mk.className = 'sin-respaldo';
      mk.title = 'Esta cifra no aparece en los documentos que consultó el modelo. Compruébela antes de usarla.';
      mk.textContent = n;
      trozos.push(mk);
      ultimo = m.index! + n.length;
    }
    if (!trozos.length) continue;
    trozos.push(doc.createTextNode(t.slice(ultimo)));
    nodo.replaceWith(...trozos);
  }
  return raiz.innerHTML;
}
