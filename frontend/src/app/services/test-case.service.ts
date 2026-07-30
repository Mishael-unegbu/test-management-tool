import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateTestCaseRequest,
  TestCase,
  TestCaseEditPayload,
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
}
