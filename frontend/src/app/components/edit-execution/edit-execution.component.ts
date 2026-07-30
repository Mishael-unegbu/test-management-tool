import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestExecutionService } from '../../services/test-execution.service';
import { TestExecution, ExecutionEditPayload, EXECUTION_STATUSES } from '../../models/test-execution.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-014 Edit Test Execution.
 * Lives at /executions/:id/edit.
 * Loads the execution on init, pre-populates all editable fields.
 * Immutable fields (ExecutionID, TestCaseID, StoryID, ProjectID) are
 * never in the form. Shows TestCaseTitle as read-only context.
 */
@Component({
  selector: 'app-edit-execution',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-execution.component.html',
  styleUrls: ['./edit-execution.component.css'],
})
export class EditExecutionComponent implements OnInit {
  form: FormGroup;
  executionId: string | null = null;

  readonly statusOptions = EXECUTION_STATUSES;

  loading     = false;
  saving      = false;
  loadError:   string | null = null;
  saveError:   string | null = null;
  saveSuccess  = false;

  // Context — from the loaded execution; displayed above the form
  testCaseId:    number | null = null;
  testCaseTitle: string | null = null;

  // Read-only/display-only — never sent back on save. TestExecutions is
  // append-only, so this can only ever be read here, not edited. See the
  // comment in testExecutionsService.js for why. Bug.ExecutionID (set once
  // at Bug creation) is the actual source of truth for this relationship.
  linkedBugId: number | string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private executionService: TestExecutionService
  ) {
    this.form = this.fb.group({
      Status:       ['', Validators.required],
      ExecutedBy:   ['', Validators.required],
      BuildVersion: [''],
      Environment:  [''],
      ActualResult: [''],
      Notes:        [''],
    });
  }

  ngOnInit(): void {
    this.executionId = this.route.snapshot.paramMap.get('id');
    if (!this.executionId) {
      this.loadError = 'No execution ID was provided.';
      return;
    }
    this.loadExecution(this.executionId);
  }

  loadExecution(id: string): void {
    this.loading   = true;
    this.loadError = null;

    this.executionService.getExecutionById(id).subscribe({
      next: (ex: TestExecution) => {
        this.form.patchValue({
          Status:       ex.Status       ?? 'Pass',
          ExecutedBy:   ex.ExecutedBy   ?? '',
          BuildVersion: ex.BuildVersion ?? '',
          Environment:  ex.Environment  ?? '',
          ActualResult: ex.ActualResult ?? '',
          Notes:        ex.Notes        ?? '',
        });
        this.testCaseId    = ex.TestCaseID;
        this.testCaseTitle = ex.TestCaseTitle ?? null;
        this.linkedBugId   = ex.LinkedBugID ?? null;
        this.loading       = false;
      },
      error: (err) => {
        this.loadError =
          err?.status === 404
            ? `Execution "${id}" was not found.`
            : 'Failed to load execution. Please try again.';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.executionId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving      = true;
    this.saveError   = null;
    this.saveSuccess = false;

    const v = this.form.value;
    const payload: ExecutionEditPayload = {
      Status:       v.Status,
      ExecutedBy:   v.ExecutedBy,
      BuildVersion: v.BuildVersion || null,
      Environment:  v.Environment  || null,
      ActualResult: v.ActualResult || null,
      Notes:        v.Notes        || null,
    };

    this.executionService.updateExecution(this.executionId, payload).subscribe({
      next: () => {
        this.saving      = false;
        this.saveSuccess = true;
      },
      error: (err) => {
        this.saving    = false;
        this.saveError = extractErrorMessage(err, 'Failed to save changes. Please try again.');
      },
    });
  }
}
