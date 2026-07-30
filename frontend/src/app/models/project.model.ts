// Mirrors the Projects sheet columns in the Excel workbook (source of truth).
// Do not rename fields without an approved change to the workbook schema.
export interface Project {
  ProjectID: number;
  ProjectName: string;
  Description?: string;
  Status?: string;
  StartDate?: string;
  EndDate?: string;
  CreatedDate?: string;
  UpdatedDate?: string;
}

// Payload for US-001 Create Project
export interface CreateProjectRequest {
  projectName: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// Payload for US-002 Edit Project.
// ProjectID, CreatedDate, and UpdatedDate are immutable server-side and are
// intentionally excluded here (backend rejects them with a 400 if sent).
export interface ProjectEditPayload {
  ProjectName?: string;
  Description?: string | null;
  Status?: string;
  StartDate?: string | null;
  EndDate?: string | null;
}

// Single source of truth for the Project Status vocabulary, shared by
// Create Project and Edit Project so the two forms can never drift apart.
// Must match the backend's ALLOWED_STATUSES_FALLBACK
// (SourceCode/backend/src/validators/projects.validator.js) — these are
// Project statuses, distinct from Bug statuses (Open/In Progress/Closed),
// which live under the same Settings sheet "Status" SettingType but are not
// valid values here. See that file's doc comment for the full history.
export const PROJECT_STATUSES = ['Active', 'On Hold', 'Completed'] as const;
