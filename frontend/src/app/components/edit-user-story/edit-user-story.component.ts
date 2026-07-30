import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserStoryService } from '../../services/user-story.service';
import { UserStory, UserStoryEditPayload, USER_STORY_STATUSES, USER_STORY_PRIORITIES } from '../../models/user-story.model';
import { extractErrorMessage } from '../../shared/http-error.util';

@Component({
  selector: 'app-edit-user-story',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-user-story.component.html',
  styleUrls: ['./edit-user-story.component.css'],
})
export class EditUserStoryComponent implements OnInit {
  form: FormGroup;
  storyId: string | null = null;

  readonly allowedStatuses = USER_STORY_STATUSES;
  readonly allowedPriorities = USER_STORY_PRIORITIES;

  loading = false;
  saving = false;
  loadError: string | null = null;
  saveError: string | null = null;
  saveSuccess = false;

  // Acceptance criteria items — loaded by splitting the stored '\n'-delimited
  // string; serialised back to '\n'-delimited on save.
  acItems: string[] = [];
  acInput = '';
  acInputError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private userStoryService: UserStoryService
  ) {
    this.form = this.fb.group({
      Title: ['', [Validators.required, Validators.maxLength(200)]],
      Description: [''],
      Priority: [''],
      Status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.storyId = this.route.snapshot.paramMap.get('id');
    if (!this.storyId) {
      this.loadError = 'No user story ID was provided.';
      return;
    }
    this.loadStory(this.storyId);
  }

  loadStory(id: string): void {
    this.loading = true;
    this.loadError = null;

    this.userStoryService.getUserStoryById(id).subscribe({
      next: (story: UserStory) => {
        this.form.patchValue({
          Title: story.Title,
          Description: story.Description ?? '',
          Priority: story.Priority ?? '',
          Status: story.Status,
        });

        // Split the stored newline-delimited string back into individual items,
        // filtering out any empty lines that may have crept in.
        const raw = story.AcceptanceCriteria ?? '';
        this.acItems = raw
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        this.loading = false;
      },
      error: (err) => {
        this.loadError =
          err?.status === 404
            ? `User story "${id}" was not found.`
            : 'Failed to load user story. Please try again.';
        this.loading = false;
      },
    });
  }

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

  onAcKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addAc();
    }
  }

  removeAc(index: number): void {
    this.acItems = this.acItems.filter((_, i) => i !== index);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.storyId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = null;
    this.saveSuccess = false;

    const payload: UserStoryEditPayload = {
      Title: this.form.value.Title,
      Description: this.form.value.Description || null,
      AcceptanceCriteria: this.acItems.length > 0 ? this.acItems.join('\n') : null,
      Priority: this.form.value.Priority || undefined,
      Status: this.form.value.Status,
    };

    this.userStoryService.updateUserStory(this.storyId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
      },
      error: (err) => {
        this.saving = false;
        this.saveError = extractErrorMessage(err, 'Failed to save changes. Please try again.');
      },
    });
  }
}
