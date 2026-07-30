jest.mock('../../src/services/userStoriesService');

const request = require('supertest');
const app = require('../../src/app');
const userStoriesService = require('../../src/services/userStoriesService');

describe('UserStories controller (via routes)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/user-stories (US-005)', () => {
    it('returns 201 with the created story', async () => {
      userStoriesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      userStoriesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      userStoriesService.createUserStory.mockResolvedValue({ StoryID: 1, ProjectID: 1, Title: 'Alpha' });

      const res = await request(app)
        .post('/api/user-stories')
        .send({ projectId: 1, title: 'Alpha', createdBy: 'Alice' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ StoryID: 1, ProjectID: 1, Title: 'Alpha' });
    });

    it('returns 400 when title is missing', async () => {
      userStoriesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      userStoriesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);

      const res = await request(app).post('/api/user-stories').send({ projectId: 1, createdBy: 'Alice' });
      expect(res.status).toBe(400);
      expect(userStoriesService.createUserStory).not.toHaveBeenCalled();
    });

    it('returns 404 when the service reports the project does not exist', async () => {
      userStoriesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      userStoriesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      const err = new Error('Project with ProjectID "999" was not found.');
      err.statusCode = 404;
      userStoriesService.createUserStory.mockRejectedValue(err);

      const res = await request(app)
        .post('/api/user-stories')
        .send({ projectId: 999, title: 'Alpha', createdBy: 'Alice' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/user-stories/:id', () => {
    it('returns 200 with the bare story object when found', async () => {
      userStoriesService.getUserStoryById.mockResolvedValue({ StoryID: 1, Title: 'Alpha' });
      const res = await request(app).get('/api/user-stories/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ StoryID: 1, Title: 'Alpha' });
    });

    it('returns 404 when not found', async () => {
      userStoriesService.getUserStoryById.mockResolvedValue(null);
      const res = await request(app).get('/api/user-stories/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/user-stories/:id (US-006)', () => {
    it('returns 200 with the updated story', async () => {
      userStoriesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      userStoriesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      userStoriesService.getUserStoryById.mockResolvedValue({ StoryID: 1, Title: 'Alpha' });
      userStoriesService.updateUserStory.mockResolvedValue({ StoryID: 1, Title: 'Alpha', Status: 'In Progress' });

      const res = await request(app).put('/api/user-stories/1').send({ Status: 'In Progress' });
      expect(res.status).toBe(200);
      expect(res.body.Status).toBe('In Progress');
    });

    it('returns 400 for an invalid Status', async () => {
      userStoriesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      userStoriesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);

      const res = await request(app).put('/api/user-stories/1').send({ Status: 'Bogus' });
      expect(res.status).toBe(400);
      expect(userStoriesService.updateUserStory).not.toHaveBeenCalled();
    });

    it('returns 400 when trying to modify an immutable field', async () => {
      userStoriesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      userStoriesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);

      const res = await request(app).put('/api/user-stories/1').send({ ProjectID: 99 });
      expect(res.status).toBe(400);
    });

    it('returns 404 when the story does not exist', async () => {
      userStoriesService.getAllowedPriorities.mockResolvedValue(['P1', 'P2', 'P3', 'P4']);
      userStoriesService.getAllowedStatuses.mockResolvedValue(['Open', 'In Progress', 'Closed']);
      userStoriesService.getUserStoryById.mockResolvedValue(null);

      const res = await request(app).put('/api/user-stories/999').send({ Status: 'Closed' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/user-stories (US-007)', () => {
    it('returns 200 with a bare array of matching stories', async () => {
      userStoriesService.searchUserStories.mockResolvedValue([{ StoryID: 1, Title: 'Login page' }]);

      const res = await request(app).get('/api/user-stories').query({ title: 'log' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ StoryID: 1, Title: 'Login page' }]);
      expect(userStoriesService.searchUserStories).toHaveBeenCalledWith({
        projectId: undefined,
        title: 'log',
        status: undefined,
        priority: undefined,
      });
    });

    it('returns an empty array when nothing matches', async () => {
      userStoriesService.searchUserStories.mockResolvedValue([]);
      const res = await request(app).get('/api/user-stories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
