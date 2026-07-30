import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TestCaseService } from '../../services/test-case.service';
import { UserStoryService } from '../../services/user-story.service';
import { TestCase, TEST_CASE_STATUSES, TEST_CASE_PRIORITIES } from '../../models/test-case.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-009 Create Test Case
 * As a QA user, I want to create a test case under a user story so that
 * it can later be executed (US-013) and linked to bugs.
 *
 * Lives at /user-stories/:storyId/test-cases/new — storyId comes from the
 * route (not a form field/picker), mirroring how Create User Story takes
 * projectId from its route. projectId is NOT a form field either: it's
 * derived from the loaded parent story (story.ProjectID) and sent as-is,
 * so a test case can never be created against a different project than its
 * own story. If a standalone "pick any story" UI is wanted later, revisit
 * this — see the open question flagged when CreateTestCaseRequest was drafted.
 *
 * STATUS AS OF THIS FIX (see SourceCode/frontend/US-009-review-notes.md for
 * full detail): this component now compiles and has a real template, but
 * US-009 is NOT complete or wired up yet:
 *  - TestCaseService only stubs createTestCase() against a backend route
 *    (POST /api/test-cases) that does not exist yet — nothing in
 *    SourceCode/backend implements TestCases at all.
 *  - This component is intentionally NOT registered in app.routes.ts yet,
 *    since routing to a form with no working backend would be a dead end.
 *  - TEST_CASE_STATUSES below is UNCONFIRMED — see the doc comment on it in
 *    test-case.model.ts and the "Status vocabulary" note in the review file.
 * Don't treat this as a finished story; it's a compile-safety fix only.
 */
@Component({
  selector: 'app-create-test-case',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-test-case.component.html',
  styleUrls: ['./create-test-case.component.css'],
})
export class CreateTestCaseComponent implements OnInit {
  storyId: string | null = null;
  storyTitle: string | null = null;
  projectId: number | null = null;
  storyLoadError: string | null = null;

  // Unverified placeholder — see TEST_CASE_STATUSES's doc comment in
  // test-case.model.ts. Carried over from User Story's Settings-derived
  // list, but not confirmed against Product Backlog acceptance criteria
  // for US-009/US-010. See also the Project-Status landmine documented in
  // Governance/Architecture_Decisions.md / AI_Dev_Tool_Integration_Contract.md
  // section 3 — the same mistake (assuming the Settings sheet's generic
  // "Status" rows apply to a resource they weren't meant for) may be
  // repeating itself here. Confirm before relying on this.
  readonly allowedStatuses = TEST_CASE_STATUSES;
  readonly allowedPriorities = TEST_CASE_PRIORITIES;

  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdTestCaseId: number | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private testCaseService: TestCaseService,
    private userStoryService: UserStoryService
  ) {
    // Built in the constructor, not as a field initializer — see Edit
    // Project / Create User Story for why (useDefineForClassFields under
    // target: ES2022 would otherwise run this before `fb` is assigned).
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      preconditions: [''],
      testSteps: [''],
      expectedResult: [''],
      priority: [''],
      status: ['Open'],
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
        this.projectId = story.ProjectID;
      },
      error: () => {
        this.storyLoadError = `User story "${this.storyId}" was not found.`;
      },
    });
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
        storyId: Number(this.storyId),
        projectId: this.projectId,
        title: value.title!.trim(),
        description: value.description ?? '',
        preconditions: value.preconditions ?? '',
        testSteps: value.testSteps ?? '',
        expectedResult: value.expectedResult ?? '',
        priority: value.priority ?? '',
        status: value.status ?? 'Open',
      })
      .subscribe({
        next: (testCase: TestCase) => {
          this.submitting = false;
          this.successMessage = `Test case "${testCase.Title}" created with ID ${testCase.TestCaseID}.`;
          this.createdTestCaseId = testCase.TestCaseID;
          this.form.reset({
            title: '',
            description: '',
            preconditions: '',
            testSteps: '',
            expectedResult: '',
            priority: '',
            status: 'Open',
          });
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = extractErrorMessage(err, 'Failed to create test case. Please try again.');
        },
      });
  }
}
