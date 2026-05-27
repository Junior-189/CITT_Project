const request = require('supertest');

describe('Projects API', () => {
  let user, token;
  const testPassword = 'Test@1234';

  beforeAll(async () => {
    user = await createTestUser({
      email: `project_test_${Date.now()}@test.com`,
      password: testPassword,
      account_status: 'approved',
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: testPassword });
    token = loginRes.body.accessToken;
  });

  describe('POST /api/admin/projects', () => {
    it('should create a project successfully', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Innovation Project',
          description: 'This is a test project for innovation tracking',
          category: 'Technology',
          institution: 'MUST',
          funding_needed: 5000000,
          problem_statement: 'Lack of access to clean water in rural areas',
        });

      expect(res.status).toBe(201);
      expect(res.body.project.title).toBe('Test Innovation Project');
      expect(res.body.project.approval_status).toBe('pending');
    });

    it('should reject project with missing required fields', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Missing title and category',
        });

      expect(res.status).toBe(400);
    });

    it('should reject project creation without auth', async () => {
      const res = await request(app)
        .post('/api/admin/projects')
        .send({
          title: 'Unauthenticated Project',
          description: 'Should fail',
          category: 'Tech',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/projects', () => {
    it('should list user projects', async () => {
      const res = await request(app)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.projects).toBeDefined();
      expect(Array.isArray(res.body.projects)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/admin/projects?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });
});
