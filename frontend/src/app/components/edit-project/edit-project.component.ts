import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectEditPayload, PROJECT_STATUSES } from '../../models/project.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-002 Edit Project
 * As a QA user, I want to edit an existing project's details so that
 * project information stays accurate over time.
 */

function endDateNotBeforeStartDate(group: AbstractControl): ValidationErrors | null {
  const start = group.get('StartDate')?.value;
  const end = group.get('EndDate')?.value;
  if (!start || !end) return null;
  return new Date(end) < new Date(start) ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css'],
})
export class EditProjectComponent implements OnInit {
  form: FormGroup;
  projectId: string | null = null;

  // Same vocabulary Create Project uses, and what the backend actually
  // validates against — see PROJECT_STATUSES's doc comment in project.model.ts.
  readonly allowedStatuses = PROJECT_STATUSES;

  loading = false;
  saving = false;
  loadError: string | null = null;
  saveError: string | null = null;
  saveSuccess = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {
    this.form = this.fb.group(
      {
        ProjectName: ['', [Validators.required, Validators.maxLength(200)]],
        Description: [''],
        Status: ['', Validators.required],
        StartDate: [''],
        EndDate: [''],
      },
      { validators: endDateNotBeforeStartDate }
    );
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (!this.projectId) {
      this.loadError = 'No project ID was provided.';
      return;
    }
    this.loadProject(this.projectId);
  }

  loadProject(id: string): void {
    this.loading = true;
    this.loadError = null;

    this.projectService.getProjectById(id).subscribe({
      next: (project: Project) => {
        this.form.patchValue({
          ProjectName: project.ProjectName,
          Description: project.Description ?? '',
          Status: project.Status,
          StartDate: this.toDateInputValue(project.StartDate ?? null),
          EndDate: this.toDateInputValue(project.EndDate ?? null),
        });
        this.loading = false;
      },
      error: (err) => {
        this.loadError =
          err?.status === 404 ? `Project "${id}" was not found.` : 'Failed to load project. Please try again.';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.projectId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = null;
    this.saveSuccess = false;

    const payload: ProjectEditPayload = {
      ProjectName: this.form.value.ProjectName,
      Description: this.form.value.Description || null,
      Status: this.form.value.Status,
      StartDate: this.form.value.StartDate || null,
      EndDate: this.form.value.EndDate || null,
    };

    this.projectService.updateProject(this.projectId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
      },
      error: (err) => {
        this.saving = false;
        this.saveError = extractErrorMessage(err, 'Failed to save changes. Please try again.');
      },
    });
  }

  private toDateInputValue(value: string | null): string {
    if (!value) return '';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  }
}
