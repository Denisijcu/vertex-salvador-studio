import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  // Rutas con # para que el backend sirva la interfaz desde una sola página sin reglas extra.
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes, withComponentInputBinding(), withHashLocation())],
};
