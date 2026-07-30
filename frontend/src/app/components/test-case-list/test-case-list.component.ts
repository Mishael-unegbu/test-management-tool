import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TestCase } from '../../models/test-case.model';
import { TestCaseService } from '../../services/test-case.service';
import { UserStoryService } from '../../services/user-story.service';
import { extractErrorMessage } from '../../shared/http-error.util';

export type TestCaseSortColumn = 'Title' | 'Status' | 'Priority';

// Deterministic avatar colours, picked by hashing the title so a given test
// case always keeps the same colour across reloads.
const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#b45309', '#15803d', '#be123c'];

/**
 * US-016 View Test Cases
 * As a QA user, I want to see the test cases for a user story so that I can
 * review coverage and jump into any of them to edit.
 *
 * Reads an optional `?storyId=` query param: when present the list is scoped
 * to that story, otherwise every test case is shown.
 */
@Component({
  selector: 'app-test-case-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './test-case-list.component.html',
  styleUrls: ['./test-case-list.component.css'],
})
export class TestCaseListComponent implements OnInit {
  testCases: TestCase[] = [];

  loading = false;
  loadError = '';

  filteredStoryId: string | null = null;
  storyTitle = '';

  sortColumn: TestCaseSortColumn | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private testCaseService: TestCaseService,
    private userStoryService: UserStoryService
  ) {}

  ngOnInit(): void {
    // queryParamMap (not snapshot) so navigating here again with a different
    // storyId re-loads the list without leaving the route.
    this.route.queryParamMap.subscribe((params) => {
      this.filteredStoryId = params.get('storyId');
      this.storyTitle = this.filteredStoryId ? `Story ${this.filteredStoryId}` : '';
      this.loadTestCases();
      if (this.filteredStoryId) {
        this.loadStoryTitle(this.filteredStoryId);
      }
    });
  }

  get bannerTitle(): string {
    return this.filteredStoryId ? `Test Cases for ${this.storyTitle}` : 'Test Cases';
  }

  clearStoryFilter(): void {
    this.filteredStoryId = null;
    this.storyTitle = '';
    this.router.navigate(['/test-cases']);
    this.loadTestCases();
  }

  sortBy(column: TestCaseSortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  sortIndicator(column: TestCaseSortColumn): string {
    if (this.sortColumn !== column) return '';
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  openTestCase(testCase: TestCase): void {
    this.router.navigate(['/test-cases', testCase.TestCaseID, 'edit']);
  }

  initial(title: string): string {
    return (title?.trim()?.[0] ?? '?').toUpperCase();
  }

  avatarColor(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i += 1) {
      hash = (hash * 31 + title.charCodeAt(i)) % 100000;
    }
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  statusClass(status: string | undefined): string {
    switch (status) {
      case 'Open':
        return 'tc-list-status-open';
      case 'In Progress':
        return 'tc-list-status-in-progress';
      case 'Closed':
        return 'tc-list-status-closed';
      default:
        return 'tc-list-status-none';
    }
  }

  priorityClass(priority: string | undefined): string {
    switch (priority) {
      case 'P1':
        return 'tc-list-priority-p1';
      case 'P2':
        return 'tc-list-priority-p2';
      case 'P3':
        return 'tc-list-priority-p3';
      case 'P4':
        return 'tc-list-priority-p4';
      default:
        return 'tc-list-priority-none';
    }
  }

  private loadTestCases(): void {
    this.loading = true;
    this.loadError = '';

    const request$ = this.filteredStoryId
      ? this.testCaseService.getTestCasesByStory(this.filteredStoryId)
      : this.testCaseService.getTestCases();

    request$.subscribe({
      next: (testCases) => {
        this.testCases = testCases ?? [];
        this.applySort();
        this.loading = false;
      },
      error: (err) => {
        this.testCases = [];
        this.loadError = extractErrorMessage(err, 'Failed to load test cases. Please try again.');
        this.loading = false;
      },
    });
  }

  private loadStoryTitle(storyId: string): void {
    this.userStoryService.getUserStoryById(storyId).subscribe({
      next: (story) => {
        this.storyTitle = story.Title;
      },
      // Keep the "Story <id>" fallback already in place if the story can't be read.
      error: () => undefined,
    });
  }

  private applySort(): void {
    const column = this.sortColumn;
    if (!column) return;

    const direction = this.sortDirection === 'asc' ? 1 : -1;
    this.testCases = [...this.testCases].sort((a, b) => {
      const left = (a[column] ?? '').toString().toLowerCase();
      const right = (b[column] ?? '').toString().toLowerCase();
      return left.localeCompare(right) * direction;
    });
  }
}
