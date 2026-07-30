import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateUserStoryRequest,
  UserStory,
  UserStoryEditPayload,
  UserStorySearchFilters,
} from '../models/user-story.model';

// Same backend as ProjectService — see that file's comment.
const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class UserStoryService {
  constructor(private http: HttpClient) {}

  // US-005 Create User Story
  createUserStory(payload: CreateUserStoryRequest): Observable<UserStory> {
    return this.http.post<UserStory>(`${API_BASE_URL}/user-stories`, payload);
  }

  // Single-story read, also used to pre-populate the Edit User Story form.
  getUserStoryById(storyId: number | string): Observable<UserStory> {
    return this.http.get<UserStory>(`${API_BASE_URL}/user-stories/${encodeURIComponent(String(storyId))}`);
  }

  // US-006 Edit User Story
  updateUserStory(storyId: number | string, payload: UserStoryEditPayload): Observable<UserStory> {
    return this.http.put<UserStory>(
      `${API_BASE_URL}/user-stories/${encodeURIComponent(String(storyId))}`,
      payload
    );
  }

  // US-007 Search User Story. Only sends filters that are actually set —
  // an empty-string filter would otherwise be sent as a literal empty query
  // param, which the backend treats as "no filter" anyway, but there's no
  // reason to send it.
  searchUserStories(filters: UserStorySearchFilters): Observable<UserStory[]> {
    let params = new HttpParams();
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

    return this.http.get<UserStory[]>(`${API_BASE_URL}/user-stories`, { params });
  }

  // Fetch all user stories under a specific project using the dedicated
  // backend endpoint (GET /api/projects/:projectId/user-stories).
  // Used when navigating from the Project list to see that project's stories.
  getUserStoriesByProject(projectId: number | string): Observable<UserStory[]> {
    return this.http.get<UserStory[]>(
      `${API_BASE_URL}/projects/${encodeURIComponent(String(projectId))}/user-stories`
    );
  }
}
