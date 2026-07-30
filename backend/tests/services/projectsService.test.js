const { createTestWorkbook, cleanupTestWorkbook } = require('../helpers/testWorkbook');
const projectsService = require('../../src/services/projectsService');

describe('projectsService', () => {
  let filePath;

  beforeEach(async () => {
    filePath = await createTestWorkbook();
  });

  afterEach(() => {
    cleanupTestWorkbook(filePath);
  });

  describe('createProject (US-001)', () => {
    it('assigns ProjectID 1 to the first project', async () => {
      const project = await projectsService.createProject({ projectName: 'Alpha' }, filePath);
      expect(project.ProjectID).toBe(1);
      expect(project.ProjectName).toBe('Alpha');
      expect(project.Status).toBe('Active');
    });

    it('increments ProjectID for subsequent projects', async () => {
      await projectsService.createProject({ projectName: 'Alpha' }, filePath);
      const second = await projectsService.createProject({ projectName: 'Beta' }, filePath);
      expect(second.ProjectID).toBe(2);
    });

    it('rejects a duplicate project name (case-insensitive)', async () => {
      await projectsService.createProject({ projectName: 'Alpha' }, filePath);
      await expect(
        projectsService.createProject({ projectName: 'alpha' }, filePath)
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('getProjectById', () => {
    it('returns null for a non-existent project', async () => {
      const result = await projectsService.getProjectById(999, filePath);
      expect(result).toBeNull();
    });

    it('returns the project when it exists', async () => {
      await projectsService.createProject({ projectName: 'Alpha' }, filePath);
      const result = await projectsService.getProjectById(1, filePath);
      expect(result.ProjectName).toBe('Alpha');
    });
  });

  describe('updateProject (US-002)', () => {
    it('updates only the provided editable fields', async () => {
      await projectsService.createProject({ projectName: 'Alpha', description: 'Original' }, filePath);
      const updated = await projectsService.updateProject(1, { Description: 'Updated' }, filePath);

      expect(updated.Description).toBe('Updated');
      expect(updated.ProjectName).toBe('Alpha'); // untouched
    });

    it('never changes ProjectID or CreatedDate', async () => {
      const created = await projectsService.createProject({ projectName: 'Alpha' }, filePath);
      const updated = await projectsService.updateProject(1, { Status: 'On Hold' }, filePath);

      expect(updated.ProjectID).toBe(created.ProjectID);
      expect(updated.CreatedDate).toBe(created.CreatedDate);
    });

    it('returns null when the project does not exist', async () => {
      const result = await projectsService.updateProject(999, { Status: 'On Hold' }, filePath);
      expect(result).toBeNull();
    });

    it('rejects renaming a project to another existing project\'s name (case-insensitive)', async () => {
      await projectsService.createProject({ projectName: 'Alpha' }, filePath);
      await projectsService.createProject({ projectName: 'Beta' }, filePath);

      await expect(
        projectsService.updateProject(2, { ProjectName: 'alpha' }, filePath)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('allows a project to keep its own name unchanged (case-different) without colliding with itself', async () => {
      await projectsService.createProject({ projectName: 'Alpha' }, filePath);
      const updated = await projectsService.updateProject(1, { ProjectName: 'ALPHA' }, filePath);
      expect(updated.ProjectName).toBe('ALPHA');
    });

    it('serializes concurrent creates so ProjectIDs never collide', async () => {
      const results = await Promise.all([
        projectsService.createProject({ projectName: 'Concurrent A' }, filePath),
        projectsService.createProject({ projectName: 'Concurrent B' }, filePath),
        projectsService.createProject({ projectName: 'Concurrent C' }, filePath),
      ]);
      const ids = results.map((p) => p.ProjectID).sort();
      expect(ids).toEqual([1, 2, 3]);
    });
  });

  describe('getAllowedStatuses', () => {
    it('reads Status values from the Settings sheet', async () => {
      const statuses = await projectsService.getAllowedStatuses(filePath);
      expect(statuses).toEqual(['Active', 'On Hold', 'Completed']);
    });
  });
});
