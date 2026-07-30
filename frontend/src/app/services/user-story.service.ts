import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserStory } from '../models/user-story.model';

// Local Node/Express backend (see /backend).
// Adjust if the backend is served from a different host/port.
const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class UserStoryService {
  constructor(private http: HttpClient) {}

  getUserStoryById(storyId: number | string): Observable<UserStory> {
    return this.http.get<UserStory>(`${API_BASE_URL}/user-stories/${encodeURIComponent(String(storyId))}`);
  }
}
