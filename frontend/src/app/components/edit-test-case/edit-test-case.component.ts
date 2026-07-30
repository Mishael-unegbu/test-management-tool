import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestCaseService } from '../../services/test-case.service';
import { UserStoryService } from '../../services/user-story.service';
import { TestCase, TestCaseEditPayload, TEST_CASE_STATUSES, TEST_CASE_PRIORITIES } from '../../models/test-case.model';
import { extractErrorMessage } from '../../shared/http-error.util';

@Component({
  selector: 'app-edit-test-case',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-test-case.component.html',
  styleUrls: ['./edit-test-case.component.css'],
})
export class EditTestCaseComponent implements OnInit {
  form: FormGroup;
  testCaseId: string | null = null;

  readonly allowedStatuses   = TEST_CASE_STATUSES;
  readonly allowedPriorities = TEST_CASE_PRIORITIES;

  loading     = false;
  saving      = false;
  loadError:   string | null = null;
  saveError:   string | null = null;
  saveSuccess  = false;

  storyId:    number | null = null;
  storyTitle: string | null = null;

  // Test steps — split from the stored '\n'-delimited string on load,
  // joined back on save. Same pattern as Acceptance Criteria on User Stories.
  stepItems: string[] = [];
  stepInput = '';
  stepInputError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private testCaseService: TestCaseService,
    private userStoryService: UserStoryService
  ) {
    this.form = this.fb.group({
      Title:          ['', [Validators.required, Validators.maxLength(200)]],
      Description:    [''],
      Preconditions:  [''],
      ExpectedResult: [''],
      Priority:       [''],
      Status:         ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.testCaseId = this.route.snapshot.paramMap.get('id');
    if (!this.testCaseId) {
      this.loadError = 'No test case ID was provided.';
      return;
    }
    this.loadTestCase(this.testCaseId);
  }

  loadTestCase(id: string): void {
    this.loading   = true;
    this.loadError = null;

    this.testCaseService.getTestCaseById(id).subscribe({
      next: (tc: TestCase) => {
        this.form.patchValue({
          Title:          tc.Title,
          Description:    tc.Description    ?? '',
          Preconditions:  tc.Preconditions  ?? '',
          ExpectedResult: tc.ExpectedResult ?? '',
          Priority:       tc.Priority       ?? '',
          Status:         tc.Status         ?? 'Open',
        });

        // Split stored '\n'-delimited steps back into individual items,
        // filtering empty lines that may have crept in.
        const raw = tc.TestSteps ?? '';
        this.stepItems = raw
          .split('\n')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        this.storyId = tc.StoryID;
        this.userStoryService.getUserStoryById(tc.StoryID).subscribe({
          next: (story) => { this.storyTitle = story.Title; },
          error: ()     => { this.storyTitle = null; },
        });

        this.loading = false;
      },
      error: (err) => {
        this.loadError =
          err?.status === 404
            ? `Test case "${id}" was not found.`
            : 'Failed to load test case. Please try again.';
        this.loading = false;
      },
    });
  }

  addStep(): void {
    this.stepInputError = '';
    const trimmed = this.stepInput.trim();
    if (!trimmed) {
      this.stepInputError = 'Please enter a step before adding.';
      return;
    }
    this.stepItems = [...this.stepItems, trimmed];
    this.stepInput = '';
  }

  onStepKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addStep();
    }
  }

  removeStep(index: number): void {
    this.stepItems = this.stepItems.filter((_, i) => i !== index);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.testCaseId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving      = true;
    this.saveError   = null;
    this.saveSuccess = false;

    const v = this.form.value;
    const payload: TestCaseEditPayload = {
      Title:          v.Title,
      Description:    v.Description    || null,
      Preconditions:  v.Preconditions  || null,
      TestSteps:      this.stepItems.length > 0 ? this.stepItems.join('\n') : null,
      ExpectedResult: v.ExpectedResult || null,
      Priority:       v.Priority       || undefined,
      Status:         v.Status,
    };

    this.testCaseService.updateTestCase(this.testCaseId, payload).subscribe({
      next: () => {
        this.saving      = false;
        this.saveSuccess = true;
      },
      error: (err) => {
        this.saving    = false;
        this.saveError = extractErrorMessage(err, 'Failed to save changes. Please try again.');
      },
    });
  }
}
