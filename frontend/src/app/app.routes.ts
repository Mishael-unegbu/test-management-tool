import { Routes } from '@angular/router';
import { CreateProjectComponent } from './components/create-project/create-project.component';
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { TestCaseListComponent } from './components/test-case-list/test-case-list.component';
import { EditTestCaseComponent } from './components/edit-test-case/edit-test-case.component';

export const routes: Routes = [
  { path: '', component: CreateProjectComponent },
  // US-002 Edit Project (also reuses the US-003 read to pre-populate the form)
  { path: 'projects/:id/edit', component: EditProjectComponent },
  // US-016 View Test Cases (optional ?storyId= filter)
  { path: 'test-cases', component: TestCaseListComponent },
  // US-017 Edit Test Case
  { path: 'test-cases/:id/edit', component: EditTestCaseComponent },
];
