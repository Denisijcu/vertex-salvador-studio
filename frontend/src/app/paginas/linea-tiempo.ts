import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { Api, Documento } from '../api';
import { DocumentoDialogo } from './documento-dialogo';

interface Epoca { id: string; nombre: string; anios: string; }
interface Linea { eventos: Documento[]; total: number; nota?: string; }

@Component({
  selector: 'app-linea-tiempo',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="marco">
      <nav class="epocas" aria-label="Épocas">
        <h1>Línea de tiempo</h1>
        <p class="ayuda">Los hechos de la biblioteca, en orden. Elija una época o un rango de años.</p>
        <form class="rango" (submit)="$event.preventDefault(); porAnios()">
          <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Desde</mat-label>
            <input matInput name="desde" [(ngModel)]="desde" inputmode="numeric" maxlength="4" placeholder="2012" /></mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Hasta</mat-label>
            <input matInput name="hasta" [(ngModel)]="hasta" inputmode="numeric" maxlength="4" placeholder="2024" /></mat-form-field>
          <button mat-flat-button type="submit" [disabled]="!desde && !hasta">Ver</button>
        </form>
        <h2 class="grupo">Por épocas</h2>
        <ul>
          @for (e of cronologicas(); track e.id) {
            <li><button [class.activa]="e.id === activa()" (click)="porEpoca(e)">
              <span class="anios">{{ e.anios }}</span><span class="nombre">{{ e.nombre }}</span></button></li>
          }
        </ul>
        <h2 class="grupo">Por temas</h2>
        <ul>
          @for (e of temas(); track e.id) {
            <li><button [class.activa]="e.id === activa()" (click)="porEpoca(e)"><span class="nombre">{{ e.nombre }}</span></button></li>
          }
        </ul>
      </nav>
      <section class="eventos" aria-live="polite">
        @if (error()) { <p class="error">{{ error() }}</p> }
        @if (titulo()) { <h2>{{ titulo() }}</h2> }
        @if (linea(); as l) {
          @if (l.nota) { <p class="nota">{{ l.nota }}</p> }
          <ol>
            @for (ev of l.eventos; track ev.doc_id) {
              <li>
                <p class="texto">{{ ev.texto }}</p>
                <button class="fuente" (click)="ver(ev)">{{ ev.fuente }} <span>{{ ev.doc_id }}</span></button>
              </li>
            } @empty { <p class="nota">No hay hechos registrados en ese rango.</p> }
          </ol>
        } @else if (!error()) {
          <p class="nota">Elija una época a la izquierda.</p>
        }
      </section>
    </div>
  `,
  styles: `
    .marco { display: grid; grid-template-columns: 340px minmax(0, 1fr); min-height: 100%; }
    .epocas { border-right: 1px solid var(--vs-borde); padding: 28px 16px; background: var(--vs-hoja); position: sticky; top: 0; align-self: start; max-height: 100dvh; overflow: auto; box-sizing: border-box; }
    h1 { font-size: 28px; padding: 0 8px; }
    .ayuda { color: var(--vs-tenue); font-size: 14px; padding: 0 8px; margin: 6px 0 16px; }
    .rango { display: flex; gap: 8px; align-items: center; padding: 0 8px 16px; }
    .rango mat-form-field { width: 96px; }
    ul { list-style: none; margin: 0; padding: 0; }
    .grupo { font: 600 13px var(--vs-sans); color: var(--vs-tenue); padding: 0 8px; margin: 18px 0 6px; }
    li button { display: block; width: 100%; text-align: left; border: 0; background: none; padding: 9px 8px; border-radius: 8px; cursor: pointer; font: inherit; color: inherit; }
    li button:hover { background: #f0f3f8; }
    li button.activa { background: #dbe4f6; }
    .anios { display: block; font-size: 12px; color: var(--vs-cobalto); font-weight: 600; font-variant-numeric: tabular-nums; }
    .nombre { display: block; font-size: 14px; line-height: 1.35; }
    .eventos { padding: 32px clamp(16px, 4vw, 56px); }
    .eventos h2 { font-size: 26px; max-width: 30ch; margin-bottom: 24px; }
    .eventos ol { list-style: none; margin: 0; padding: 0 0 0 22px; border-left: 2px solid #c9d4ea; max-width: 72ch; }
    .eventos li { position: relative; padding: 0 0 26px 0; }
    .eventos li::before { content: ''; position: absolute; left: -29px; top: 9px; width: 12px; height: 12px; border-radius: 50%; background: var(--vs-hoja); border: 2px solid var(--vs-cobalto); }
    .texto { font: 400 17px/1.65 var(--vs-serif); margin: 0 0 6px; }
    .fuente { border: 0; background: none; padding: 0; font: 13px var(--vs-sans); color: var(--vs-tenue); cursor: pointer; text-align: left; }
    .fuente:hover { color: var(--vs-cobalto); text-decoration: underline; }
    .fuente span { color: var(--vs-cobalto); margin-left: 6px; }
    .nota { color: var(--vs-tenue); }
    .error { color: #8c1d18; }
    @media (max-width: 900px) { .marco { grid-template-columns: 1fr; } .epocas { position: static; max-height: none; border-right: 0; border-bottom: 1px solid var(--vs-borde); } }
  `,
})
export class LineaTiempo implements OnInit {
  private api = inject(Api);
  private dialogo = inject(MatDialog);
  protected epocas = signal<Epoca[]>([]);
  protected cronologicas = computed(() => this.epocas().filter(e => !e.id.startsWith('T')));
  protected temas = computed(() => this.epocas().filter(e => e.id.startsWith('T')));
  protected linea = signal<Linea | null>(null);
  protected activa = signal('');
  protected titulo = signal('');
  protected error = signal('');
  protected desde = '';
  protected hasta = '';

  async ngOnInit() {
    try { this.epocas.set(await this.api.get<Epoca[]>('/epocas')); } catch (e) { this.error.set((e as Error).message); }
  }

  protected async porEpoca(e: Epoca) {
    this.activa.set(e.id);
    this.titulo.set(e.nombre);
    await this.cargar(`epoca=${e.id}`);
  }

  protected async porAnios() {
    this.activa.set('');
    this.titulo.set(`De ${this.desde || 'el principio'} a ${this.hasta || 'hoy'}`);
    const q = new URLSearchParams();
    if (this.desde) q.set('desde', this.desde);
    if (this.hasta) q.set('hasta', this.hasta);
    await this.cargar(q.toString());
  }

  private async cargar(q: string) {
    this.error.set('');
    try { this.linea.set(await this.api.get<Linea>(`/linea-tiempo?${q}`)); }
    catch (e) { this.linea.set(null); this.error.set((e as Error).message); }
  }

  protected ver(d: Documento) { this.dialogo.open(DocumentoDialogo, { data: d, width: '720px', maxWidth: '94vw' }); }
}
