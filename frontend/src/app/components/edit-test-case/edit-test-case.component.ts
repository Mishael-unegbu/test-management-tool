import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TestCase, TestCaseEditPayload, TEST_CASE_PRIORITIES, TEST_CASE_STATUSES } from '../../models/test-case.model';
import { TestCaseService } from '../../services/test-case.service';
import { UserStoryService } from '../../services/user-story.service';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-017 Edit Test Case
 * As a QA user, I want to edit an existing test case so that its steps and
 * expected result stay accurate as the feature changes.
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
  storyId: number | null = null;
  storyTitle = '';

  readonly allowedStatuses = TEST_CASE_STATUSES;
  readonly allowedPriorities = TEST_CASE_PRIORITIES;

  loading = false;
  saving = false;
  loadError: string | null = null;
  saveError: string | null = null;
  saveSuccess = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private testCaseService: TestCaseService,
    private userStoryService: UserStoryService
  ) {
    // Built in the constructor (not as a field initialiser): with this
    // project's tsconfig (target ES2022 ⇒ useDefineForClassFields), a field
    // initialiser referencing `this.fb` runs before the constructor-parameter
    // property is assigned.
    this.form = this.fb.group({
      Title: ['', [Validators.required, Validators.maxLength(200)]],
      Description: [''],
      Preconditions: [''],
      TestSteps: [''],
      ExpectedResult: [''],
      Priority: [''],
      Status: ['', Validators.required],
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
    this.loading = true;
    this.loadError = null;

    this.testCaseService.getTestCaseById(id).subscribe({
      next: (testCase: TestCase) => {
        this.form.patchValue({
          Title: testCase.Title,
          Description: testCase.Description ?? '',
          Preconditions: testCase.Preconditions ?? '',
          TestSteps: testCase.TestSteps ?? '',
          ExpectedResult: testCase.ExpectedResult ?? '',
          Priority: testCase.Priority ?? '',
          Status: testCase.Status ?? '',
        });
        this.storyId = testCase.StoryID;
        this.loading = false;
        this.loadStoryTitle(testCase.StoryID);
      },
      error: (err) => {
        this.loadError =
          err?.status === 404 ? `Test case "${id}" was not found.` : 'Failed to load test case. Please try again.';
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.testCaseId) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.saveError = null;
    this.saveSuccess = false;

    const payload: TestCaseEditPayload = {
      Title: this.form.value.Title,
      Description: this.form.value.Description || null,
      Preconditions: this.form.value.Preconditions || null,
      TestSteps: this.form.value.TestSteps || null,
      ExpectedResult: this.form.value.ExpectedResult || null,
      Priority: this.form.value.Priority,
      Status: this.form.value.Status,
    };

    this.testCaseService.updateTestCase(this.testCaseId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
      },
      error: (err) => {
        this.saving = false;
        this.saveError = extractErrorMessage(err, 'Failed to save.');
      },
    });
  }

  private loadStoryTitle(storyId: number): void {
    this.userStoryService.getUserStoryById(storyId).subscribe({
      next: (story) => {
        this.storyTitle = story.Title;
      },
      error: () => undefined,
    });
  }
}
