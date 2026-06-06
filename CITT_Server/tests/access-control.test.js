const request = require('supertest');

describe('API Access Control', () => {
  let innovatorUser, innovatorToken;
  let adminUser, adminToken;
  let pendingUser;
  const testPassword = 'Test@1234';

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'test%@test.com'");
    await pool.end();
  });

  beforeAll(async () => {
    // Create an approved innovator
    innovatorUser = await createTestUser({
      email: `ac_innovator_${Date.now()}@test.com`,
      password: testPassword,
      role: 'innovator',
      account_status: 'approved',
    });
    const innovatorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: innovatorUser.email, password: testPassword });
    innovatorToken = innovatorLogin.body.accessToken;

    // Create an admin user
    adminUser = await createTestUser({
      email: `ac_admin_${Date.now()}@test.com`,
      password: testPassword,
      role: 'admin',
      account_status: 'approved',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: testPassword });
    adminToken = adminLogin.body.accessToken;

    // Create a pending user
    pendingUser = await createTestUser({
      email: `ac_pending_${Date.now()}@test.com`,
      password: testPassword,
      role: 'innovator',
      account_status: 'pending',
    });
  });

  describe('GET /api/users', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid_token_here');
      expect(res.status).toBe(403);
    });

    it('should return 403 for innovator role', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${innovatorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied');
    });

    it('should return paginated users for admin role', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.users).toBeDefined();
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(50);
    });

    it('should return paginated users for admin role', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(2);
    });
  });

  describe('Login: pending vs approved vs rejected', () => {
    it('should reject login for pending account with proper message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: pendingUser.email, password: testPassword });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('account_pending');
      expect(res.body.message).toContain('awaiting admin approval');
    });

    it('should allow login for approved account', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: innovatorUser.email, password: testPassword });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should reject login with wrong password for approved account', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: innovatorUser.email, password: 'WrongPass123!' });
      expect(res.status).toBe(401);
    });
  });

  describe('Registration: pending status and no JWT', () => {
    it('should register with pending status and no access token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Innovator',
          email: `reg_test_${Date.now()}@test.com`,
          password: 'Strong@123',
          phone: '255712345678',
        });
      expect(res.status).toBe(201);
      expect(res.body.pending).toBe(true);
      expect(res.body.user.account_status).toBe('pending');
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.message).toContain('admin approval');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password',
          email: `weak_${Date.now()}@test.com`,
          password: '12345678',
        });
      expect(res.status).toBe(400);
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: innovatorUser.email,
          password: 'Strong@123',
        });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${innovatorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(innovatorUser.id);
      expect(res.body.email).toBe(innovatorUser.email);
      expect(res.body.role).toBe('innovator');
    });
  });
});
