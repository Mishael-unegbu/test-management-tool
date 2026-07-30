import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BugService } from '../../services/bug.service';
import { Bug, BugEditPayload, BUG_SEVERITIES, BUG_STATUSES, BUG_PRIORITIES } from '../../models/bug.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-017 Edit Bug.
 * Lives at /bugs/:id/edit.
 * Immutable fields (BugID, ProjectID, StoryID, TestCaseID, ExecutionID,
 * Reporter, ReportedDate) are never in the form.
 * Shows TestCaseTitle and ExecutionID as read-only context.
 */
@Component({
  selector: 'app-edit-bug',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-bug.component.html',
  styleUrls: ['./edit-bug.component.css'],
})
export class EditBugComponent implements OnInit {
  form: FormGroup;
  bugId: string | null = null;

  readonly severityOptions = BUG_SEVERITIES;
  readonly statusOptions   = BUG_STATUSES;
  readonly priorityOptions = BUG_PRIORITIES;

  loading     = false;
  saving      = false;
  loadError:   string | null = null;
  saveError:   string | null = null;
  saveSuccess  = false;

  // Read-only context shown above the form
  testCaseId:    number | null = null;
  testCaseTitle: string | null = null;
  executionId:   number | string | null = null;
  reporter:      string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private bugService: BugService
  ) {
    this.form = this.fb.group({
      Title:            ['', Validators.required],
      Severity:         [''],
      Priority:         [''],
      Status:           ['', Validators.required],
      Description:      [''],
      StepsToReproduce: [''],
      ExpectedResult:   [''],
      ActualResult:     [''],
    });
  }

  ngOnInit(): void {
    this.bugId = this.route.snapshot.paramMap.get('id');
    if (!this.bugId) { this.loadError = 'No bug ID was provided.'; return; }
    this.loadBug(this.bugId);
  }

  loadBug(id: string): void {
    this.loading   = true;
    this.loadError = null;

    this.bugService.getBugById(id).subscribe({
      next: (bug: Bug) => {
        this.form.patchValue({
          Title:            bug.Title,
          Severity:         bug.Severity         ?? '',
          Priority:         bug.Priority         ?? '',
          Status:           bug.Status           ?? 'Open',
          Description:      bug.Description      ?? '',
          StepsToReproduce: bug.StepsToReproduce ?? '',
          ExpectedResult:   bug.ExpectedResult   ?? '',
          ActualResult:     bug.ActualResult     ?? '',
        });
        this.testCaseId    = bug.TestCaseID;
        this.testCaseTitle = bug.TestCaseTitle ?? null;
        this.executionId   = bug.ExecutionID   ?? null;
        this.reporter      = bug.Reporter      ?? null;
        this.loading       = false;
      },
      error: (err) => {
        this.loadError = err?.status === 404
          ? `Bug "${id}" was not found.`
          : 'Failed to load bug. Please try again.';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.bugId) { this.form.markAllAsTouched(); return; }
    this.saving      = true;
    this.saveError   = null;
    this.saveSuccess = false;

    const v = this.form.value;
    const payload: BugEditPayload = {
      Title:            v.Title,
      Severity:         v.Severity         || undefined,
      Priority:         v.Priority         || undefined,
      Status:           v.Status,
      Description:      v.Description      || null,
      StepsToReproduce: v.StepsToReproduce || null,
      ExpectedResult:   v.ExpectedResult   || null,
      ActualResult:     v.ActualResult     || null,
    };

    this.bugService.updateBug(this.bugId, payload).subscribe({
      next: () => { this.saving = false; this.saveSuccess = true; },
      error: (err) => {
        this.saving    = false;
        this.saveError = extractErrorMessage(err, 'Failed to save changes. Please try again.');
      },
    });
  }
}
