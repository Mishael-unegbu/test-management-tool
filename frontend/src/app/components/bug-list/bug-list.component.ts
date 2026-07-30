import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BugService } from '../../services/bug.service';
import { TestExecutionService } from '../../services/test-execution.service';
import { Bug, BUG_SEVERITIES, BUG_STATUSES, BUG_PRIORITIES } from '../../models/bug.model';
import { extractErrorMessage } from '../../shared/http-error.util';

type SortField = 'Title' | 'TestCaseID' | 'TestCaseTitle' | 'Severity' | 'Priority' | 'Status' | 'Reporter';
type SortDir   = 'asc' | 'desc';

/**
 * US-016 / US-019 Bug list.
 * /bugs                          — all bugs
 * /bugs?executionId=X            — scoped to one execution (US-019)
 * /bugs?testCaseId=X             — scoped to one test case
 * Clicking a row → Edit Bug.
 * "+ Report Bug" active when executionId or testCaseId is set.
 */
@Component({
  selector: 'app-bug-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './bug-list.component.html',
  styleUrls: ['./bug-list.component.css'],
})
export class BugListComponent implements OnInit {
  readonly severityOptions = BUG_SEVERITIES;
  readonly statusOptions   = BUG_STATUSES;
  readonly priorityOptions = BUG_PRIORITIES;

  loading = false;
  errorMessage = '';
  bugs: Bug[] = [];

  sortField: SortField = 'Title';
  sortDir: SortDir = 'asc';

  // Filter context
  filteredExecutionId: string | null = null;
  filteredTestCaseId:  string | null = null;
  contextLabel: string | null = null;   // human-readable label for the banner

  filterForm: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bugService: BugService,
    private executionService: TestExecutionService,
  ) {
    this.filterForm = this.fb.group({
      status:   [''],
      severity: [''],
      title:    [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.filteredExecutionId = params.get('executionId');
      this.filteredTestCaseId  = params.get('testCaseId');
      this.contextLabel        = null;
      this.load();

      // Load context label for the banner
      if (this.filteredExecutionId) {
        this.executionService.getExecutionById(this.filteredExecutionId).subscribe({
          next: (ex) => { this.contextLabel = `Execution #${ex.ExecutionID} — ${ex.TestCaseTitle ?? 'TC ' + ex.TestCaseID}`; },
          error: () => { this.contextLabel = `Execution ${this.filteredExecutionId}`; },
        });
      }
    });
  }

  clearFilter(): void {
    this.filteredExecutionId = null;
    this.filteredTestCaseId  = null;
    this.contextLabel        = null;
    this.router.navigate(['/bugs']);
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    const { status, severity, title } = this.filterForm.getRawValue();

    const request$ = this.filteredExecutionId
      ? this.bugService.getBugsByExecution(this.filteredExecutionId)
      : this.bugService.listBugs({
          testCaseId: this.filteredTestCaseId || undefined,
          status:     status     || undefined,
          severity:   severity   || undefined,
          title:      title      || undefined,
        });

    request$.subscribe({
      next: (bugs) => { this.loading = false; this.bugs = this.sort(bugs); },
      error: (err) => {
        this.loading = false;
        this.bugs = [];
        this.errorMessage = extractErrorMessage(err, 'Failed to load bugs. Please try again.');
      },
    });
  }

  navigateToEdit(bugId: number): void {
    this.router.navigate(['/bugs', bugId, 'edit']);
  }

  sortBy(field: SortField): void {
    if (this.sortField === field) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.bugs = this.sort(this.bugs);
  }

  private sort(bugs: Bug[]): Bug[] {
    const field = this.sortField;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    return [...bugs].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      const bVal = String((b as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return  1 * dir;
      return 0;
    });
  }

  severityClass(s: string | undefined): string {
    switch (s) {
      case 'Critical': return 'sev-critical';
      case 'High':     return 'sev-high';
      case 'Medium':   return 'sev-medium';
      case 'Low':      return 'sev-low';
      default:         return '';
    }
  }

  statusClass(s: string | undefined): string {
    switch (s) {
      case 'Open':        return 'status-open';
      case 'In Progress': return 'status-in-progress';
      case 'Closed':      return 'status-closed';
      default:            return '';
    }
  }

  priorityClass(p: string | undefined): string {
    switch (p) {
      case 'P1': return 'priority-p1';
      case 'P2': return 'priority-p2';
      case 'P3': return 'priority-p3';
      case 'P4': return 'priority-p4';
      default:   return '';
    }
  }

  get reportBugLink(): string[] | null {
    if (this.filteredExecutionId) return ['/executions', this.filteredExecutionId, 'bugs', 'new'];
    if (this.filteredTestCaseId)  return ['/test-cases',  this.filteredTestCaseId,  'bugs', 'new'];
    return null;
  }
}
