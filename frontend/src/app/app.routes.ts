import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'chat' },
  { path: 'chat', loadComponent: () => import('./paginas/chat').then(m => m.Chat), title: 'Preguntar' },
  { path: 'chat/:id', loadComponent: () => import('./paginas/chat').then(m => m.Chat), title: 'Preguntar' },
  { path: 'linea-tiempo', loadComponent: () => import('./paginas/linea-tiempo').then(m => m.LineaTiempo), title: 'Línea de tiempo' },
  { path: 'cifras', loadComponent: () => import('./paginas/cifras').then(m => m.Cifras), title: 'Cifras' },
  { path: 'mis-documentos', loadComponent: () => import('./paginas/mis-documentos').then(m => m.MisDocumentos), title: 'Mis documentos' },
  { path: 'estado', loadComponent: () => import('./paginas/estado').then(m => m.Estado), title: 'Estado' },
  { path: 'guia', loadComponent: () => import('./paginas/guia').then(m => m.Guia), title: 'Guía' },
  { path: 'acerca', loadComponent: () => import('./paginas/acerca').then(m => m.Acerca), title: 'Acerca de' },
  { path: '**', redirectTo: 'chat' },
];
