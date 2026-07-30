// Mirrors the TestExecutions sheet columns exactly.
// ExecutionID, TestCaseID, StoryID, ProjectID are immutable once set.
// TestCaseTitle is a server-side enrichment — not a workbook column.
export interface TestExecution {
  ExecutionID: number;
  TestCaseID: number;
  StoryID: number;
  ProjectID: number;
  ExecutionDate?: string;
  BuildVersion?: string;
  Environment?: string;
  Status?: string;
  ActualResult?: string;
  Notes?: string;
  LinkedBugID?: number | string;
  ExecutedBy?: string;
  TestCaseTitle?: string;   // enriched by the backend, not stored in the sheet
}

export interface CreateExecutionRequest {
  testCaseId: number;
  executedBy: string;
  executionDate?: string;
  buildVersion?: string;
  environment?: string;
  status?: string;
  actualResult?: string;
  notes?: string;
  linkedBugId?: number;
}

export interface ExecutionEditPayload {
  ExecutionDate?: string;
  BuildVersion?: string | null;
  Environment?: string | null;
  Status?: string;
  ActualResult?: string | null;
  Notes?: string | null;
  LinkedBugID?: number | null;
  ExecutedBy?: string;
}

export interface ExecutionListFilters {
  testCaseId?: number | string;
  storyId?: number | string;
  projectId?: number | string;
  status?: string;
  executedBy?: string;
}

// Execution-specific status vocabulary — NOT the same as TestCase/UserStory
// Open/In Progress/Closed statuses.
export const EXECUTION_STATUSES = ['Pass', 'Fail', 'Blocked', 'Skipped'] as const;
