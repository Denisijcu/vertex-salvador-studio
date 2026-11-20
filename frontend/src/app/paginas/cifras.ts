import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Api, Documento } from '../api';
import { DocumentoDialogo } from './documento-dialogo';

interface Fila { periodo: string; valor: string; atribucion: string; doc_id: string; fuente: string; }

const NOMBRES: Record<string, string> = {
  homicidios: 'Homicidios', detenciones_regimen: 'Detenciones del régimen de excepción', prorrogas: 'Prórrogas del régimen',
  muertes_custodia: 'Muertes bajo custodia', presos_politicos: 'Presos políticos', elecciones_presidenciales: 'Elecciones presidenciales',
  detenciones_mano_dura: 'Detenciones de Mano Dura', victimas_guerra_civil: 'Víctimas de la guerra civil',
  ayuda_eeuu_guerra: 'Ayuda de EE. UU. durante la guerra', despliegue_haiti: 'Despliegue en Haití',
};

@Component({
  selector: 'app-cifras',
  template: `
    <div class="pagina">
      <h1>Cifras</h1>
      <p class="ayuda">Cada número con quién lo da. Si dos fuentes no coinciden, aparecen las dos.</p>
      <div class="metricas" role="tablist">
        @for (m of metricas(); track m) {
          <button role="tab" [attr.aria-selected]="m === activa()" [class.activa]="m === activa()" (click)="elegir(m)">{{ nombre(m) }}</button>
        }
      </div>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (filas().length) {
        <table>
          <thead><tr><th scope="col">Periodo</th><th scope="col">Valor</th><th scope="col">Según</th><th scope="col">Documento</th></tr></thead>
          <tbody>
            @for (f of filas(); track $index) {
              <tr>
                <td class="periodo">{{ f.periodo }}</td>
                <td class="valor">{{ f.valor }}</td>
                <td>{{ f.atribucion }}</td>
                <td><button class="doc" (click)="ver(f)" [title]="f.fuente">{{ f.doc_id }}</button></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: `
    .pagina { padding: 32px clamp(16px, 4vw, 56px); max-width: 1000px; }
    h1 { font-size: 32px; }
    .ayuda { color: var(--vs-tenue); margin: 6px 0 20px; }
    .metricas { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
    .metricas button { border: 1px solid var(--vs-borde); background: var(--vs-hoja); border-radius: 8px; padding: 7px 14px; font: 500 14px var(--vs-sans); color: var(--vs-tinta); cursor: pointer; }
    .metricas button.activa { background: #dbe4f6; border-color: #b9c8ea; color: var(--vs-cobalto); }
    table { width: 100%; border-collapse: collapse; background: var(--vs-hoja); border: 1px solid var(--vs-borde); border-radius: 10px; overflow: hidden; }
    th { text-align: left; font: 600 13px var(--vs-sans); color: var(--vs-tenue); padding: 10px 14px; border-bottom: 1px solid var(--vs-borde); background: #f8f9fb; }
    td { padding: 10px 14px; border-bottom: 1px solid #edf0f4; vertical-align: top; font-size: 14px; }
    .periodo { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .valor { font: 600 16px var(--vs-serif); }
    .doc { border: 0; background: none; color: var(--vs-cobalto); font: 600 13px var(--vs-sans); cursor: pointer; padding: 0; }
    .error { color: #8c1d18; }
  `,
})
export class Cifras implements OnInit {
  private api = inject(Api);
  private dialogo = inject(MatDialog);
  protected metricas = signal<string[]>([]);
  protected activa = signal('');
  protected filas = signal<Fila[]>([]);
  protected error = signal('');

  protected nombre(m: string) { return NOMBRES[m] ?? m.replaceAll('_', ' '); }

  async ngOnInit() {
    try {
      const m = await this.api.get<string[]>('/cifras');
      this.metricas.set(m);
      if (m.length) await this.elegir(m.includes('homicidios') ? 'homicidios' : m[0]);
    } catch (e) { this.error.set((e as Error).message); }
  }

  protected async elegir(m: string) {
    this.activa.set(m);
    try { this.filas.set((await this.api.get<{ filas: Fila[] }>(`/cifras/${m}`)).filas ?? []); }
    catch (e) { this.error.set((e as Error).message); }
  }

  protected ver(f: Fila) {
    const d: Documento = { doc_id: f.doc_id, fuente: f.fuente };
    this.dialogo.open(DocumentoDialogo, { data: d, width: '720px', maxWidth: '94vw' });
  }
}
