import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project, PROJECT_STATUSES } from '../../models/project.model';

/** Extracts a human-readable message from either backend error shape:
 *  - validation failures: { errors: string[] }        (400, from the validator)
 *  - service-level failures: { error: string }         (409 / 500)
 */
function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { error?: { errors?: string[]; error?: string } })?.error;
  if (body?.errors?.length) return body.errors.join(' ');
  if (body?.error) return body.error;
  return fallback;
}

/**
 * US-001 Create Project
 * As a QA user, I want to create a new project so that user stories,
 * test cases, and bugs can be organized under it.
 */
@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css'],
})
export class CreateProjectComponent {
  @Output() created = new EventEmitter<Project>();

  // Same vocabulary Edit Project uses — see PROJECT_STATUSES's doc comment
  // in project.model.ts.
  readonly allowedStatuses = PROJECT_STATUSES;

  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdProjectId: number | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder, private projectService: ProjectService) {
    // Built in the constructor (not as a field initializer) so it runs after
    // `fb` is assigned — with this project's tsconfig (target: ES2022, which
    // implies useDefineForClassFields), a field initializer referencing
    // `this.fb` executes before the constructor-parameter property is set
    // and fails to compile ("Property 'fb' is used before its
    // initialization"). Same pattern Edit Project already uses correctly.
    this.form = this.fb.group({
      projectName: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      status: ['Active'],
      startDate: [''],
      endDate: [''],
    });
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdProjectId = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const value = this.form.getRawValue();

    this.projectService
      .createProject({
        projectName: value.projectName!.trim(),
        description: value.description ?? '',
        status: value.status ?? 'Active',
        startDate: value.startDate ?? '',
        endDate: value.endDate ?? '',
      })
      .subscribe({
        next: (project) => {
          this.submitting = false;
          this.successMessage = `Project "${project.ProjectName}" created with ID ${project.ProjectID}.`;
          this.createdProjectId = project.ProjectID;
          this.created.emit(project);
          this.form.reset({ projectName: '', description: '', status: 'Active', startDate: '', endDate: '' });
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = extractErrorMessage(err, 'Failed to create project. Please try again.');
        },
      });
  }
}
