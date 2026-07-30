const { createTestWorkbook, cleanupTestWorkbook } = require('../helpers/testWorkbook');
const testCasesService = require('../../src/services/testCasesService');
const userStoriesService = require('../../src/services/userStoriesService');
const projectsService = require('../../src/services/projectsService');

describe('testCasesService', () => {
  let filePath;
  let projectId;
  let storyId;

  beforeEach(async () => {
    filePath = await createTestWorkbook();
    const project = await projectsService.createProject({ projectName: 'Test Project' }, filePath);
    projectId = project.ProjectID;
    const story = await userStoriesService.createUserStory(
      { projectId, title: 'Login story', createdBy: 'Alice' }, filePath
    );
    storyId = story.StoryID;
  });

  afterEach(() => {
    cleanupTestWorkbook(filePath);
  });

  describe('createTestCase (US-009)', () => {
    it('assigns TestCaseID 1 to the first test case and defaults Status to Open', async () => {
      const tc = await testCasesService.createTestCase(
        { storyId, projectId, title: 'Login with valid creds' }, filePath
      );
      expect(tc.TestCaseID).toBe(1);
      expect(tc.StoryID).toBe(storyId);
      expect(tc.ProjectID).toBe(projectId);
      expect(tc.Title).toBe('Login with valid creds');
      expect(tc.Status).toBe('Open');
    });

    it('increments TestCaseID for subsequent test cases', async () => {
      await testCasesService.createTestCase({ storyId, projectId, title: 'TC 1' }, filePath);
      const tc2 = await testCasesService.createTestCase({ storyId, projectId, title: 'TC 2' }, filePath);
      expect(tc2.TestCaseID).toBe(2);
    });

    it('rejects creating a test case for a non-existent story', async () => {
      await expect(
        testCasesService.createTestCase({ storyId: 999, projectId, title: 'X' }, filePath)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects creating a test case when projectId does not match the story', async () => {
      const other = await projectsService.createProject({ projectName: 'Other' }, filePath);
      await expect(
        testCasesService.createTestCase({ storyId, projectId: other.ProjectID, title: 'X' }, filePath)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('stores all optional fields correctly', async () => {
      const tc = await testCasesService.createTestCase(
        { storyId, projectId, title: 'TC', description: 'desc', preconditions: 'pre',
          testSteps: 'steps', expectedResult: 'result', priority: 'P1', status: 'In Progress' },
        filePath
      );
      expect(tc.Description).toBe('desc');
      expect(tc.Preconditions).toBe('pre');
      expect(tc.TestSteps).toBe('steps');
      expect(tc.ExpectedResult).toBe('result');
      expect(tc.Priority).toBe('P1');
      expect(tc.Status).toBe('In Progress');
    });

    it('serializes concurrent creates so TestCaseIDs never collide', async () => {
      const results = await Promise.all([
        testCasesService.createTestCase({ storyId, projectId, title: 'A' }, filePath),
        testCasesService.createTestCase({ storyId, projectId, title: 'B' }, filePath),
        testCasesService.createTestCase({ storyId, projectId, title: 'C' }, filePath),
      ]);
      const ids = results.map((tc) => tc.TestCaseID).sort();
      expect(ids).toEqual([1, 2, 3]);
    });
  });

  describe('getTestCaseById', () => {
    it('returns null for a non-existent test case', async () => {
      expect(await testCasesService.getTestCaseById(999, filePath)).toBeNull();
    });

    it('returns the test case when it exists', async () => {
      await testCasesService.createTestCase({ storyId, projectId, title: 'Alpha' }, filePath);
      const tc = await testCasesService.getTestCaseById(1, filePath);
      expect(tc.Title).toBe('Alpha');
    });
  });

  describe('getTestCasesByStoryId', () => {
    it('returns all test cases for the given story', async () => {
      await testCasesService.createTestCase({ storyId, projectId, title: 'TC 1' }, filePath);
      await testCasesService.createTestCase({ storyId, projectId, title: 'TC 2' }, filePath);
      const results = await testCasesService.getTestCasesByStoryId(storyId, filePath);
      expect(results).toHaveLength(2);
      expect(results.every((tc) => tc.StoryID === storyId)).toBe(true);
    });

    it('returns an empty array when the story has no test cases', async () => {
      const results = await testCasesService.getTestCasesByStoryId(storyId, filePath);
      expect(results).toEqual([]);
    });

    it('does not return test cases belonging to a different story', async () => {
      const story2 = await userStoriesService.createUserStory(
        { projectId, title: 'Other story', createdBy: 'Alice' }, filePath
      );
      await testCasesService.createTestCase({ storyId: story2.StoryID, projectId, title: 'Other TC' }, filePath);
      await testCasesService.createTestCase({ storyId, projectId, title: 'My TC' }, filePath);

      const results = await testCasesService.getTestCasesByStoryId(storyId, filePath);
      expect(results).toHaveLength(1);
      expect(results[0].Title).toBe('My TC');
    });

    it('throws 404 when the story does not exist', async () => {
      await expect(
        testCasesService.getTestCasesByStoryId(999999, filePath)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('updateTestCase (US-010)', () => {
    it('updates only the provided editable fields', async () => {
      await testCasesService.createTestCase(
        { storyId, projectId, title: 'Original', description: 'Old desc' }, filePath
      );
      const updated = await testCasesService.updateTestCase(1, { Description: 'New desc' }, filePath);
      expect(updated.Description).toBe('New desc');
      expect(updated.Title).toBe('Original');
    });

    it('never changes TestCaseID, StoryID, ProjectID, or CreatedDate', async () => {
      const created = await testCasesService.createTestCase(
        { storyId, projectId, title: 'Alpha' }, filePath
      );
      const updated = await testCasesService.updateTestCase(1, { Status: 'In Progress' }, filePath);
      expect(updated.TestCaseID).toBe(created.TestCaseID);
      expect(updated.StoryID).toBe(created.StoryID);
      expect(updated.ProjectID).toBe(created.ProjectID);
      expect(updated.CreatedDate).toBe(created.CreatedDate);
    });

    it('returns null when the test case does not exist', async () => {
      const result = await testCasesService.updateTestCase(999, { Status: 'Closed' }, filePath);
      expect(result).toBeNull();
    });
  });

  describe('getAllowedPriorities / getAllowedStatuses', () => {
    it('reads Priority values from the Settings sheet', async () => {
      expect(await testCasesService.getAllowedPriorities(filePath)).toEqual(['P1', 'P2', 'P3', 'P4']);
    });

    it('reads Status values from the Settings sheet', async () => {
      expect(await testCasesService.getAllowedStatuses(filePath)).toEqual(['Open', 'In Progress', 'Closed']);
    });
  });
});
