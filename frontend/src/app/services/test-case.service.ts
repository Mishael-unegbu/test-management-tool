import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTestCaseRequest,
  TestCase,
  TestCaseEditPayload,
  TestCaseSearchFilters,
} from '../models/test-case.model';

const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class TestCaseService {
  constructor(private http: HttpClient) {}

  // US-009 Create Test Case
  createTestCase(payload: CreateTestCaseRequest): Observable<TestCase> {
    return this.http.post<TestCase>(`${API_BASE_URL}/test-cases`, payload);
  }

  // Single read — used to pre-populate the Edit Test Case form
  getTestCaseById(testCaseId: number | string): Observable<TestCase> {
    return this.http.get<TestCase>(
      `${API_BASE_URL}/test-cases/${encodeURIComponent(String(testCaseId))}`
    );
  }

  // US-010 Edit Test Case
  updateTestCase(testCaseId: number | string, payload: TestCaseEditPayload): Observable<TestCase> {
    return this.http.put<TestCase>(
      `${API_BASE_URL}/test-cases/${encodeURIComponent(String(testCaseId))}`,
      payload
    );
  }

  // All test cases under a specific user story
  // GET /api/user-stories/:storyId/test-cases
  getTestCasesByStory(storyId: number | string): Observable<TestCase[]> {
    return this.http.get<TestCase[]>(
      `${API_BASE_URL}/user-stories/${encodeURIComponent(String(storyId))}/test-cases`
    );
  }

  // Test Cases table view (list all / filter). Not a numbered backlog story
  // (same situation as ProjectService.listProjects() and
  // UserStoryService.searchUserStories()) — added directly on request so
  // the Test Cases nav link has something to show without requiring a
  // storyId first. Only sends filters that are actually set.
  searchTestCases(filters: TestCaseSearchFilters = {}): Observable<TestCase[]> {
    let params = new HttpParams();
    if (filters.storyId !== undefined && filters.storyId !== '') {
      params = params.set('storyId', String(filters.storyId));
    }
    if (filters.projectId !== undefined && filters.projectId !== '') {
      params = params.set('projectId', String(filters.projectId));
    }
    if (filters.title) {
      params = params.set('title', filters.title);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.priority) {
      params = params.set('priority', filters.priority);
    }

    return this.http.get<TestCase[]>(`${API_BASE_URL}/test-cases`, { params });
  }
}
