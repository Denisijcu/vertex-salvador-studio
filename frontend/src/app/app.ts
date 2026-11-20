import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Api } from './api';

interface EstadoBreve { listo: boolean; contexto_ok: boolean; portero: boolean; }

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTooltipModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private api = inject(Api);
  protected estado = signal<EstadoBreve | null>(null);
  protected sinBackend = signal(false);

  protected readonly secciones = [
    { ruta: '/chat', icono: 'forum', nombre: 'Preguntar' },
    { ruta: '/linea-tiempo', icono: 'timeline', nombre: 'Línea de tiempo' },
    { ruta: '/cifras', icono: 'bar_chart', nombre: 'Cifras' },
    { ruta: '/mis-documentos', icono: 'folder_open', nombre: 'Mis documentos' },
  ];
  protected readonly secundarias = [
    { ruta: '/estado', icono: 'monitor_heart', nombre: 'Estado' },
    { ruta: '/guia', icono: 'menu_book', nombre: 'Guía' },
    { ruta: '/acerca', icono: 'info', nombre: 'Acerca de' },
  ];

  async ngOnInit() {
    try {
      this.estado.set(await this.api.get<EstadoBreve>('/estado'));
    } catch {
      this.sinBackend.set(true);
    }
  }
}
