import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateProjectRequest, Project, ProjectEditPayload } from '../models/project.model';

// Local Node/Express backend (see /SourceCode/backend).
// Adjust if the backend is served from a different host/port.
const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  constructor(private http: HttpClient) {}

  // US-001 Create Project
  createProject(payload: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${API_BASE_URL}/projects`, payload);
  }

  // US-003 View Project (also used to pre-populate the Edit Project form)
  getProjectById(projectId: number | string): Observable<Project> {
    return this.http.get<Project>(`${API_BASE_URL}/projects/${encodeURIComponent(String(projectId))}`);
  }

  // US-002 Edit Project
  updateProject(projectId: number | string, payload: ProjectEditPayload): Observable<Project> {
    return this.http.put<Project>(`${API_BASE_URL}/projects/${encodeURIComponent(String(projectId))}`, payload);
  }
}
