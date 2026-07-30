// Mirrors the UserStories sheet columns in the Excel workbook (source of
// truth). Do not rename fields without an approved change to the workbook
// schema. See SourceCode/backend/src/services/userStoriesService.js.
export interface UserStory {
  StoryID: number;
  ProjectID: number;
  Title: string;
  Description?: string;
  AcceptanceCriteria?: string;
  Priority?: string;
  Status?: string;
  CreatedBy?: string;
  CreatedDate?: string;
  UpdatedDate?: string;
}

// Payload for US-005 Create User Story.
export interface CreateUserStoryRequest {
  projectId: number;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: string;
  status?: string;
  createdBy: string;
}

// Payload for US-006 Edit User Story.
// StoryID, ProjectID, CreatedBy, and CreatedDate are immutable server-side
// and are intentionally excluded here (backend rejects them with a 400 if
// sent) — see IMMUTABLE_FIELDS in userStories.validator.js. In particular,
// ProjectID is immutable on the assumption that a story can't move projects
// after creation; confirm that assumption holds before relying on it.
export interface UserStoryEditPayload {
  Title?: string;
  Description?: string | null;
  AcceptanceCriteria?: string | null;
  Priority?: string;
  Status?: string;
}

// Optional filters for US-007 Search User Story. All provided filters are
// combined with AND on the backend; `title` is a case-insensitive partial
// match, the rest are exact matches. See
// userStoriesService.searchUserStories()'s doc comment for the underlying
// assumption (the Backlog doesn't specify search fields).
export interface UserStorySearchFilters {
  projectId?: number | string;
  title?: string;
  status?: string;
  priority?: string;
}

// Single source of truth for the User Story Status/Priority vocabularies,
// shared by Create, Edit, and Search so they can never drift apart from
// each other — this is exactly the bug PROJECT_STATUSES (see
// project.model.ts) was created to prevent, applied here from the start.
//
// Must match the backend's ALLOWED_STATUSES_FALLBACK / 
// ALLOWED_PRIORITIES_FALLBACK (SourceCode/backend/src/validators/
// userStories.validator.js), which in turn are meant to mirror the real
// Settings sheet (SettingType=Status / SettingType=Priority). Unlike
// Projects, User Stories' Status IS sourced from Settings on the backend —
// this frontend copy is a fallback for immediate rendering before/without a
// dedicated "get lookup values" endpoint; if Settings ever changes, this
// needs to change with it.
export const USER_STORY_STATUSES = ['Open', 'In Progress', 'Closed'] as const;
export const USER_STORY_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
