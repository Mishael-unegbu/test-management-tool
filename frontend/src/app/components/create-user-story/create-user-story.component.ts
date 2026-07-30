import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserStoryService } from '../../services/user-story.service';
import { ProjectService } from '../../services/project.service';
import { USER_STORY_STATUSES, USER_STORY_PRIORITIES } from '../../models/user-story.model';
import { extractErrorMessage } from '../../shared/http-error.util';

@Component({
  selector: 'app-create-user-story',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-user-story.component.html',
  styleUrls: ['./create-user-story.component.css'],
})
export class CreateUserStoryComponent implements OnInit {
  projectId: string | null = null;
  projectName: string | null = null;
  projectLoadError: string | null = null;

  readonly allowedStatuses = USER_STORY_STATUSES;
  readonly allowedPriorities = USER_STORY_PRIORITIES;

  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdStoryId: number | null = null;

  // Acceptance criteria are stored as individual items in this array.
  // When submitting, they are joined with '\n' into the single
  // AcceptanceCriteria string the backend/workbook expects.
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
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      priority: [''],
      status: ['Open'],
      createdBy: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId');
    if (!this.projectId) {
      this.projectLoadError = 'No project ID was provided.';
      return;
    }
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => { this.projectName = project.ProjectName; },
      error: () => { this.projectLoadError = `Project "${this.projectId}" was not found.`; },
    });
  }

  /** Add the current input value as a new acceptance criterion. */
  addAc(): void {
    this.acInputError = '';
    const trimmed = this.acInput.trim();
    if (!trimmed) {
      this.acInputError = 'Please enter a criterion before adding.';
      return;
    }
    this.acItems = [...this.acItems, trimmed];
    this.acInput = '';
  }

  /** Allow pressing Enter in the AC input to add without clicking the button. */
  onAcKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addAc();
    }
  }

  /** Remove an acceptance criterion by index. */
  removeAc(index: number): void {
    this.acItems = this.acItems.filter((_, i) => i !== index);
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdStoryId = null;

    if (this.form.invalid || !this.projectId) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const value = this.form.getRawValue();

    this.userStoryService
      .createUserStory({
        projectId: Number(this.projectId),
        title: value.title!.trim(),
        description: value.description ?? '',
        // Join the individual items with newlines — the backend stores this
        // as a single string in the AcceptanceCriteria column; the Edit page
        // splits it back on load.
        acceptanceCriteria: this.acItems.join('\n'),
        priority: value.priority ?? '',
        status: value.status ?? 'Open',
        createdBy: value.createdBy!.trim(),
      })
      .subscribe({
        next: (story) => {
          this.submitting = false;
          this.successMessage = `User story "${story.Title}" created with ID ${story.StoryID}.`;
          this.createdStoryId = story.StoryID;
          this.acItems = [];
          this.acInput = '';
          this.form.reset({
            title: '',
            description: '',
            priority: '',
            status: 'Open',
            createdBy: value.createdBy,
          });
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = extractErrorMessage(err, 'Failed to create user story. Please try again.');
        },
      });
  }
}
