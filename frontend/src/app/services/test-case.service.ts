import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestCase, TestCaseEditPayload } from '../models/test-case.model';

// Local Node/Express backend (see /backend).
// Adjust if the backend is served from a different host/port.
const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class TestCaseService {
  constructor(private http: HttpClient) {}

  // US-016 View Test Cases
  getTestCases(): Observable<TestCase[]> {
    return this.http.get<TestCase[]>(`${API_BASE_URL}/test-cases`);
  }

  getTestCasesByStory(storyId: number | string): Observable<TestCase[]> {
    return this.http.get<TestCase[]>(
      `${API_BASE_URL}/user-stories/${encodeURIComponent(String(storyId))}/test-cases`
    );
  }

  // US-017 Edit Test Case (the read pre-populates the form)
  getTestCaseById(testCaseId: number | string): Observable<TestCase> {
    return this.http.get<TestCase>(`${API_BASE_URL}/test-cases/${encodeURIComponent(String(testCaseId))}`);
  }

  updateTestCase(testCaseId: number | string, payload: TestCaseEditPayload): Observable<TestCase> {
    return this.http.put<TestCase>(
      `${API_BASE_URL}/test-cases/${encodeURIComponent(String(testCaseId))}`,
      payload
    );
  }
}
