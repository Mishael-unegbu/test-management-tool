import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateProjectRequest, Project, ProjectEditPayload, ProjectListFilters } from '../models/project.model';

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

  // Projects table view (list all / filter). Not a numbered backlog story
  // (there's a gap where US-004 would be) — backend added directly on request.
  listProjects(filters: ProjectListFilters = {}): Observable<Project[]> {
    let params = new HttpParams();
    if (filters.projectName) {
      params = params.set('projectName', filters.projectName);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Project[]>(`${API_BASE_URL}/projects`, { params });
  }

  // US-002 Edit Project
  updateProject(projectId: number | string, payload: ProjectEditPayload): Observable<Project> {
    return this.http.put<Project>(`${API_BASE_URL}/projects/${encodeURIComponent(String(projectId))}`, payload);
  }
}
