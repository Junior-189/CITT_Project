const request = require('supertest');

describe('Auth API', () => {
  const testEmail = `auth_test_${Date.now()}@test.com`;
  const testPassword = 'Test@1234';

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'test%@test.com'");
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Auth Test User',
          email: testEmail,
          password: testPassword,
          phone: '255712345678',
        });

      expect(res.status).toBe(201);
      expect(res.body.pending).toBe(true);
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe('innovator');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email',
          email: 'not-an-email',
          password: testPassword,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Pass',
          email: `weak_${Date.now()}@test.com`,
          password: '12345678',
        });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    let approvedUser;

    beforeAll(async () => {
      approvedUser = await createTestUser({
        email: `login_approved_${Date.now()}@test.com`,
        password: testPassword,
        role: 'innovator',
        account_status: 'approved',
      });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: approvedUser.email,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.id).toBe(approvedUser.id);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: approvedUser.email,
          password: 'WrongPass123!',
        });

      expect(res.status).toBe(401);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noone@test.com',
          password: testPassword,
        });

      expect(res.status).toBe(401);
    });

    it('should reject login for pending accounts', async () => {
      const pendingUser = await createTestUser({
        email: `pending_${Date.now()}@test.com`,
        account_status: 'pending',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: pendingUser.email,
          password: testPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('account_pending');
    });
  });

  describe('GET /api/auth/me', () => {
    let user, token;

    beforeAll(async () => {
      user = await createTestUser({
        email: `me_${Date.now()}@test.com`,
        account_status: 'approved',
      });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: testPassword });
      token = loginRes.body.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(user.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'someone@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('If an account');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'bad-email' });

      expect(res.status).toBe(400);
    });
  });
});
