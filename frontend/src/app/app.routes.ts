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
import { ExecutionListComponent } from './components/execution-list/execution-list.component';
import { CreateExecutionComponent } from './components/create-execution/create-execution.component';
import { EditExecutionComponent } from './components/edit-execution/edit-execution.component';
import { BugListComponent } from './components/bug-list/bug-list.component';
import { CreateBugComponent } from './components/create-bug/create-bug.component';
import { EditBugComponent } from './components/edit-bug/edit-bug.component';

export const routes: Routes = [
  // Projects
  { path: '', component: ProjectListComponent },
  { path: 'projects/new', component: CreateProjectComponent },
  { path: 'projects/:id/edit', component: EditProjectComponent },
  // User Stories
  { path: 'user-stories', component: UserStoryListComponent },
  { path: 'projects/:projectId/user-stories/new', component: CreateUserStoryComponent },
  { path: 'user-stories/:id/edit', component: EditUserStoryComponent },
  // Test Cases
  { path: 'user-stories/:storyId/test-cases/new', component: CreateTestCaseComponent },
  { path: 'test-cases', component: TestCaseListComponent },
  { path: 'test-cases/:id/edit', component: EditTestCaseComponent },
  // Executions (US-014)
  { path: 'executions', component: ExecutionListComponent },
  { path: 'test-cases/:testCaseId/executions/new', component: CreateExecutionComponent },
  { path: 'executions/:id/edit', component: EditExecutionComponent },
  // Bugs (US-016, US-017, US-019)
  { path: 'bugs', component: BugListComponent },
  { path: 'executions/:executionId/bugs/new', component: CreateBugComponent },
  { path: 'test-cases/:testCaseId/bugs/new', component: CreateBugComponent },
  { path: 'bugs/:id/edit', component: EditBugComponent },
];
