import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TestCaseService } from '../../services/test-case.service';
import { UserStoryService } from '../../services/user-story.service';
import { TestCase, TEST_CASE_STATUSES, TEST_CASE_PRIORITIES } from '../../models/test-case.model';
import { extractErrorMessage } from '../../shared/http-error.util';

type SortField = 'Title' | 'StoryID' | 'ProjectID' | 'Status' | 'Priority';
type SortDir   = 'asc' | 'desc';

/**
 * Test Cases list — the default Test Cases screen.
 * Mirrors the pattern of UserStoryListComponent:
 *  - Reachable as /test-cases (all test cases, via the general
 *    searchTestCases() endpoint)
 *  - Reachable as /test-cases?storyId=X (scoped to one user story, via the
 *    dedicated getTestCasesByStory() endpoint). The storyId comes from
 *    query params set by user-story-list when a user story row is clicked.
 * Clicking a row navigates to Edit Test Case (/test-cases/:id/edit).
 */
@Component({
  selector: 'app-test-case-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './test-case-list.component.html',
  styleUrls: ['./test-case-list.component.css'],
})
export class TestCaseListComponent implements OnInit {
  readonly statusOptions = TEST_CASE_STATUSES;
  readonly priorityOptions = TEST_CASE_PRIORITIES;

  loading = false;
  errorMessage = '';
  testCases: TestCase[] = [];

  sortField: SortField = 'Title';
  sortDir: SortDir = 'asc';

  // Populated when navigating via /test-cases?storyId=X
  filteredStoryId: string | null = null;
  filteredStoryTitle: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testCaseService: TestCaseService,
    private userStoryService: UserStoryService
  ) {}

  ngOnInit(): void {
    // Subscribe (not snapshot) so navigating here with a different storyId
    // re-loads rather than being a no-op.
    this.route.queryParamMap.subscribe((params) => {
      const storyId = params.get('storyId');
      this.filteredStoryId = storyId;
      this.filteredStoryTitle = null;
      this.load();

      if (storyId) {
        this.userStoryService.getUserStoryById(storyId).subscribe({
          next: (story) => { this.filteredStoryTitle = story.Title; },
          error: ()     => { this.filteredStoryTitle = null; },
        });
      }
    });
  }

  clearStoryFilter(): void {
    this.filteredStoryId = null;
    this.filteredStoryTitle = null;
    this.router.navigate(['/test-cases']);
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    // When a storyId filter is active, use the dedicated story-scoped
    // endpoint (also verifies the story exists, giving a clearer 404).
    // Otherwise fall back to the unfiltered/general list endpoint — same
    // "dedicated endpoint when filtered, general endpoint otherwise" split
    // UserStoryListComponent uses for projectId.
    const request$ = this.filteredStoryId
      ? this.testCaseService.getTestCasesByStory(this.filteredStoryId)
      : this.testCaseService.searchTestCases({});

    request$.subscribe({
      next: (cases) => {
        this.loading = false;
        this.testCases = this.sort(cases);
      },
      error: (err) => {
        this.loading = false;
        this.testCases = [];
        this.errorMessage = extractErrorMessage(err, 'Failed to load test cases. Please try again.');
      },
    });
  }

  navigateToEdit(testCaseId: number): void {
    this.router.navigate(['/test-cases', testCaseId, 'edit']);
  }

  sortBy(field: SortField): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.testCases = this.sort(this.testCases);
  }

  private sort(cases: TestCase[]): TestCase[] {
    const field = this.sortField;
    const dir   = this.sortDir === 'asc' ? 1 : -1;
    return [...cases].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      const bVal = String((b as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return  1 * dir;
      return 0;
    });
  }

  initialFor(title: string): string {
    return (title || '?').trim().charAt(0).toUpperCase();
  }

  avatarColorFor(title: string): string {
    const palette = ['#2563eb', '#7c3aed', '#0891b2', '#c2410c', '#15803d', '#be185d'];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  }

  statusClass(status: string | undefined): string {
    switch (status) {
      case 'Open':        return 'status-open';
      case 'In Progress': return 'status-in-progress';
      case 'Closed':      return 'status-closed';
      default:            return '';
    }
  }

  priorityClass(priority: string | undefined): string {
    switch (priority) {
      case 'P1': return 'priority-p1';
      case 'P2': return 'priority-p2';
      case 'P3': return 'priority-p3';
      case 'P4': return 'priority-p4';
      default:   return '';
    }
  }
}
