import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BugService } from '../../services/bug.service';
import { TestCaseService } from '../../services/test-case.service';
import { TestExecutionService } from '../../services/test-execution.service';
import { BUG_SEVERITIES, BUG_STATUSES, BUG_PRIORITIES } from '../../models/bug.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-016 Report Bug (create).
 * Reachable via two routes:
 *   /test-cases/:testCaseId/bugs/new        — filed against a test case
 *   /executions/:executionId/bugs/new       — filed against a specific execution (US-019)
 * In both cases testCaseId is resolved and shown as read-only context.
 * When executionId is present it is included in the payload.
 */
@Component({
  selector: 'app-create-bug',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-bug.component.html',
  styleUrls: ['./create-bug.component.css'],
})
export class CreateBugComponent implements OnInit {
  testCaseId:   string | null = null;
  executionId:  string | null = null;
  testCaseTitle: string | null = null;
  contextLoadError: string | null = null;

  readonly severityOptions = BUG_SEVERITIES;
  readonly statusOptions   = BUG_STATUSES;
  readonly priorityOptions = BUG_PRIORITIES;

  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdBugId: number | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private bugService: BugService,
    private testCaseService: TestCaseService,
    private executionService: TestExecutionService
  ) {
    this.form = this.fb.group({
      title:            ['', Validators.required],
      reporter:         ['', Validators.required],
      severity:         ['High'],
      priority:         [''],
      status:           ['Open'],
      description:      [''],
      stepsToReproduce: [''],
      expectedResult:   [''],
      actualResult:     [''],
    });
  }

  ngOnInit(): void {
    // Route can provide either testCaseId or executionId
    this.testCaseId  = this.route.snapshot.paramMap.get('testCaseId');
    this.executionId = this.route.snapshot.paramMap.get('executionId');

    if (this.testCaseId) {
      // Direct route: /test-cases/:testCaseId/bugs/new
      this.testCaseService.getTestCaseById(this.testCaseId).subscribe({
        next: (tc) => { this.testCaseTitle = tc.Title; },
        error: () => { this.contextLoadError = `Test case "${this.testCaseId}" was not found.`; },
      });
    } else if (this.executionId) {
      // Route: /executions/:executionId/bugs/new
      this.executionService.getExecutionById(this.executionId).subscribe({
        next: (ex) => {
          this.testCaseId    = String(ex.TestCaseID);
          this.testCaseTitle = ex.TestCaseTitle ?? null;
        },
        error: () => { this.contextLoadError = `Execution "${this.executionId}" was not found.`; },
      });
    } else {
      this.contextLoadError = 'No test case or execution ID was provided.';
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdBugId = null;

    if (this.form.invalid || !this.testCaseId) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const v = this.form.getRawValue();

    this.bugService
      .createBug({
        testCaseId:       Number(this.testCaseId),
        executionId:      this.executionId ? Number(this.executionId) : undefined,
        title:            v.title!.trim(),
        reporter:         v.reporter!.trim(),
        severity:         v.severity   || undefined,
        priority:         v.priority   || undefined,
        status:           v.status     || 'Open',
        description:      v.description      || undefined,
        stepsToReproduce: v.stepsToReproduce  || undefined,
        expectedResult:   v.expectedResult    || undefined,
        actualResult:     v.actualResult      || undefined,
      })
      .subscribe({
        next: (bug) => {
          this.submitting = false;
          this.successMessage = `Bug #${bug.BugID} — "${bug.Title}" reported.`;
          this.createdBugId = bug.BugID;
          this.form.reset({
            title: '', reporter: v.reporter, severity: 'High',
            priority: '', status: 'Open',
            description: '', stepsToReproduce: '', expectedResult: '', actualResult: '',
          });
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = extractErrorMessage(err, 'Failed to report bug. Please try again.');
        },
      });
  }

  get backLink(): any[] {
    if (this.executionId) return ['/bugs'];
    if (this.testCaseId)  return ['/bugs'];
    return ['/bugs'];
  }

  get backQueryParams(): Record<string, string> {
    if (this.executionId) return { executionId: this.executionId };
    if (this.testCaseId)  return { testCaseId: this.testCaseId };
    return {};
  }
}
