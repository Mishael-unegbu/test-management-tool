import { Routes } from '@angular/router';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { CreateProjectComponent } from './components/create-project/create-project.component';
import { EditProjectComponent } from './components/edit-project/edit-project.component';
import { UserStoryListComponent } from './components/user-story-list/user-story-list.component';
import { CreateUserStoryComponent } from './components/create-user-story/create-user-story.component';
import { EditUserStoryComponent } from './components/edit-user-story/edit-user-story.component';
import { CreateTestCaseComponent } from './components/create-test-case/create-test-case.component';
import { TestCaseListComponent } from './components/test-case-list/test-case-list.component';
import { EditTestCaseComponent } from './components/edit-test-case/edit-test-case.component';

export const routes: Routes = [
  // Projects table — the default screen.
  { path: '', component: ProjectListComponent },
  // US-001 Create Project
  { path: 'projects/new', component: CreateProjectComponent },
  // US-002 Edit Project
  { path: 'projects/:id/edit', component: EditProjectComponent },
  // User Stories table
  { path: 'user-stories', component: UserStoryListComponent },
  // US-005 Create User Story
  { path: 'projects/:projectId/user-stories/new', component: CreateUserStoryComponent },
  // US-006 Edit User Story
  { path: 'user-stories/:id/edit', component: EditUserStoryComponent },
  // US-009 Create Test Case  ← storyId in the URL
  { path: 'user-stories/:storyId/test-cases/new', component: CreateTestCaseComponent },
  // Test Cases table (default + ?storyId=X filtered)
  { path: 'test-cases', component: TestCaseListComponent },
  // US-010 Edit Test Case
  { path: 'test-cases/:id/edit', component: EditTestCaseComponent },
];
