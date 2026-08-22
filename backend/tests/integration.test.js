const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';

const app = require('../src/index');
const Inspection = require('../src/models/Inspection');
const User = require('../src/models/User');

describe('CARWISE Phase 4: Authentication & Inspection Ownership Integration Tests', () => {
  let userAToken, userAId;
  let userBToken, userBId;
  let inspectionAId, inspectionBId;

  const testUserA = {
    name: 'Alice Auditor',
    email: 'alice.auditor@carwise.test',
    password: 'Password123!',
  };

  const testUserB = {
    name: 'Bob Buyer',
    email: 'bob.buyer@carwise.test',
    password: 'SecurePassword456!',
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    // Clean up test users if they exist
    await User.deleteMany({ email: { $in: [testUserA.email, testUserB.email, 'duplicate@carwise.test'] } });
  });

  after(async () => {
    // Cleanup created records
    await Inspection.deleteMany({ _id: { $in: [inspectionAId, inspectionBId] } });
    await User.deleteMany({ email: { $in: [testUserA.email, testUserB.email, 'duplicate@carwise.test'] } });
    await mongoose.connection.close();
  });

  // ── 1. Health Check ─────────────────────────────────────────────────────────
  test('GET /health returns 200 with service information', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'HEALTHY');
  });

  // ── 2. User Registration Tests ──────────────────────────────────────────────
  test('POST /api/v1/auth/register creates new user account and returns JWT token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUserA);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.ok(res.body.data.user.id);
    assert.strictEqual(res.body.data.user.email, testUserA.email);
    assert.strictEqual(res.body.data.user.passwordHash, undefined, 'passwordHash must never be exposed');

    userAToken = res.body.data.token;
    userAId = res.body.data.user.id;
  });

  test('POST /api/v1/auth/register rejects duplicate email with 409', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUserA);

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'DUPLICATE_KEY');
  });

  test('POST /api/v1/auth/register rejects invalid email format with 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Invalid Email',
      email: 'not-an-email',
      password: 'ValidPassword123!',
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  });

  test('POST /api/v1/auth/register rejects password shorter than 8 characters with 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Short Pass',
      email: 'shortpass@carwise.test',
      password: 'short',
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
  });

  // ── 3. User Login & Profile Tests ───────────────────────────────────────────
  test('POST /api/v1/auth/login authenticates registered user and issues JWT', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUserA.email,
      password: testUserA.password,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, testUserA.email);
    assert.strictEqual(res.body.data.user.passwordHash, undefined);
  });

  test('POST /api/v1/auth/login rejects incorrect password with 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: testUserA.email,
      password: 'WrongPassword999!',
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('POST /api/v1/auth/login rejects non-existent email with 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'unknown.user@carwise.test',
      password: 'SomePassword123!',
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('GET /api/v1/auth/me returns authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.email, testUserA.email);
    assert.strictEqual(res.body.data.user.passwordHash, undefined);
  });

  test('GET /api/v1/auth/me rejects request without token with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('POST /api/v1/auth/logout terminates session', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  // ── 4. Unauthenticated Access Rejections ───────────────────────────────────
  test('Unauthenticated access to inspection routes is rejected with 401', async () => {
    const postRes = await request(app).post('/api/v1/inspections').send({
      make: 'Honda',
      model: 'City',
      year: 2021,
      fuelType: 'petrol',
      transmission: 'manual',
      mileageKm: 40000,
      askingPrice: 800000,
    });
    assert.strictEqual(postRes.status, 401);
    assert.strictEqual(postRes.body.error.code, 'UNAUTHORIZED');

    const getRes = await request(app).get('/api/v1/inspections');
    assert.strictEqual(getRes.status, 401);
    assert.strictEqual(getRes.body.error.code, 'UNAUTHORIZED');
  });

  // ── 5. Multi-User Inspection Ownership Setup ────────────────────────────────
  test('User A and User B create separate inspections', async () => {
    // Register User B
    const userBRes = await request(app).post('/api/v1/auth/register').send(testUserB);
    assert.strictEqual(userBRes.status, 201);
    userBToken = userBRes.body.data.token;
    userBId = userBRes.body.data.user.id;

    // User A creates Inspection A
    const resA = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        make: 'Honda',
        model: 'City',
        variant: 'ZX',
        year: 2021,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 42000,
        askingPrice: 890000,
        location: 'Bengaluru',
      });
    assert.strictEqual(resA.status, 201);
    inspectionAId = resA.body.data._id;
    assert.strictEqual(resA.body.data.userId, userAId);

    // User B creates Inspection B
    const resB = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        make: 'Hyundai',
        model: 'Creta',
        variant: 'SX',
        year: 2022,
        fuelType: 'diesel',
        transmission: 'automatic',
        mileageKm: 28000,
        askingPrice: 1350000,
        location: 'Chennai',
      });
    assert.strictEqual(resB.status, 201);
    inspectionBId = resB.body.data._id;
    assert.strictEqual(resB.body.data.userId, userBId);
  });

  // ── 6. Strict Scoping in List Endpoints ─────────────────────────────────────
  test('GET /api/v1/inspections lists ONLY the authenticated users own records', async () => {
    // User A lists inspections
    const listA = await request(app)
      .get('/api/v1/inspections')
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(listA.status, 200);
    const userAInspectionIds = listA.body.data.map((i) => i._id);
    assert.ok(userAInspectionIds.includes(inspectionAId), 'User A should see Inspection A');
    assert.ok(!userAInspectionIds.includes(inspectionBId), 'User A must NOT see Inspection B');

    // User B lists inspections
    const listB = await request(app)
      .get('/api/v1/inspections')
      .set('Authorization', `Bearer ${userBToken}`);

    assert.strictEqual(listB.status, 200);
    const userBInspectionIds = listB.body.data.map((i) => i._id);
    assert.ok(userBInspectionIds.includes(inspectionBId), 'User B should see Inspection B');
    assert.ok(!userBInspectionIds.includes(inspectionAId), 'User B must NOT see Inspection A');
  });

  // ── 7. Cross-User Access Control: 403 Forbidden Enforcement ─────────────────
  test('User A cannot view User Bs inspection (GET returns 403 FORBIDDEN)', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionBId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN');
    assert.ok(res.body.error.message.includes('permission'));
  });

  test('User A cannot update User Bs inspection (PATCH returns 403 FORBIDDEN)', async () => {
    const res = await request(app)
      .patch(`/api/v1/inspections/${inspectionBId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ mileageKm: 99999 });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN');
  });

  test('User A cannot delete User Bs inspection (DELETE returns 403 FORBIDDEN)', async () => {
    const res = await request(app)
      .delete(`/api/v1/inspections/${inspectionBId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN');
  });

  // ── 8. Authorized Actions for Verified Owner ─────────────────────────────────
  test('User B can view, update, and delete their own inspection', async () => {
    // 1. View Inspection B
    const getRes = await request(app)
      .get(`/api/v1/inspections/${inspectionBId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.data.vehicleInfo.model, 'Creta');

    // 2. Update Inspection B
    const patchRes = await request(app)
      .patch(`/api/v1/inspections/${inspectionBId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ mileageKm: 29500 });
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.body.data.vehicleInfo.mileageKm, 29500);

    // 3. Delete (Soft) Inspection B
    const deleteRes = await request(app)
      .delete(`/api/v1/inspections/${inspectionBId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    assert.strictEqual(deleteRes.status, 200);

    // 4. Verify Inspection B is now 404
    const getDeletedRes = await request(app)
      .get(`/api/v1/inspections/${inspectionBId}`)
      .set('Authorization', `Bearer ${userBToken}`);
    assert.strictEqual(getDeletedRes.status, 404);
  });
});
