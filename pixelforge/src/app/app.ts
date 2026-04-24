import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallPrompt } from './shared/components/pwa-install-prompt';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallPrompt],
  template: `
    <router-outlet />
    <app-pwa-install-prompt />
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class App {}
