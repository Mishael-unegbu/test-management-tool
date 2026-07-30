import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserStoryService } from '../../services/user-story.service';
import { UserStory, USER_STORY_STATUSES, USER_STORY_PRIORITIES } from '../../models/user-story.model';
import { extractErrorMessage } from '../../shared/http-error.util';

/**
 * US-007 Search User Story
 * As a QA user, I want to search for user stories so that I can quickly
 * find and navigate to a specific one.
 *
 * No prior art for a list/search view in this codebase — this establishes
 * the pattern. Filters: title (partial match), projectId/status/priority
 * (exact match), matching what userStoriesService.searchUserStories()
 * actually supports on the backend. Confirm these are the filters actually
 * wanted before expanding scope (e.g. full-text search across Description).
 */
@Component({
  selector: 'app-search-user-story',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './search-user-story.component.html',
  styleUrls: ['./search-user-story.component.css'],
})
export class SearchUserStoryComponent implements OnInit {
  readonly allowedStatuses = USER_STORY_STATUSES;
  readonly allowedPriorities = USER_STORY_PRIORITIES;

  searching = false;
  errorMessage = '';
  hasSearched = false;
  results: UserStory[] = [];

  form: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder, private userStoryService: UserStoryService) {
    // Built in the constructor (not as a field initializer) — see the same
    // note in create-project.component.ts for why a field initializer
    // referencing `this.fb` fails to compile under this project's tsconfig.
    this.form = this.fb.group({
      title: [''],
      projectId: [''],
      status: [''],
      priority: [''],
    });
  }

  ngOnInit(): void {
    // Load the full unfiltered list on first visit, same as submitting an
    // empty search — gives the page something to show immediately.
    this.search();
  }

  search(): void {
    this.errorMessage = '';
    this.searching = true;

    const value = this.form.getRawValue();

    this.userStoryService
      .searchUserStories({
        title: value.title || undefined,
        projectId: value.projectId || undefined,
        status: value.status || undefined,
        priority: value.priority || undefined,
      })
      .subscribe({
        next: (results) => {
          this.searching = false;
          this.hasSearched = true;
          this.results = results;
        },
        error: (err) => {
          this.searching = false;
          this.hasSearched = true;
          this.results = [];
          this.errorMessage = extractErrorMessage(err, 'Failed to search user stories. Please try again.');
        },
      });
  }
}
