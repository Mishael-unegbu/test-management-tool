jest.mock('../../src/services/testCasesService');

const request = require('supertest');
const app = require('../../src/app');
const testCasesService = require('../../src/services/testCasesService');

describe('TestCases controller (via routes)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/test-cases (US-009)', () => {
    it('returns 201 with the created test case', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      testCasesService.createTestCase.mockResolvedValue({
        TestCaseID: 1, StoryID: 1, ProjectID: 1, Title: 'Alpha',
      });

      const res = await request(app)
        .post('/api/test-cases')
        .send({ storyId: 1, projectId: 1, title: 'Alpha' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ TestCaseID: 1, Title: 'Alpha' });
    });

    it('returns 400 when title is missing', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);

      const res = await request(app).post('/api/test-cases').send({ storyId: 1, projectId: 1 });
      expect(res.status).toBe(400);
      expect(testCasesService.createTestCase).not.toHaveBeenCalled();
    });

    it('returns 400 when storyId is missing', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);

      const res = await request(app).post('/api/test-cases').send({ projectId: 1, title: 'X' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when the service reports the story does not exist', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      const err = new Error('User story not found.');
      err.statusCode = 404;
      testCasesService.createTestCase.mockRejectedValue(err);

      const res = await request(app).post('/api/test-cases').send({ storyId: 999, projectId: 1, title: 'X' });
      expect(res.status).toBe(404);
    });

    it('returns 400 when projectId does not match the story', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      const err = new Error('Story belongs to a different project.');
      err.statusCode = 400;
      testCasesService.createTestCase.mockRejectedValue(err);

      const res = await request(app).post('/api/test-cases').send({ storyId: 1, projectId: 99, title: 'X' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/test-cases/:id', () => {
    it('returns 200 with the bare test case object when found', async () => {
      testCasesService.getTestCaseById.mockResolvedValue({ TestCaseID: 1, Title: 'Alpha' });
      const res = await request(app).get('/api/test-cases/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ TestCaseID: 1, Title: 'Alpha' });
    });

    it('returns 404 when not found', async () => {
      testCasesService.getTestCaseById.mockResolvedValue(null);
      const res = await request(app).get('/api/test-cases/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/user-stories/:storyId/test-cases', () => {
    it('returns 200 with all test cases for the story', async () => {
      testCasesService.getTestCasesByStoryId.mockResolvedValue([
        { TestCaseID: 1, StoryID: 1, Title: 'TC 1' },
        { TestCaseID: 2, StoryID: 1, Title: 'TC 2' },
      ]);

      const res = await request(app).get('/api/user-stories/1/test-cases');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('returns 200 with an empty array when the story has no test cases', async () => {
      testCasesService.getTestCasesByStoryId.mockResolvedValue([]);
      const res = await request(app).get('/api/user-stories/1/test-cases');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 404 when the story does not exist', async () => {
      const err = new Error('User story not found.');
      err.statusCode = 404;
      testCasesService.getTestCasesByStoryId.mockRejectedValue(err);

      const res = await request(app).get('/api/user-stories/999/test-cases');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/test-cases/:id (US-010)', () => {
    it('returns 200 with the updated test case', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      testCasesService.getTestCaseById.mockResolvedValue({ TestCaseID: 1, Title: 'Alpha' });
      testCasesService.updateTestCase.mockResolvedValue({ TestCaseID: 1, Title: 'Alpha', Status: 'In Progress' });

      const res = await request(app).put('/api/test-cases/1').send({ Status: 'In Progress' });
      expect(res.status).toBe(200);
      expect(res.body.Status).toBe('In Progress');
    });

    it('returns 400 for an invalid Status', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);

      const res = await request(app).put('/api/test-cases/1').send({ Status: 'Bogus' });
      expect(res.status).toBe(400);
      expect(testCasesService.updateTestCase).not.toHaveBeenCalled();
    });

    it('returns 400 when trying to modify an immutable field', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);

      const res = await request(app).put('/api/test-cases/1').send({ StoryID: 99 });
      expect(res.status).toBe(400);
    });

    it('returns 404 when the test case does not exist', async () => {
      testCasesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      testCasesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      testCasesService.getTestCaseById.mockResolvedValue(null);

      const res = await request(app).put('/api/test-cases/999').send({ Status: 'Closed' });
      expect(res.status).toBe(404);
    });
  });
});
