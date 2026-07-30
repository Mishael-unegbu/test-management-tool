import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TestExecutionService } from '../../services/test-execution.service';
import { TestCaseService } from '../../services/test-case.service';
import { EXECUTION_STATUSES } from '../../models/test-execution.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-014 Log Test Execution (create).
 * Lives at /test-cases/:testCaseId/executions/new.
 * testCaseId comes from the route; shown as read-only context above the form.
 */
@Component({
  selector: 'app-create-execution',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-execution.component.html',
  styleUrls: ['./create-execution.component.css'],
})
export class CreateExecutionComponent implements OnInit {
  testCaseId: string | null = null;
  testCaseTitle: string | null = null;
  testCaseLoadError: string | null = null;

  readonly statusOptions = EXECUTION_STATUSES;

  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdExecutionId: number | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private executionService: TestExecutionService,
    private testCaseService: TestCaseService
  ) {
    this.form = this.fb.group({
      executedBy:     ['', Validators.required],
      status:         ['Pass', Validators.required],
      buildVersion:   [''],
      environment:    [''],
      actualResult:   [''],
      notes:          [''],
      linkedBugId:    [''],
    });
  }

  ngOnInit(): void {
    this.testCaseId = this.route.snapshot.paramMap.get('testCaseId');
    if (!this.testCaseId) {
      this.testCaseLoadError = 'No test case ID was provided.';
      return;
    }
    this.testCaseService.getTestCaseById(this.testCaseId).subscribe({
      next: (tc) => { this.testCaseTitle = tc.Title; },
      error: () => { this.testCaseLoadError = `Test case "${this.testCaseId}" was not found.`; },
    });
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdExecutionId = null;

    if (this.form.invalid || !this.testCaseId) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const v = this.form.getRawValue();

    this.executionService
      .createExecution({
        testCaseId:   Number(this.testCaseId),
        executedBy:   v.executedBy!.trim(),
        status:       v.status ?? 'Pass',
        buildVersion: v.buildVersion || undefined,
        environment:  v.environment  || undefined,
        actualResult: v.actualResult || undefined,
        notes:        v.notes        || undefined,
        linkedBugId:  v.linkedBugId  ? Number(v.linkedBugId) : undefined,
      })
      .subscribe({
        next: (ex) => {
          this.submitting = false;
          this.successMessage = `Execution #${ex.ExecutionID} logged — Result: ${ex.Status}.`;
          this.createdExecutionId = ex.ExecutionID;
          this.form.reset({ executedBy: v.executedBy, status: 'Pass', buildVersion: v.buildVersion, environment: v.environment });
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = extractErrorMessage(err, 'Failed to log execution. Please try again.');
        },
      });
  }
}
