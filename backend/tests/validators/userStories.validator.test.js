const {
  validateCreateUserStoryPayload,
  validateEditUserStoryPayload,
} = require('../../src/validators/userStories.validator');

const allowedPriorities = ['P1', 'P2', 'P3', 'P4'];
const allowedStatuses = ['Open', 'In Progress', 'Closed'];

describe('validateCreateUserStoryPayload (US-005)', () => {
  const basePayload = { projectId: 1, title: 'My Story', createdBy: 'Alice' };

  it('accepts a minimal valid payload', () => {
    const { valid, errors } = validateCreateUserStoryPayload(basePayload, allowedPriorities, allowedStatuses);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('rejects a missing projectId', () => {
    const { valid, errors } = validateCreateUserStoryPayload(
      { title: 'X', createdBy: 'Alice' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('projectId is required and must reference an existing project.');
  });

  it('rejects a missing title', () => {
    const { valid, errors } = validateCreateUserStoryPayload(
      { projectId: 1, createdBy: 'Alice' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('title is required and must be a non-empty string.');
  });

  it('rejects a missing createdBy', () => {
    const { valid, errors } = validateCreateUserStoryPayload(
      { projectId: 1, title: 'X' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('createdBy is required and must be a non-empty string.');
  });

  it('accepts a priority in the allowed list', () => {
    const { valid } = validateCreateUserStoryPayload(
      { ...basePayload, priority: 'P2' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(true);
  });

  it('rejects a priority not in the allowed list', () => {
    const { valid, errors } = validateCreateUserStoryPayload(
      { ...basePayload, priority: 'P99' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/priority must be one of/);
  });

  it('rejects a status not in the allowed list', () => {
    const { valid, errors } = validateCreateUserStoryPayload(
      { ...basePayload, status: 'Bogus' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/status must be one of/);
  });

  it('rejects a non-object payload', () => {
    const { valid } = validateCreateUserStoryPayload(null, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
  });
});

describe('validateEditUserStoryPayload (US-006)', () => {
  it('accepts a valid partial update', () => {
    const { valid, errors } = validateEditUserStoryPayload({ Status: 'In Progress' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('rejects attempts to modify immutable fields', () => {
    const { valid, errors } = validateEditUserStoryPayload({ ProjectID: 99 }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors).toContain('Field "ProjectID" cannot be modified via Edit User Story.');
  });

  it('rejects attempts to modify StoryID or CreatedBy', () => {
    const { valid, errors } = validateEditUserStoryPayload(
      { StoryID: 1, CreatedBy: 'Someone Else' }, allowedPriorities, allowedStatuses
    );
    expect(valid).toBe(false);
    expect(errors).toContain('Field "StoryID" cannot be modified via Edit User Story.');
    expect(errors).toContain('Field "CreatedBy" cannot be modified via Edit User Story.');
  });

  it('rejects an empty payload (no editable fields)', () => {
    const { valid, errors } = validateEditUserStoryPayload({}, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a Priority not in the allowed list', () => {
    const { valid, errors } = validateEditUserStoryPayload({ Priority: 'P99' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/Priority must be one of/);
  });

  it('rejects a Status not in the allowed list', () => {
    const { valid, errors } = validateEditUserStoryPayload({ Status: 'Bogus' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/Status must be one of/);
  });

  it('rejects an empty Title', () => {
    const { valid } = validateEditUserStoryPayload({ Title: '' }, allowedPriorities, allowedStatuses);
    expect(valid).toBe(false);
  });
});
