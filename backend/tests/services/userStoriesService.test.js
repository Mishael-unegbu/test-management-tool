const { createTestWorkbook, cleanupTestWorkbook } = require('../helpers/testWorkbook');
const userStoriesService = require('../../src/services/userStoriesService');
const projectsService = require('../../src/services/projectsService');

describe('userStoriesService', () => {
  let filePath;
  let projectId;

  beforeEach(async () => {
    filePath = await createTestWorkbook();
    const project = await projectsService.createProject({ projectName: 'Host Project' }, filePath);
    projectId = project.ProjectID;
  });

  afterEach(() => {
    cleanupTestWorkbook(filePath);
  });

  describe('createUserStory (US-005)', () => {
    it('assigns StoryID 1 to the first story and defaults Status to Open', async () => {
      const story = await userStoriesService.createUserStory(
        { projectId, title: 'Alpha Story', createdBy: 'Alice' }, filePath
      );
      expect(story.StoryID).toBe(1);
      expect(story.ProjectID).toBe(projectId);
      expect(story.Title).toBe('Alpha Story');
      expect(story.Status).toBe('Open');
      expect(story.CreatedBy).toBe('Alice');
    });

    it('increments StoryID for subsequent stories', async () => {
      await userStoriesService.createUserStory({ projectId, title: 'Alpha', createdBy: 'Alice' }, filePath);
      const second = await userStoriesService.createUserStory(
        { projectId, title: 'Beta', createdBy: 'Alice' }, filePath
      );
      expect(second.StoryID).toBe(2);
    });

    it('rejects creating a story under a non-existent project', async () => {
      await expect(
        userStoriesService.createUserStory({ projectId: 999999, title: 'X', createdBy: 'Alice' }, filePath)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('allows two stories with the same title (not required to be unique)', async () => {
      await userStoriesService.createUserStory({ projectId, title: 'Dup', createdBy: 'Alice' }, filePath);
      await expect(
        userStoriesService.createUserStory({ projectId, title: 'Dup', createdBy: 'Alice' }, filePath)
      ).resolves.toMatchObject({ Title: 'Dup' });
    });

    it('serializes concurrent creates so StoryIDs never collide', async () => {
      const results = await Promise.all([
        userStoriesService.createUserStory({ projectId, title: 'A', createdBy: 'Alice' }, filePath),
        userStoriesService.createUserStory({ projectId, title: 'B', createdBy: 'Alice' }, filePath),
        userStoriesService.createUserStory({ projectId, title: 'C', createdBy: 'Alice' }, filePath),
      ]);
      const ids = results.map((s) => s.StoryID).sort();
      expect(ids).toEqual([1, 2, 3]);
    });
  });

  describe('getUserStoriesByProjectId', () => {
    it('returns all stories for the given project', async () => {
      await userStoriesService.createUserStory({ projectId, title: 'Story A', createdBy: 'Alice' }, filePath);
      await userStoriesService.createUserStory({ projectId, title: 'Story B', createdBy: 'Alice' }, filePath);

      const results = await userStoriesService.getUserStoriesByProjectId(projectId, filePath);
      expect(results).toHaveLength(2);
      expect(results.every((s) => s.ProjectID === projectId)).toBe(true);
    });

    it('returns an empty array when the project has no stories', async () => {
      const results = await userStoriesService.getUserStoriesByProjectId(projectId, filePath);
      expect(results).toEqual([]);
    });

    it('does not return stories belonging to a different project', async () => {
      const otherProject = await projectsService.createProject({ projectName: 'Other' }, filePath);
      await userStoriesService.createUserStory({ projectId: otherProject.ProjectID, title: 'Other story', createdBy: 'Alice' }, filePath);
      await userStoriesService.createUserStory({ projectId, title: 'My story', createdBy: 'Alice' }, filePath);

      const results = await userStoriesService.getUserStoriesByProjectId(projectId, filePath);
      expect(results).toHaveLength(1);
      expect(results[0].Title).toBe('My story');
    });

    it('throws 404 when the project does not exist', async () => {
      await expect(
        userStoriesService.getUserStoriesByProjectId(999999, filePath)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('getUserStoryById', () => {
    it('returns null for a non-existent story', async () => {
      const result = await userStoriesService.getUserStoryById(999, filePath);
      expect(result).toBeNull();
    });

    it('returns the story when it exists', async () => {
      await userStoriesService.createUserStory({ projectId, title: 'Alpha', createdBy: 'Alice' }, filePath);
      const result = await userStoriesService.getUserStoryById(1, filePath);
      expect(result.Title).toBe('Alpha');
    });
  });

  describe('updateUserStory (US-006)', () => {
    it('updates only the provided editable fields', async () => {
      await userStoriesService.createUserStory(
        { projectId, title: 'Alpha', description: 'Original', createdBy: 'Alice' }, filePath
      );
      const updated = await userStoriesService.updateUserStory(1, { Description: 'Updated' }, filePath);
      expect(updated.Description).toBe('Updated');
      expect(updated.Title).toBe('Alpha');
    });

    it('never changes StoryID, ProjectID, CreatedBy, or CreatedDate', async () => {
      const created = await userStoriesService.createUserStory(
        { projectId, title: 'Alpha', createdBy: 'Alice' }, filePath
      );
      const updated = await userStoriesService.updateUserStory(1, { Status: 'In Progress' }, filePath);
      expect(updated.StoryID).toBe(created.StoryID);
      expect(updated.ProjectID).toBe(created.ProjectID);
      expect(updated.CreatedBy).toBe(created.CreatedBy);
      expect(updated.CreatedDate).toBe(created.CreatedDate);
    });

    it('returns null when the story does not exist', async () => {
      const result = await userStoriesService.updateUserStory(999, { Status: 'Closed' }, filePath);
      expect(result).toBeNull();
    });
  });

  describe('searchUserStories (US-007)', () => {
    beforeEach(async () => {
      await userStoriesService.createUserStory(
        { projectId, title: 'Login page', status: 'Open', priority: 'P1', createdBy: 'Alice' }, filePath
      );
      await userStoriesService.createUserStory(
        { projectId, title: 'Logout flow', status: 'In Progress', priority: 'P2', createdBy: 'Alice' }, filePath
      );
      await userStoriesService.createUserStory(
        { projectId, title: 'Unrelated item', status: 'Closed', priority: 'P3', createdBy: 'Alice' }, filePath
      );
    });

    it('returns all stories when no filters are given', async () => {
      const results = await userStoriesService.searchUserStories({}, filePath);
      expect(results).toHaveLength(3);
    });

    it('filters by case-insensitive partial title match', async () => {
      const results = await userStoriesService.searchUserStories({ title: 'log' }, filePath);
      expect(results.map((r) => r.Title).sort()).toEqual(['Login page', 'Logout flow']);
    });

    it('filters by exact status', async () => {
      const results = await userStoriesService.searchUserStories({ status: 'Closed' }, filePath);
      expect(results).toHaveLength(1);
      expect(results[0].Title).toBe('Unrelated item');
    });

    it('filters by exact priority', async () => {
      const results = await userStoriesService.searchUserStories({ priority: 'P1' }, filePath);
      expect(results).toHaveLength(1);
      expect(results[0].Title).toBe('Login page');
    });

    it('combines filters with AND', async () => {
      const results = await userStoriesService.searchUserStories({ title: 'log', status: 'Open' }, filePath);
      expect(results).toHaveLength(1);
      expect(results[0].Title).toBe('Login page');
    });

    it('filters by projectId', async () => {
      const otherProject = await projectsService.createProject({ projectName: 'Other Project' }, filePath);
      await userStoriesService.createUserStory(
        { projectId: otherProject.ProjectID, title: 'Other story', createdBy: 'Alice' }, filePath
      );
      const results = await userStoriesService.searchUserStories({ projectId }, filePath);
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.ProjectID === projectId)).toBe(true);
    });
  });

  describe('getAllowedPriorities / getAllowedStatuses', () => {
    it('reads Priority values from the Settings sheet', async () => {
      const priorities = await userStoriesService.getAllowedPriorities(filePath);
      expect(priorities).toEqual(['P1', 'P2', 'P3', 'P4']);
    });

    it('reads Status values from the Settings sheet', async () => {
      const statuses = await userStoriesService.getAllowedStatuses(filePath);
      expect(statuses).toEqual(['Open', 'In Progress', 'Closed']);
    });
  });
});
