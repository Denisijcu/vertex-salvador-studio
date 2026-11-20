import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Api } from '../api';

interface EstadoCompleto {
  lmstudio: { ok: boolean; lmstudio?: boolean; clave?: string; cargado?: boolean; contexto?: number; mensaje?: string };
  contexto_minimo: number; contexto_ok: boolean; portero: boolean;
  biblioteca: { ok: boolean; fragmentos?: number; fuentes?: number; privados?: number; fecha_corte?: string; mensaje?: string };
  listo: boolean;
}

@Component({
  selector: 'app-estado',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="pagina">
      <h1>Estado</h1>
      <p class="ayuda">Las piezas que necesita el asistente para responder, y si están funcionando.</p>
      @if (error()) { <p class="fila mal">{{ error() }}</p> }
      @if (e(); as e) {
        <dl>
          <div class="fila" [class.bien]="e.lmstudio.lmstudio" [class.mal]="!e.lmstudio.lmstudio">
            <dt>LM Studio</dt>
            <dd>{{ e.lmstudio.lmstudio ? 'Responde en el puerto 1234.' : e.lmstudio.mensaje }}</dd>
          </div>
          <div class="fila" [class.bien]="e.lmstudio.ok" [class.mal]="e.lmstudio.lmstudio && !e.lmstudio.ok">
            <dt>Modelo</dt>
            <dd>@if (e.lmstudio.ok) { {{ e.lmstudio.clave }}, {{ e.lmstudio.cargado ? 'cargado' : 'sin cargar (se carga solo con la primera pregunta)' }}. }
                @else if (e.lmstudio.lmstudio) { {{ e.lmstudio.mensaje }} } @else { — }</dd>
          </div>
          <div class="fila" [class.bien]="e.contexto_ok" [class.regular]="e.lmstudio.cargado && !e.contexto_ok">
            <dt>Memoria de la conversación</dt>
            <dd>@if (e.lmstudio.cargado) {
                  {{ e.lmstudio.contexto }} tokens{{ e.contexto_ok ? '.' : '; hacen falta ' + e.contexto_minimo + ' para conversaciones largas.' }}
                } @else { Se pondrá en {{ e.contexto_minimo }} tokens al cargar el modelo. }</dd>
          </div>
          <div class="fila" [class.bien]="e.portero">
            <dt>Portero</dt>
            <dd>{{ e.portero ? 'Activo: revisa cada pregunta y cada respuesta.' : 'No está en marcha. El asistente funciona igual, sin esa revisión.' }}</dd>
          </div>
          <div class="fila" [class.bien]="e.biblioteca.ok" [class.mal]="!e.biblioteca.ok">
            <dt>Biblioteca</dt>
            <dd>@if (e.biblioteca.ok) { {{ e.biblioteca.fragmentos }} fragmentos de {{ e.biblioteca.fuentes }} fuentes públicas{{ e.biblioteca.privados ? ', más ' + e.biblioteca.privados + ' trozos de sus documentos' : '' }}. Al día hasta el {{ fecha(e.biblioteca.fecha_corte) }}. }
                @else { {{ e.biblioteca.mensaje }} }</dd>
          </div>
        </dl>
        <div class="acciones">
          <button mat-stroked-button (click)="cargarEstado()" [disabled]="ocupado()">Comprobar de nuevo</button>
          @if (e.lmstudio.ok && !e.contexto_ok) {
            <button mat-flat-button (click)="recargar()" [disabled]="ocupado()">
              {{ e.lmstudio.cargado ? 'Recargar el modelo con ' + e.contexto_minimo + ' tokens' : 'Cargar el modelo ahora' }}
            </button>
          }
          @if (ocupado()) { <mat-spinner diameter="22" /> }
        </div>
        @if (mensaje()) { <p class="ayuda">{{ mensaje() }}</p> }
      } @else if (!error()) { <mat-spinner diameter="28" /> }
    </div>
  `,
  styles: `
    .pagina { padding: 32px clamp(16px, 4vw, 56px); max-width: 760px; }
    h1 { font-size: 32px; }
    .ayuda { color: var(--vs-tenue); margin: 6px 0 22px; }
    dl { margin: 0; background: var(--vs-hoja); border: 1px solid var(--vs-borde); border-radius: 10px; }
    .fila { display: grid; grid-template-columns: 220px 1fr; gap: 12px; padding: 14px 16px 14px 34px; border-bottom: 1px solid #edf0f4; position: relative; }
    .fila:last-child { border-bottom: 0; }
    .fila::before { content: ''; position: absolute; left: 14px; top: 21px; width: 9px; height: 9px; border-radius: 50%; background: #aab2bf; }
    .fila.bien::before { background: var(--vs-jade); }
    .fila.regular::before { background: #d08c1a; }
    .fila.mal::before { background: #c2410c; }
    dt { font-weight: 600; }
    dd { margin: 0; }
    p.fila { display: block; background: #fde8e6; border-radius: 10px; }
    .acciones { display: flex; align-items: center; gap: 12px; margin-top: 20px; }
    @media (max-width: 640px) { .fila { grid-template-columns: 1fr; gap: 2px; } }
  `,
})
export class Estado implements OnInit {
  private api = inject(Api);
  protected e = signal<EstadoCompleto | null>(null);
  protected error = signal('');
  protected ocupado = signal(false);
  protected mensaje = signal('');

  async ngOnInit() { await this.cargarEstado(); }

  protected fecha(iso?: string) {
    return iso ? new Date(iso + 'T12:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }

  protected async cargarEstado() {
    this.error.set('');
    try { this.e.set(await this.api.get<EstadoCompleto>('/estado')); }
    catch (err) { this.error.set((err as Error).message); }
  }

  protected async recargar() {
    this.ocupado.set(true);
    this.mensaje.set('Cargando el modelo en LM Studio. Puede tardar un minuto.');
    try { await this.api.enviar('POST', '/modelo/cargar'); this.mensaje.set('Modelo cargado.'); }
    catch (err) { this.mensaje.set((err as Error).message); }
    this.ocupado.set(false);
    await this.cargarEstado();
  }
}
