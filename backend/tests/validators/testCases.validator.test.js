const {
  validateCreateTestCasePayload,
  validateEditTestCasePayload,
} = require('../../src/validators/testCases.validator');

const allowedPriorities = ['P1', 'P2', 'P3', 'P4'];
const allowedStatuses = ['Open', 'In Progress', 'Closed'];

describe('validateCreateTestCasePayload (US-009)', () => {
  const basePayload = { storyId: 1, projectId: 1, title: 'Login with valid credentials' };

  it('accepts a minimal valid payload', () => {
    const { valid, errors } = validateCreateTestCasePayload(basePayload, allowedPriorities, allowedStatuses);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('rejects a missing storyId', () => {
    const { valid, errors } = validateCreateTestCasePayload(
      { projectId: 1, title: 'X' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('storyId is required and must reference an existing user story.');
  });

  it('rejects a missing projectId', () => {
    const { valid, errors } = validateCreateTestCasePayload(
      { storyId: 1, title: 'X' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('projectId is required and must reference an existing project.');
  });

  it('rejects a missing title', () => {
    const { valid, errors } = validateCreateTestCasePayload(
      { storyId: 1, projectId: 1 }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('title is required and must be a non-empty string.');
  });

  it('accepts all optional string fields', () => {
    const { valid } = validateCreateTestCasePayload(
      { ...basePayload, description: 'desc', preconditions: 'pre', testSteps: 'steps', expectedResult: 'result' },
      allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(true);
  });

  it('rejects a priority not in the allowed list', () => {
    const { valid, errors } = validateCreateTestCasePayload(
      { ...basePayload, priority: 'P99' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/priority must be one of/);
  });

  it('rejects a status not in the allowed list', () => {
    const { valid, errors } = validateCreateTestCasePayload(
      { ...basePayload, status: 'Bogus' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/status must be one of/);
  });

  it('rejects a non-object payload', () => {
    const { valid } = validateCreateTestCasePayload(null, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
  });
});

describe('validateEditTestCasePayload (US-010)', () => {
  it('accepts a valid partial update', () => {
    const { valid, errors } = validateEditTestCasePayload({ Status: 'In Progress' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('rejects attempts to modify TestCaseID', () => {
    const { valid, errors } = validateEditTestCasePayload({ TestCaseID: 99 }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors).toContain('Field "TestCaseID" cannot be modified via Edit Test Case.');
  });

  it('rejects attempts to modify StoryID or ProjectID', () => {
    const { valid, errors } = validateEditTestCasePayload(
      { StoryID: 1, ProjectID: 1 }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('Field "StoryID" cannot be modified via Edit Test Case.');
    expect(errors).toContain('Field "ProjectID" cannot be modified via Edit Test Case.');
  });

  it('rejects an empty payload (no editable fields)', () => {
    const { valid, errors } = validateEditTestCasePayload({}, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a Priority not in the allowed list', () => {
    const { valid, errors } = validateEditTestCasePayload({ Priority: 'P99' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/Priority must be one of/);
  });

  it('rejects a Status not in the allowed list', () => {
    const { valid, errors } = validateEditTestCasePayload({ Status: 'Bogus' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/Status must be one of/);
  });

  it('rejects an empty Title', () => {
    const { valid } = validateEditTestCasePayload({ Title: '' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
  });

  it('accepts nullable string fields (Description, Preconditions, etc.)', () => {
    const { valid } = validateEditTestCasePayload(
      { Description: null, Preconditions: null, TestSteps: 'step 1', ExpectedResult: null },
      allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(true);
  });
});
