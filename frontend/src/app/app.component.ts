import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header style="padding: 16px 24px; background: #1f2937; color: #fff;">
      <h1 style="margin: 0; font-size: 20px;">QA Management Tool</h1>
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {}
