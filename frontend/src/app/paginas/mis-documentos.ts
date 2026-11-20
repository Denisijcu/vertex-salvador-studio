import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api } from '../api';

interface Archivo { nombre: string; bytes: number; }

@Component({
  selector: 'app-mis-documentos',
  imports: [MatButtonModule, MatIconButton],
  template: `
    <div class="pagina">
      <h1>Mis documentos</h1>
      <p class="ayuda">Documentos suyos que el modelo puede consultar además de la biblioteca pública: informes, notas,
        actas. Se quedan en esta computadora y no se suben a ningún sitio. Formatos: .txt, .md, .pdf y .docx.</p>
      <label class="subir" [class.ocupado]="subiendo()">
        <input type="file" accept=".txt,.md,.pdf,.docx" multiple (change)="subir($event)" [disabled]="subiendo()" />
        <span class="material-symbols-outlined" aria-hidden="true">upload_file</span>
        {{ subiendo() ? 'Añadiendo…' : 'Añadir documentos' }}
      </label>
      @if (error()) { <p class="error">{{ error() }}</p> }
      <ul>
        @for (a of archivos(); track a.nombre) {
          <li>
            <span class="material-symbols-outlined" aria-hidden="true">draft</span>
            <span class="nombre">{{ a.nombre }}</span>
            <span class="peso">{{ peso(a.bytes) }}</span>
            <button matIconButton (click)="quitar(a)" [attr.aria-label]="'Quitar ' + a.nombre"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>
          </li>
        } @empty {
          <li class="vacio">Todavía no hay documentos suyos. El modelo usa solo la biblioteca pública.</li>
        }
      </ul>
      <p class="nota">Para que el modelo los use, pídale en el chat que busque en sus documentos, por ejemplo:
        «Busca en mis documentos lo que dice el acta de marzo».</p>
    </div>
  `,
  styles: `
    .pagina { padding: 32px clamp(16px, 4vw, 56px); max-width: 760px; }
    h1 { font-size: 32px; }
    .ayuda { color: var(--vs-tenue); margin: 6px 0 22px; max-width: 64ch; }
    .subir { display: inline-flex; align-items: center; gap: 8px; background: var(--vs-cobalto); color: #fff; border-radius: 20px; padding: 10px 20px; font-weight: 500; cursor: pointer; }
    .subir:focus-within { outline: 2px solid var(--vs-cobalto); outline-offset: 2px; }
    .subir.ocupado { opacity: .7; cursor: progress; }
    .subir input { position: absolute; width: 1px; height: 1px; opacity: 0; }
    ul { list-style: none; padding: 0; margin: 24px 0; background: var(--vs-hoja); border: 1px solid var(--vs-borde); border-radius: 10px; }
    li { display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border-bottom: 1px solid #edf0f4; }
    li:last-child { border-bottom: 0; }
    .nombre { flex: 1; overflow: hidden; text-overflow: ellipsis; }
    .peso { color: var(--vs-tenue); font-size: 13px; font-variant-numeric: tabular-nums; }
    .vacio { color: var(--vs-tenue); padding: 16px 14px; }
    .nota { color: var(--vs-tenue); font-size: 14px; }
    .error { color: #8c1d18; }
  `,
})
export class MisDocumentos implements OnInit {
  private api = inject(Api);
  private aviso = inject(MatSnackBar);
  protected archivos = signal<Archivo[]>([]);
  protected subiendo = signal(false);
  protected error = signal('');

  async ngOnInit() { await this.cargar(); }

  private async cargar() {
    try { this.archivos.set(await this.api.get<Archivo[]>('/mis-documentos')); }
    catch (e) { this.error.set((e as Error).message); }
  }

  protected peso(b: number) { return b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`; }

  protected async subir(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const lista = Array.from(input.files ?? []);
    if (!lista.length) return;
    this.subiendo.set(true);
    this.error.set('');
    let bien = 0;
    for (const f of lista) {
      const datos = new FormData();
      datos.append('archivo', f);
      try { await this.api.enviar('POST', '/mis-documentos', datos); bien++; }
      catch (e) { this.error.set(`${f.name}: ${(e as Error).message}`); }
    }
    input.value = '';
    this.subiendo.set(false);
    await this.cargar();
    if (bien) this.aviso.open(bien === 1 ? 'Documento añadido' : `${bien} documentos añadidos`, undefined, { duration: 3000 });
  }

  protected async quitar(a: Archivo) {
    try {
      await this.api.enviar('DELETE', `/mis-documentos/${encodeURIComponent(a.nombre)}`);
      await this.cargar();
      this.aviso.open('Documento quitado', undefined, { duration: 3000 });
    } catch (e) { this.error.set((e as Error).message); }
  }
}
