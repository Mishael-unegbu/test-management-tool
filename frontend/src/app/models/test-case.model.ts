// Mirrors the TestCases sheet columns in the Excel workbook (source of truth).
// Do not rename fields without an approved change to the workbook schema.
export interface TestCase {
  TestCaseID: number;
  StoryID: number;
  ProjectID: number;
  Title: string;
  Description?: string;
  Preconditions?: string;
  TestSteps?: string;
  ExpectedResult?: string;
  Priority?: string;
  Status?: string;
  CreatedDate?: string;
  UpdatedDate?: string;
}

// Payload for US-017 Edit Test Case.
// TestCaseID, StoryID, ProjectID, CreatedDate and UpdatedDate are immutable
// server-side and are intentionally excluded here. Cleared optional fields are
// sent as null (not '') so the backend can distinguish "clear this" from
// "leave unchanged".
export interface TestCaseEditPayload {
  Title?: string;
  Description?: string | null;
  Preconditions?: string | null;
  TestSteps?: string | null;
  ExpectedResult?: string | null;
  Priority?: string;
  Status?: string;
}

// Shared vocabularies, matching the Settings sheet rows the backend validates
// against (SettingType 'Status' / 'Priority').
export const TEST_CASE_STATUSES = ['Open', 'In Progress', 'Closed'] as const;
export const TEST_CASE_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;
