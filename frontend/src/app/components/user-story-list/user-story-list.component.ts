import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserStoryService } from '../../services/user-story.service';
import { ProjectService } from '../../services/project.service';
import { UserStory, USER_STORY_STATUSES, USER_STORY_PRIORITIES } from '../../models/user-story.model';
import { extractErrorMessage } from '../../shared/http-error.util';

type SortField = 'Title' | 'ProjectID' | 'Status' | 'Priority' | 'CreatedBy';
type SortDirection = 'asc' | 'desc';

/**
 * User Stories list — the default User Stories screen, matching the
 * structure of ProjectListComponent. Loads all stories (optionally
 * filtered), with per-row Edit links and a top-level "+ Add User Story"
 * button that navigates to Create User Story.
 *
 * Also reachable pre-filtered via /user-stories?projectId=X — this is how
 * clicking a project name in ProjectListComponent lands here scoped to
 * that project's stories. Subscribes to queryParamMap (not the snapshot)
 * so navigating here again with a different projectId, while already on
 * this route, re-filters instead of being a no-op.
 */
@Component({
  selector: 'app-user-story-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './user-story-list.component.html',
  styleUrls: ['./user-story-list.component.css'],
})
export class UserStoryListComponent implements OnInit {
  readonly statusOptions = USER_STORY_STATUSES;
  readonly priorityOptions = USER_STORY_PRIORITIES;

  loading = false;
  errorMessage = '';
  stories: UserStory[] = [];

  sortField: SortField = 'Title';
  sortDirection: SortDirection = 'asc';

  openMenuStoryId: number | null = null;

  filterForm: ReturnType<FormBuilder['group']>;

  // Set when arriving via /user-stories?projectId=X, so the template can
  // show the project name in the banner and a way to clear the filter.
  filteredProjectId: string | null = null;
  filteredProjectName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userStoryService: UserStoryService,
    private projectService: ProjectService
  ) {
    this.filterForm = this.fb.group({
      title: [''],
      projectId: [''],
      status: [''],
      priority: [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const projectId = params.get('projectId');
      this.filteredProjectId = projectId;
      this.filteredProjectName = null; // reset until loaded
      this.filterForm.patchValue({ projectId: projectId ?? '' });
      this.load();

      // Fetch the project name separately so the banner can say
      // "User Stories for HEP" instead of "User Stories for Project 1".
      if (projectId) {
        this.projectService.getProjectById(projectId).subscribe({
          next: (project) => { this.filteredProjectName = project.ProjectName; },
          error: () => { this.filteredProjectName = null; },
        });
      }
    });
  }

  clearProjectFilter(): void {
    this.filterForm.patchValue({ projectId: '' });
    this.filteredProjectId = null;
    this.filteredProjectName = null;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    const { title, projectId, status, priority } = this.filterForm.getRawValue();

    // When arriving from the project list (projectId is set and no other
    // filters are active), use the dedicated endpoint so the intent is
    // explicit and the backend route is exercised. Fall back to general
    // search when additional filters are applied alongside projectId.
    const useProjectEndpoint =
      projectId &&
      !title &&
      !status &&
      !priority;

    const request$ = useProjectEndpoint
      ? this.userStoryService.getUserStoriesByProject(projectId!)
      : this.userStoryService.searchUserStories({
          title: title || undefined,
          projectId: projectId || undefined,
          status: status || undefined,
          priority: priority || undefined,
        });

    request$.subscribe({
      next: (stories) => {
        this.loading = false;
        this.stories = this.sortStories(stories);
      },
      error: (err) => {
        this.loading = false;
        this.stories = [];
        this.errorMessage = extractErrorMessage(err, 'Failed to load user stories. Please try again.');
      },
    });
  }

  /** Navigate to Test Cases list filtered for the clicked story. */
  navigateToTestCase(storyId: number): void {
    this.router.navigate(['/test-cases'], { queryParams: { storyId } });
  }

  sortBy(field: SortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.stories = this.sortStories(this.stories);
  }

  private sortStories(stories: UserStory[]): UserStory[] {
    const field = this.sortField;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...stories].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      const bVal = String((b as unknown as Record<string, unknown>)[field] ?? '').toLowerCase();
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }

  toggleMenu(storyId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuStoryId = this.openMenuStoryId === storyId ? null : storyId;
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.openMenuStoryId = null;
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
      case 'Open': return 'status-open';
      case 'In Progress': return 'status-in-progress';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  }

  priorityClass(priority: string | undefined): string {
    switch (priority) {
      case 'P1': return 'priority-p1';
      case 'P2': return 'priority-p2';
      case 'P3': return 'priority-p3';
      case 'P4': return 'priority-p4';
      default: return '';
    }
  }
}
