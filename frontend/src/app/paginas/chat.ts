import { Component, computed, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Api, describirPaso, Documento, Paso, Resumen, Turno } from '../api';
import { respuestaHtml } from '../texto';
import { DocumentoDialogo } from './documento-dialogo';

interface EnCurso { pregunta: string; pasos: (Paso & { hecho: boolean })[]; texto: string; estado: string; }

@Component({
  selector: 'app-chat',
  imports: [FormsModule, MatButtonModule, MatIconButton, MatTooltipModule, MatProgressSpinnerModule, CdkTextareaAutosize],
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
})
export class Chat {
  private api = inject(Api);
  protected router = inject(Router);
  private location = inject(Location);
  private dialogo = inject(MatDialog);
  private sanitizer = inject(DomSanitizer);

  readonly id = input<string>();
  protected conversaciones = signal<Resumen[]>([]);
  protected turnos = signal<Turno[]>([]);
  protected enCurso = signal<EnCurso | null>(null);
  protected borrador = '';
  protected seleccion = signal<number | null>(null);      // turno cuyo expediente se muestra
  protected errorCarga = signal('');
  private actual: string | null = null;
  protected conversacionActual = signal<string | null>(null);
  private corte: AbortController | null = null;
  private hilo = viewChild<ElementRef<HTMLElement>>('hilo');

  protected readonly describir = describirPaso;
  protected readonly ejemplos = [
    '¿Qué fue la tregua entre pandillas de 2012?',
    '¿Cuántos homicidios hubo en 2015 y en 2025, según las fuentes?',
    '¿Qué critican las organizaciones de derechos humanos del régimen de excepción?',
    '¿Qué hace El Salvador en Haití?',
  ];

  protected expediente = computed(() => {
    const t = this.turnos();
    const i = this.seleccion() ?? t.length - 1;
    const turno = t[i] ?? null;
    return turno && !turno.error && !turno.bloqueado ? turno : null;
  });

  constructor() {
    effect(() => { void this.abrir(this.id() ?? null); });
    void this.refrescarLista();
  }

  private async refrescarLista() {
    try { this.conversaciones.set(await this.api.get<Resumen[]>('/conversaciones')); } catch { /* el aviso global ya lo dice */ }
  }

  private async abrir(id: string | null) {
    if (id === this.actual && (id === null || this.turnos().length)) return;
    if (this.enCurso()) return;                           // la URL cambió por la propia conversación en curso
    this.actual = id;
    this.conversacionActual.set(id);
    this.seleccion.set(null);
    this.errorCarga.set('');
    if (!id) { this.turnos.set([]); return; }
    try {
      const c = await this.api.get<{ turnos: Turno[] }>(`/conversaciones/${id}`);
      this.turnos.set(c.turnos);
      this.bajar();
    } catch (e) {
      this.turnos.set([]);
      this.errorCarga.set((e as Error).message);
    }
  }

  protected nueva() {
    if (this.enCurso()) return;
    this.actual = null;
    this.conversacionActual.set(null);
    this.turnos.set([]);
    this.seleccion.set(null);
    void this.router.navigate(['/chat']);
  }

  protected async borrar(c: Resumen, ev: Event) {
    ev.stopPropagation();
    await this.api.enviar('DELETE', `/conversaciones/${c.id}`);
    if (c.id === this.actual) this.nueva();
    await this.refrescarLista();
  }

  protected teclas(ev: KeyboardEvent) {
    if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); void this.preguntar(); }
  }

  protected usarEjemplo(t: string) { this.borrador = t; void this.preguntar(); }

  protected detener() { this.corte?.abort(); }

  protected async preguntar() {
    const pregunta = this.borrador.trim();
    if (!pregunta || this.enCurso()) return;
    this.borrador = '';
    this.seleccion.set(null);
    this.enCurso.set({ pregunta, pasos: [], texto: '', estado: '' });
    this.bajar();
    this.corte = new AbortController();
    try {
      await this.api.conversar(pregunta, this.actual, ev => {
        const c = this.enCurso();
        if (!c) return;
        switch (ev.tipo) {
          case 'conversacion':
            if (!this.actual) {
              this.actual = ev.conversacion_id;
              this.conversacionActual.set(ev.conversacion_id);
              // Solo cambia la dirección: navegar recrearía la página y cortaría la respuesta en curso.
              this.location.replaceState(`/chat/${ev.conversacion_id}`);
            }
            break;
          case 'estado': this.enCurso.set({ ...c, estado: ev.texto }); break;
          case 'pensando': this.enCurso.set({ ...c, estado: '' }); break;
          case 'reinicio': this.enCurso.set({ ...c, texto: '' }); break;
          case 'texto': this.enCurso.set({ ...c, texto: c.texto + ev.delta }); this.bajar(true); break;
          case 'herramienta': this.enCurso.set({ ...c, pasos: [...c.pasos, { ...ev, hecho: false }] }); break;
          case 'herramienta_fin': {
            const pasos = [...c.pasos];
            let k = pasos.length - 1;
            while (k >= 0 && pasos[k].hecho) k--;
            if (k >= 0) pasos[k] = { ...ev, hecho: true };
            this.enCurso.set({ ...c, pasos });
            break;
          }
          case 'fin':
            this.turnos.update(t => [...t, ev.turno]);
            this.enCurso.set(null);
            break;
        }
      }, this.corte.signal);
    } catch (e) {
      const c = this.enCurso();
      if (c) {
        const detenido = (e as Error).name === 'AbortError';
        this.turnos.update(t => [...t, {
          pregunta: c.pregunta, respuesta: detenido ? (c.texto || 'Respuesta detenida.') : (e as Error).message,
          herramientas: c.pasos, fuentes: [], cifras_sin_respaldo: [], avisos: detenido ? ['Usted detuvo la respuesta; no se guardó en la conversación.'] : [],
          portero: { veredicto: 'sin_portero', detalle: [] }, error: !detenido, bloqueado: false, segundos: 0,
        }]);
      }
    } finally {
      this.enCurso.set(null);
      this.corte = null;
      this.bajar();
      void this.refrescarLista();
    }
  }

  protected html(t: Turno): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(respuestaHtml(t.respuesta, t.cifras_sin_respaldo));
  }

  protected htmlParcial(texto: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(respuestaHtml(texto, []));
  }

  protected verDocumento(d: Documento) {
    this.dialogo.open(DocumentoDialogo, { data: d, width: '720px', maxWidth: '94vw', autoFocus: 'dialog' });
  }

  protected porId(t: Turno, id: string): Documento {
    return t.fuentes.find(f => f.doc_id === id) ?? { doc_id: id };
  }

  private bajar(soloSiAbajo = false) {
    queueMicrotask(() => requestAnimationFrame(() => {
      const el = this.hilo()?.nativeElement;
      if (!el) return;
      if (soloSiAbajo && el.scrollHeight - el.scrollTop - el.clientHeight > 160) return;
      el.scrollTop = el.scrollHeight;
    }));
  }
}
