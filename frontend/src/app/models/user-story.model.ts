// Mirrors the UserStories sheet columns in the Excel workbook (source of truth).
// Do not rename fields without an approved change to the workbook schema.
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
