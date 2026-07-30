import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserStoryService } from '../../services/user-story.service';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { USER_STORY_STATUSES, USER_STORY_PRIORITIES } from '../../models/user-story.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-005 Create User Story.
 * Reachable two ways:
 *   /projects/:projectId/user-stories/new  → project pre-selected from route
 *   /user-stories/new                       → user picks project from dropdown
 * Both use the same component; the dropdown is always shown, but pre-selects
 * the project when one is provided in the route.
 */
@Component({
  selector: 'app-create-user-story',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-user-story.component.html',
  styleUrls: ['./create-user-story.component.css'],
})
export class CreateUserStoryComponent implements OnInit {
  readonly allowedStatuses   = USER_STORY_STATUSES;
  readonly allowedPriorities = USER_STORY_PRIORITIES;

  // All projects for the dropdown
  projects: Project[] = [];
  projectsLoading = false;
  projectsError = '';

  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdStoryId: number | null = null;

  acItems: string[] = [];
  acInput = '';
  acInputError = '';

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private userStoryService: UserStoryService,
    private projectService: ProjectService
  ) {
    this.form = this.fb.group({
      projectId:   ['', Validators.required],   // now a real form field
      title:       ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      priority:    [''],
      status:      ['Open'],
      createdBy:   ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Load all projects for the dropdown
    this.projectsLoading = true;
    this.projectService.listProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.projectsLoading = false;

        // Pre-select if a projectId was supplied in the route
        const routeProjectId = this.route.snapshot.paramMap.get('projectId');
        if (routeProjectId) {
          this.form.patchValue({ projectId: routeProjectId });
        }
      },
      error: () => {
        this.projectsError = 'Could not load projects. Please refresh the page.';
        this.projectsLoading = false;
      },
    });
  }

  addAc(): void {
    this.acInputError = '';
    const trimmed = this.acInput.trim();
    if (!trimmed) { this.acInputError = 'Please enter a criterion before adding.'; return; }
    this.acItems = [...this.acItems, trimmed];
    this.acInput = '';
  }

  onAcKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') { event.preventDefault(); this.addAc(); }
  }

  removeAc(index: number): void {
    this.acItems = this.acItems.filter((_, i) => i !== index);
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdStoryId = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const value = this.form.getRawValue();

    this.userStoryService
      .createUserStory({
        projectId:          Number(value.projectId),
        title:              value.title!.trim(),
        description:        value.description        ?? '',
        acceptanceCriteria: this.acItems.join('\n'),
        priority:           value.priority           ?? '',
        status:             value.status             ?? 'Open',
        createdBy:          value.createdBy!.trim(),
      })
      .subscribe({
        next: (story) => {
          this.submitting = false;
          this.successMessage = `User story "${story.Title}" created with ID ${story.StoryID}.`;
          this.createdStoryId = story.StoryID;
          this.acItems = [];
          this.acInput = '';
          // Keep the selected project so the user can add another story to the same project
          this.form.reset({
            projectId:   value.projectId,
            title:       '',
            description: '',
            priority:    '',
            status:      'Open',
            createdBy:   value.createdBy,
          });
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = extractErrorMessage(err, 'Failed to create user story. Please try again.');
        },
      });
  }
}
