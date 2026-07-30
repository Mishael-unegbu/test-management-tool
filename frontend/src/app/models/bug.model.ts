// Mirrors the Bugs sheet columns exactly.
// BugID, ProjectID, StoryID, TestCaseID, ExecutionID, Reporter, ReportedDate
// are immutable once set. TestCaseTitle is server-side enrichment.
export interface Bug {
  BugID: number;
  ProjectID: number;
  StoryID: number;
  TestCaseID: number;
  ExecutionID?: number | string;
  Title: string;
  Description?: string;
  StepsToReproduce?: string;
  ExpectedResult?: string;
  ActualResult?: string;
  Severity?: string;
  Priority?: string;
  Status?: string;
  Reporter?: string;
  ReportedDate?: string;
  TestCaseTitle?: string;  // server-side enrichment
}

export interface CreateBugRequest {
  testCaseId: number;
  executionId?: number;
  title: string;
  reporter: string;
  description?: string;
  stepsToReproduce?: string;
  expectedResult?: string;
  actualResult?: string;
  severity?: string;
  priority?: string;
  status?: string;
}

export interface BugEditPayload {
  Title?: string;
  Description?: string | null;
  StepsToReproduce?: string | null;
  ExpectedResult?: string | null;
  ActualResult?: string | null;
  Severity?: string;
  Priority?: string;
  Status?: string;
}

export interface BugListFilters {
  executionId?: number | string;
  testCaseId?:  number | string;
  storyId?:     number | string;
  projectId?:   number | string;
  status?:      string;
  severity?:    string;
  title?:       string;
}

export const BUG_SEVERITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const BUG_STATUSES   = ['Open', 'In Progress', 'Closed']     as const;
export const BUG_PRIORITIES = ['P1', 'P2', 'P3', 'P4']              as const;
