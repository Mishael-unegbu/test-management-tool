import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <header style="padding: 16px 24px; background: #1f2937; color: #fff; display: flex; align-items: center; gap: 24px;">
      <h1 style="margin: 0; font-size: 20px;">QA Management Tool</h1>
      <nav style="display: flex; gap: 16px;">
        <a routerLink="/" style="color: #cbd5e1; text-decoration: none; font-size: 14px;">Projects</a>
        <a routerLink="/user-stories" style="color: #cbd5e1; text-decoration: none; font-size: 14px;">User Stories</a>
        <a routerLink="/test-cases" style="color: #cbd5e1; text-decoration: none; font-size: 14px;">Test Cases</a>
      </nav>
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {}
