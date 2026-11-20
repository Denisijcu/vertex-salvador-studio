import { Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Api, Documento } from '../api';

@Component({
  selector: 'app-documento-dialogo',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ doc()?.fuente || datos.doc_id }}</h2>
    <mat-dialog-content>
      <p class="ficha">{{ datos.doc_id }}@if (doc()?.epoca) {<span>, época {{ doc()!.epoca }}</span>}
        @if (doc()?.coleccion === 'privada') {<span>, documento suyo</span>}</p>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @else if (doc()) { <p class="texto">{{ doc()!.texto }}</p> }
      @else { <p class="ficha">Cargando…</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (doc()?.url) {
        <a mat-button [href]="doc()!.url" target="_blank" rel="noopener">Abrir la fuente original</a>
      }
      <button mat-flat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .ficha { color: var(--vs-tenue); font-size: 13px; margin: 0 0 12px; }
    .texto { font: 400 17px/1.65 var(--vs-serif); max-width: 62ch; margin: 0; white-space: pre-wrap; }
    .error { color: #8c1d18; }
  `,
})
export class DocumentoDialogo implements OnInit {
  protected datos = inject<Documento>(MAT_DIALOG_DATA);
  private api = inject(Api);
  protected doc = signal<Documento | null>(null);
  protected error = signal('');

  async ngOnInit() {
    if (this.datos.texto && this.datos.tipo === 'cifra') { this.doc.set(this.datos); }
    try { this.doc.set({ ...this.datos, ...(await this.api.get<Documento>(`/documentos/${encodeURIComponent(this.datos.doc_id)}`)) }); }
    catch (e) { if (!this.doc()) this.error.set((e as Error).message); }
  }
}
