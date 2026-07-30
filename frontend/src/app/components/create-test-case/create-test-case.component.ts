import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TestCaseService } from '../../services/test-case.service';
import { UserStoryService } from '../../services/user-story.service';
import { TestCase, TEST_CASE_STATUSES, TEST_CASE_PRIORITIES } from '../../models/test-case.model';
import { extractErrorMessage } from '../../shared/http-error.util';

@Component({
  selector: 'app-create-test-case',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-test-case.component.html',
  styleUrls: ['./create-test-case.component.css'],
})
export class CreateTestCaseComponent implements OnInit {
  storyId: string | null = null;
  storyTitle: string | null = null;
  projectId: number | null = null;
  storyLoadError: string | null = null;

  readonly allowedStatuses = TEST_CASE_STATUSES;
  readonly allowedPriorities = TEST_CASE_PRIORITIES;

  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdTestCaseId: number | null = null;

  // Test steps — stored as individual items, joined with '\n' on submit,
  // exactly the same pattern as Acceptance Criteria on User Stories.
  stepItems: string[] = [];
  stepInput = '';
  stepInputError = '';

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private testCaseService: TestCaseService,
    private userStoryService: UserStoryService
  ) {
    this.form = this.fb.group({
      title:          ['', [Validators.required, Validators.maxLength(200)]],
      description:    [''],
      preconditions:  [''],
      expectedResult: [''],
      priority:       [''],
      status:         ['Open'],
    });
  }

  ngOnInit(): void {
    this.storyId = this.route.snapshot.paramMap.get('storyId');
    if (!this.storyId) {
      this.storyLoadError = 'No story ID was provided.';
      return;
    }
    this.userStoryService.getUserStoryById(this.storyId).subscribe({
      next: (story) => {
        this.storyTitle = story.Title;
        this.projectId  = story.ProjectID;
      },
      error: () => {
        this.storyLoadError = `User story "${this.storyId}" was not found.`;
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

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.createdTestCaseId = null;

    if (this.form.invalid || !this.storyId || this.projectId === null) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const value = this.form.getRawValue();

    this.testCaseService
      .createTestCase({
        storyId:        Number(this.storyId),
        projectId:      this.projectId,
        title:          value.title!.trim(),
        description:    value.description    ?? '',
        preconditions:  value.preconditions  ?? '',
        testSteps:      this.stepItems.join('\n'),
        expectedResult: value.expectedResult ?? '',
        priority:       value.priority       ?? '',
        status:         value.status         ?? 'Open',
      })
      .subscribe({
        next: (testCase: TestCase) => {
          this.submitting = false;
          this.successMessage = `Test case "${testCase.Title}" created with ID ${testCase.TestCaseID}.`;
          this.createdTestCaseId = testCase.TestCaseID;
          this.stepItems = [];
          this.stepInput = '';
          this.form.reset({
            title: '', description: '', preconditions: '',
            expectedResult: '', priority: '', status: 'Open',
          });
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = extractErrorMessage(err, 'Failed to create test case. Please try again.');
        },
      });
  }
}
