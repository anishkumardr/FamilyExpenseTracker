import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';


bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(MatIconModule),
    provideHttpClient(withInterceptorsFromDi()),provideAnimations(), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000',
            
          })  // <-- add this
  ]
});
