const {
  validateCreateProjectPayload,
  validateEditProjectPayload,
} = require('../../src/validators/projects.validator');

describe('validateCreateProjectPayload (US-001)', () => {
  it('accepts a minimal valid payload', () => {
    const { valid, errors } = validateCreateProjectPayload({ projectName: 'My Project' });
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('rejects a missing projectName', () => {
    const { valid, errors } = validateCreateProjectPayload({});
    expect(valid).toBe(false);
    expect(errors).toContain('projectName is required and must be a non-empty string.');
  });

  it('rejects a blank projectName', () => {
    const { valid } = validateCreateProjectPayload({ projectName: '   ' });
    expect(valid).toBe(false);
  });

  it('rejects endDate earlier than startDate', () => {
    const { valid, errors } = validateCreateProjectPayload({
      projectName: 'X',
      startDate: '2026-05-01',
      endDate: '2026-01-01',
    });
    expect(valid).toBe(false);
    expect(errors).toContain('EndDate cannot be earlier than StartDate.');
  });

  it('rejects a non-object payload', () => {
    const { valid } = validateCreateProjectPayload(null);
    expect(valid).toBe(false);
  });

  it('accepts a status that is in the allowed list', () => {
    const { valid, errors } = validateCreateProjectPayload({ projectName: 'X', status: 'On Hold' });
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('rejects a status that is not in the allowed list', () => {
    const { valid, errors } = validateCreateProjectPayload({ projectName: 'X', status: 'Cancelled' });
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/status must be one of/);
  });
});

describe('validateEditProjectPayload (US-002)', () => {
  const allowedStatuses = ['Active', 'On Hold', 'Completed'];

  it('accepts a valid partial update', () => {
    const { valid, errors } = validateEditProjectPayload({ Status: 'On Hold' }, allowedStatuses);
    expect(valid).toBe(true);
    expect(errors).toEqual([]);
  });

  it('rejects attempts to modify immutable fields', () => {
    const { valid, errors } = validateEditProjectPayload({ ProjectID: 99 }, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors).toContain('Field "ProjectID" cannot be modified via Edit Project.');
  });

  it('rejects an empty payload (no editable fields)', () => {
    const { valid, errors } = validateEditProjectPayload({}, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a Status not in the allowed list', () => {
    const { valid, errors } = validateEditProjectPayload({ Status: 'Cancelled' }, allowedStatuses);
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/Status must be one of/);
  });

  it('rejects an empty ProjectName', () => {
    const { valid } = validateEditProjectPayload({ ProjectName: '' }, allowedStatuses);
    expect(valid).toBe(false);
  });
});
