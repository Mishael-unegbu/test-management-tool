import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project, PROJECT_STATUSES } from '../../models/project.model';
import { extractErrorMessage } from '../../shared/http-error.util';

type SortField = 'ProjectName' | 'Status' | 'StartDate' | 'EndDate';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  readonly statusOptions = PROJECT_STATUSES;

  loading = false;
  errorMessage = '';
  projects: Project[] = [];

  sortField: SortField = 'ProjectName';
  sortDirection: SortDirection = 'asc';

  filterForm: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private projectService: ProjectService
  ) {
    this.filterForm = this.fb.group({
      keyword: [''],
      status: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    const { keyword, status } = this.filterForm.getRawValue();

    this.projectService
      .listProjects({ projectName: keyword || undefined, status: status || undefined })
      .subscribe({
        next: (projects) => {
          this.loading = false;
          this.projects = this.sortProjects(projects);
        },
        error: (err) => {
          this.loading = false;
          this.projects = [];
          this.errorMessage = extractErrorMessage(err, 'Failed to load projects. Please try again.');
        },
      });
  }

  /**
   * Navigate to the User Stories list filtered for this project.
   * Called by the row's (click) handler. The Edit button uses its own
   * routerLink and calls $event.stopPropagation() so it doesn't also
   * trigger this.
   */
  navigateToStories(projectId: number): void {
    this.router.navigate(['/user-stories'], { queryParams: { projectId } });
  }

  sortBy(field: SortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.projects = this.sortProjects(this.projects);
  }

  private sortProjects(projects: Project[]): Project[] {
    const field = this.sortField;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return [...projects].sort((a, b) => {
      const aVal = String(a[field] ?? '').toLowerCase();
      const bVal = String(b[field] ?? '').toLowerCase();
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }

  initialFor(projectName: string): string {
    return (projectName || '?').trim().charAt(0).toUpperCase();
  }

  avatarColorFor(projectName: string): string {
    const palette = ['#2563eb', '#7c3aed', '#0891b2', '#c2410c', '#15803d', '#be185d'];
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = (hash * 31 + projectName.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  }

  statusClass(status: string | undefined): string {
    switch (status) {
      case 'Active': return 'status-active';
      case 'On Hold': return 'status-on-hold';
      case 'Completed': return 'status-completed';
      default: return '';
    }
  }
}
