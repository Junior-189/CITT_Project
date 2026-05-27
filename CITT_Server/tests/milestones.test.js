const request = require('supertest');

describe('Milestones API', () => {
  let user, admin, userToken, adminToken;
  const testPassword = 'Test@1234';

  beforeAll(async () => {
    user = await createTestUser({
      email: `milestone_user_${Date.now()}@test.com`,
      password: testPassword,
      account_status: 'approved',
    });

    admin = await createTestUser({
      email: `milestone_admin_${Date.now()}@test.com`,
      password: testPassword,
      role: 'admin',
      account_status: 'approved',
    });

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: testPassword });
    userToken = userLogin.body.accessToken;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: testPassword });
    adminToken = adminLogin.body.accessToken;
  });

  describe('Project milestone lifecycle', () => {
    let projectId;

    beforeAll(async () => {
      const projectRes = await request(app)
        .post('/api/admin/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Milestone Test Project',
          description: 'Testing milestone lifecycle',
          category: 'Research',
          institution: 'MUST',
          funding_needed: 1000000,
          problem_statement: 'Testing milestone tracking',
        });
      projectId = projectRes.body.project.id;
    });

    it('should get milestones for a project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status === 200 || res.status === 404).toBe(true);
    });

    it('should reject milestone access without auth', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/milestones`);

      expect(res.status).toBe(401);
    });
  });
});
