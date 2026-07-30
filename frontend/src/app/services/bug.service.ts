import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Bug, CreateBugRequest, BugEditPayload, BugListFilters,
} from '../models/bug.model';

const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class BugService {
  constructor(private http: HttpClient) {}

  // US-016 Report Bug (create)
  createBug(payload: CreateBugRequest): Observable<Bug> {
    return this.http.post<Bug>(`${API_BASE_URL}/bugs`, payload);
  }

  // Single read — pre-populates Edit Bug form; includes TestCaseTitle
  getBugById(bugId: number | string): Observable<Bug> {
    return this.http.get<Bug>(`${API_BASE_URL}/bugs/${encodeURIComponent(String(bugId))}`);
  }

  // US-017 Edit Bug
  updateBug(bugId: number | string, payload: BugEditPayload): Observable<Bug> {
    return this.http.put<Bug>(
      `${API_BASE_URL}/bugs/${encodeURIComponent(String(bugId))}`,
      payload
    );
  }

  // US-019 Bugs for a specific execution — GET /api/executions/:id/bugs
  getBugsByExecution(executionId: number | string): Observable<Bug[]> {
    return this.http.get<Bug[]>(
      `${API_BASE_URL}/executions/${encodeURIComponent(String(executionId))}/bugs`
    );
  }

  // US-019 List all bugs (optionally filtered) — GET /api/bugs?...
  listBugs(filters: BugListFilters = {}): Observable<Bug[]> {
    let params = new HttpParams();
    if (filters.executionId !== undefined && filters.executionId !== '') params = params.set('executionId', String(filters.executionId));
    if (filters.testCaseId  !== undefined && filters.testCaseId  !== '') params = params.set('testCaseId',  String(filters.testCaseId));
    if (filters.storyId     !== undefined && filters.storyId     !== '') params = params.set('storyId',     String(filters.storyId));
    if (filters.projectId   !== undefined && filters.projectId   !== '') params = params.set('projectId',   String(filters.projectId));
    if (filters.status)   params = params.set('status',   filters.status);
    if (filters.severity) params = params.set('severity', filters.severity);
    if (filters.title)    params = params.set('title',    filters.title);
    return this.http.get<Bug[]>(`${API_BASE_URL}/bugs`, { params });
  }
}
