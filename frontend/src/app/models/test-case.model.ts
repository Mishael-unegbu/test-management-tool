// Mirrors the TestCases sheet columns in the Excel workbook (source of truth).
// Do not rename fields without an approved change to the workbook schema.
//
// Note: unlike UserStory, there is NO CreatedBy column on the TestCases
// sheet — confirmed against the live workbook. Don't carry that field over.
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

// Payload for US-009 Create Test Case
export interface CreateTestCaseRequest {
  storyId: number;
  projectId: number;
  title: string;
  description?: string;
  preconditions?: string;
  testSteps?: string;
  expectedResult?: string;
  priority?: string;
  status?: string;
}

// Payload for US-010 Edit Test Case
export interface TestCaseEditPayload {
  Title?: string;
  Description?: string | null;
  Preconditions?: string | null;
  TestSteps?: string | null;
  ExpectedResult?: string | null;
  Priority?: string;
  Status?: string;
}

// NOTE: there's no "Search Test Case" story in the Product Backlog (US-009/010
// only cover Create/Edit — unlike User Stories, which have US-007 Search User
// Story). Included here for structural symmetry with UserStorySearchFilters,
// but this isn't backed by an approved story yet — flag before a dev tool
// builds a /api/test-cases search endpoint against it.
export interface TestCaseSearchFilters {
  storyId?: number | string;
  projectId?: number | string;
  title?: string;
  status?: string;
  priority?: string;
}

export const TEST_CASE_STATUSES = ['Open', 'In Progress', 'Closed'] as const;
export const TEST_CASE_PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const;