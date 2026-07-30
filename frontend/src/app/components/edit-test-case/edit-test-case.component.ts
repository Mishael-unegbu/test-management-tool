import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestCaseService } from '../../services/test-case.service';
import { UserStoryService } from '../../services/user-story.service';
import { TestCase, TestCaseEditPayload, TEST_CASE_STATUSES, TEST_CASE_PRIORITIES } from '../../models/test-case.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-010 Edit Test Case.
 * Lives at /test-cases/:id/edit — id = TestCaseID.
 * Loads the test case on init, pre-populates editable fields, and PUTs
 * changes back. Immutable fields (TestCaseID, StoryID, ProjectID,
 * CreatedDate, UpdatedDate) are never included in the form or the payload.
 */
@Component({
  selector: 'app-edit-test-case',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './edit-test-case.component.html',
  styleUrls: ['./edit-test-case.component.css'],
})
export class EditTestCaseComponent implements OnInit {
  form: FormGroup;
  testCaseId: string | null = null;

  readonly allowedStatuses  = TEST_CASE_STATUSES;
  readonly allowedPriorities = TEST_CASE_PRIORITIES;

  loading    = false;
  saving     = false;
  loadError: string | null = null;
  saveError: string | null = null;
  saveSuccess = false;

  // Context fields — loaded after the test case loads so we can show
  // "Under story: <title>" above the form.
  storyId:    number | null = null;
  storyTitle: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private testCaseService: TestCaseService,
    private userStoryService: UserStoryService
  ) {
    // Constructor body — required because tsconfig uses target: ES2022
    // (useDefineForClassFields), which means field initialisers that
    // reference `this.fb` execute before the property is set.
    this.form = this.fb.group({
      Title:          ['', [Validators.required, Validators.maxLength(200)]],
      Description:    [''],
      Preconditions:  [''],
      TestSteps:      [''],
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
          TestSteps:      tc.TestSteps      ?? '',
          ExpectedResult: tc.ExpectedResult ?? '',
          Priority:       tc.Priority       ?? '',
          Status:         tc.Status         ?? 'Open',
        });

        // Store for the context strip and "Back" link
        this.storyId = tc.StoryID;

        // Fetch the story title in parallel — fail silently
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

  onSubmit(): void {
    if (this.form.invalid || !this.testCaseId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving     = true;
    this.saveError  = null;
    this.saveSuccess = false;

    const v = this.form.value;
    const payload: TestCaseEditPayload = {
      Title:          v.Title,
      Description:    v.Description    || null,
      Preconditions:  v.Preconditions  || null,
      TestSteps:      v.TestSteps      || null,
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
