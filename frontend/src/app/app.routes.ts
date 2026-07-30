import { Routes } from '@angular/router';
import { CreateProjectComponent } from './components/create-project/create-project.component';
import { EditProjectComponent } from './components/edit-project/edit-project.component';

export const routes: Routes = [
  { path: '', component: CreateProjectComponent },
  // US-002 Edit Project (also reuses the US-003 read to pre-populate the form)
  { path: 'projects/:id/edit', component: EditProjectComponent },
];
