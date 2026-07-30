import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateExecutionRequest,
  ExecutionEditPayload,
  ExecutionListFilters,
  TestExecution,
} from '../models/test-execution.model';

const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class TestExecutionService {
  constructor(private http: HttpClient) {}

  // US-014 Log Test Execution (create)
  createExecution(payload: CreateExecutionRequest): Observable<TestExecution> {
    return this.http.post<TestExecution>(`${API_BASE_URL}/executions`, payload);
  }

  // Single read — pre-populates Edit Execution form; includes TestCaseTitle
  getExecutionById(executionId: number | string): Observable<TestExecution> {
    return this.http.get<TestExecution>(
      `${API_BASE_URL}/executions/${encodeURIComponent(String(executionId))}`
    );
  }

  // US-014 Edit Execution
  updateExecution(executionId: number | string, payload: ExecutionEditPayload): Observable<TestExecution> {
    return this.http.put<TestExecution>(
      `${API_BASE_URL}/executions/${encodeURIComponent(String(executionId))}`,
      payload
    );
  }

  // All executions for a specific test case — GET /api/test-cases/:id/executions
  getExecutionsByTestCase(testCaseId: number | string): Observable<TestExecution[]> {
    return this.http.get<TestExecution[]>(
      `${API_BASE_URL}/test-cases/${encodeURIComponent(String(testCaseId))}/executions`
    );
  }

  // List all executions with optional filters — GET /api/executions?...
  listExecutions(filters: ExecutionListFilters = {}): Observable<TestExecution[]> {
    let params = new HttpParams();
    if (filters.testCaseId !== undefined && filters.testCaseId !== '') params = params.set('testCaseId', String(filters.testCaseId));
    if (filters.storyId !== undefined && filters.storyId !== '')     params = params.set('storyId',    String(filters.storyId));
    if (filters.projectId !== undefined && filters.projectId !== '') params = params.set('projectId',  String(filters.projectId));
    if (filters.status)     params = params.set('status',     filters.status);
    if (filters.executedBy) params = params.set('executedBy', filters.executedBy);
    return this.http.get<TestExecution[]>(`${API_BASE_URL}/executions`, { params });
  }
}
