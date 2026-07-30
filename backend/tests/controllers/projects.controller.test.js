jest.mock('../../src/services/projectsService');

const request = require('supertest');
const app = require('../../src/app');
const projectsService = require('../../src/services/projectsService');

describe('Projects controller (via routes)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/projects (US-001)', () => {
    it('returns 201 with the created project', async () => {
      projectsService.createProject.mockResolvedValue({ ProjectID: 1, ProjectName: 'Alpha' });

      const res = await request(app).post('/api/projects').send({ projectName: 'Alpha' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ ProjectID: 1, ProjectName: 'Alpha' });
    });

    it('returns 400 when projectName is missing', async () => {
      const res = await request(app).post('/api/projects').send({});
      expect(res.status).toBe(400);
      expect(projectsService.createProject).not.toHaveBeenCalled();
    });

    it('returns 409 when the service reports a duplicate name', async () => {
      const err = new Error('A project named "Alpha" already exists (ProjectID 1).');
      err.statusCode = 409;
      projectsService.createProject.mockRejectedValue(err);

      const res = await request(app).post('/api/projects').send({ projectName: 'Alpha' });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/projects/:id (US-003, also used to pre-fill Edit Project)', () => {
    it('returns 200 with the bare project object (unwrapped) when found', async () => {
      projectsService.getProjectById.mockResolvedValue({ ProjectID: 1, ProjectName: 'Alpha' });
      const res = await request(app).get('/api/projects/1');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ProjectID: 1, ProjectName: 'Alpha' });
    });

    it('returns 404 when not found', async () => {
      projectsService.getProjectById.mockResolvedValue(null);
      const res = await request(app).get('/api/projects/999');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/projects/:id (US-002)', () => {
    it('returns 200 with the updated project', async () => {
      projectsService.getAllowedStatuses.mockResolvedValue(['Active', 'On Hold', 'Completed']);
      projectsService.getProjectById.mockResolvedValue({ ProjectID: 1, ProjectName: 'Alpha' });
      projectsService.updateProject.mockResolvedValue({ ProjectID: 1, ProjectName: 'Alpha', Status: 'On Hold' });

      const res = await request(app).put('/api/projects/1').send({ Status: 'On Hold' });
      expect(res.status).toBe(200);
      expect(res.body.Status).toBe('On Hold');
    });

    it('returns 400 for an invalid Status', async () => {
      projectsService.getAllowedStatuses.mockResolvedValue(['Active', 'On Hold', 'Completed']);

      const res = await request(app).put('/api/projects/1').send({ Status: 'Cancelled' });
      expect(res.status).toBe(400);
      expect(projectsService.updateProject).not.toHaveBeenCalled();
    });

    it('returns 400 when trying to modify an immutable field', async () => {
      projectsService.getAllowedStatuses.mockResolvedValue(['Active', 'On Hold', 'Completed']);

      const res = await request(app).put('/api/projects/1').send({ ProjectID: 99 });
      expect(res.status).toBe(400);
    });

    it('returns 404 when the project does not exist', async () => {
      projectsService.getAllowedStatuses.mockResolvedValue(['Active', 'On Hold', 'Completed']);
      projectsService.getProjectById.mockResolvedValue(null);

      const res = await request(app).put('/api/projects/999').send({ Status: 'On Hold' });
      expect(res.status).toBe(404);
    });
  });
});
