import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TestExecutionService } from '../../services/test-execution.service';
import { TestCaseService } from '../../services/test-case.service';
import { TestExecution, EXECUTION_STATUSES } from '../../models/test-execution.model';
import { extractErrorMessage } from '../../shared/http-error.util';

type SortField = 'TestCaseTitle' | 'TestCaseID' | 'Status' | 'ExecutedBy' | 'ExecutionDate';
type SortDir   = 'asc' | 'desc';

/**
 * US-014 Execution list.
 * /executions                        — all executions
 * /executions?testCaseId=X           — scoped to one test case
 * Clicking a row navigates to Edit Execution.
 * "Log Execution" button is active when testCaseId is set; greyed out otherwise.
 */
@Component({
  selector: 'app-execution-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './execution-list.component.html',
  styleUrls: ['./execution-list.component.css'],
})
export class ExecutionListComponent implements OnInit {
  readonly statusOptions = EXECUTION_STATUSES;

  loading = false;
  errorMessage = '';
  executions: TestExecution[] = [];

  sortField: SortField = 'ExecutionDate';
  sortDir: SortDir = 'desc';  // newest first by default

  filteredTestCaseId: string | null = null;
  filteredTestCaseTitle: string | null = null;

  filterForm: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private executionService: TestExecutionService,
    private testCaseService: TestCaseService
  ) {
    this.filterForm = this.fb.group({
      status:     [''],
      executedBy: [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const testCaseId = params.get('testCaseId');
      this.filteredTestCaseId = testCaseId;
      this.filteredTestCaseTitle = null;
      this.load();

      if (testCaseId) {
        this.testCaseService.getTestCaseById(testCaseId).subscribe({
          next: (tc) => { this.filteredTestCaseTitle = tc.Title; },
          error: ()   => { this.filteredTestCaseTitle = null; },
        });
      }
    });
  }

  clearTestCaseFilter(): void {
    this.filteredTestCaseId = null;
    this.filteredTestCaseTitle = null;
    this.router.navigate(['/executions']);
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    const { status, executedBy } = this.filterForm.getRawValue();

    const request$ = this.filteredTestCaseId
      ? this.executionService.getExecutionsByTestCase(this.filteredTestCaseId)
      : this.executionService.listExecutions({
          status:     status     || undefined,
          executedBy: executedBy || undefined,
        });

    request$.subscribe({
      next: (exs) => {
        this.loading = false;
        this.executions = this.sort(exs);
      },
      error: (err) => {
        this.loading = false;
        this.executions = [];
        this.errorMessage = extractErrorMessage(err, 'Failed to load executions. Please try again.');
      },
    });
  }

  navigateToEdit(executionId: number): void {
    this.router.navigate(['/bugs'], { queryParams: { executionId } });
  }

  sortBy(field: SortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.executions = this.sort(this.executions);
  }

  private sort(exs: TestExecution[]): TestExecution[] {
    const field = this.sortField;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...exs].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      const bVal = String((b as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return  1 * dir;
      return 0;
    });
  }

  statusClass(status: string | undefined): string {
    switch (status) {
      case 'Pass':    return 'status-pass';
      case 'Fail':    return 'status-fail';
      case 'Blocked': return 'status-blocked';
      case 'Skipped': return 'status-skipped';
      default:        return '';
    }
  }

  formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }
}
