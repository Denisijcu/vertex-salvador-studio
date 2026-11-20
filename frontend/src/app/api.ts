import { Injectable } from '@angular/core';

export interface Documento {
  doc_id: string; fuente?: string; epoca?: string; tipo?: string; texto?: string; url?: string; coleccion?: string;
}
export interface Paso { herramienta: string; argumentos: Record<string, unknown>; ms?: number; documentos?: string[]; }
export interface Turno {
  conversacion_id?: string; pregunta: string; respuesta: string; herramientas: Paso[]; fuentes: Documento[];
  cifras_sin_respaldo: string[]; avisos: string[]; portero: { veredicto: string; detalle: string[] };
  error: boolean; bloqueado: boolean; segundos: number;
}
export interface Resumen { id: string; titulo: string; actualizada?: string; turnos?: number; }
export type Evento =
  | { tipo: 'conversacion'; conversacion_id: string }
  | { tipo: 'estado'; texto: string }
  | { tipo: 'pensando' }
  | { tipo: 'reinicio' }
  | { tipo: 'texto'; delta: string }
  | ({ tipo: 'herramienta' } & Paso)
  | ({ tipo: 'herramienta_fin' } & Paso)
  | { tipo: 'fin'; turno: Turno };

/** Todo pasa por el backend local (puerto 8710). En desarrollo, ng serve lo redirige con proxy.conf.json. */
@Injectable({ providedIn: 'root' })
export class Api {
  async get<T>(ruta: string): Promise<T> {
    const r = await fetch(`/api${ruta}`);
    if (!r.ok) throw new Error(await this.mensaje(r));
    return r.json();
  }

  async enviar<T>(metodo: 'POST' | 'DELETE', ruta: string, cuerpo?: unknown): Promise<T> {
    const r = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: cuerpo instanceof FormData || cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo instanceof FormData ? cuerpo : cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    if (!r.ok) throw new Error(await this.mensaje(r));
    return r.json();
  }

  /** Chat en vivo: llama a alEvento por cada evento del servidor hasta el evento «fin». */
  async conversar(mensaje: string, conversacionId: string | null, alEvento: (e: Evento) => void,
                  senal?: AbortSignal): Promise<void> {
    const r = await fetch('/api/chat/stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: senal,
      body: JSON.stringify({ mensaje, conversacion_id: conversacionId }),
    });
    if (!r.ok || !r.body) throw new Error(await this.mensaje(r));
    const lector = r.body.pipeThrough(new TextDecoderStream()).getReader();
    let resto = '';
    for (;;) {
      const { value, done } = await lector.read();
      if (done) break;
      resto += value;
      let corte: number;
      while ((corte = resto.indexOf('\n\n')) >= 0) {
        const bloque = resto.slice(0, corte);
        resto = resto.slice(corte + 2);
        for (const linea of bloque.split('\n')) {
          if (linea.startsWith('data:')) alEvento(JSON.parse(linea.slice(5)));
        }
      }
    }
  }

  private async mensaje(r: Response): Promise<string> {
    try {
      const d = await r.json();
      return typeof d.detail === 'string' ? d.detail : `Error ${r.status}`;
    } catch {
      return r.status ? `Error ${r.status}` : 'El backend no responde. ¿Está abierto iniciar.bat?';
    }
  }
}

/** Nombres de las herramientas, en palabras de usuario. */
export function describirPaso(p: Paso): string {
  const a = p.argumentos as Record<string, string>;
  switch (p.herramienta) {
    case 'buscar_documentos': return `Buscó «${a['consulta'] ?? ''}»`;
    case 'leer_documento': return `Leyó el documento ${a['doc_id'] ?? ''}`;
    case 'consultar_cifras': return `Consultó las cifras de ${String(a['metrica'] ?? '').replaceAll('_', ' ')}`;
    case 'linea_tiempo': return a['epoca'] ? `Ordenó la línea de tiempo de ${a['epoca']}`
      : `Ordenó la línea de tiempo ${a['desde'] ?? ''}–${a['hasta'] ?? ''}`;
    default: return p.herramienta;
  }
}
