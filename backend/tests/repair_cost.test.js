/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Phase 10: Repair Cost Estimation Integration Tests
 * Validates endpoints, multipliers, persistence, and security
 * ═══════════════════════════════════════════════════════════════
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads_repair';

const app = require('../src/index');
const User = require('../src/models/User');
const Inspection = require('../src/models/Inspection');

describe('CARWISE Phase 10: Repair Cost Estimation Integration Tests', () => {
  let userToken, userId;
  let otherUserToken, otherUserId;
  let inspectionId, cleanInspectionId;

  const validSharpJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x00, 0x04, 0x00, 0x03, 0x01, 0x11,
    0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ]);

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    await User.deleteMany({ email: /repair\.tester/ });

    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'Repair Tester A',
      email: 'repair.tester.a@carwise.test',
      password: 'SecurePassword123!',
    });
    userToken = resA.body.data?.token;
    userId = resA.body.data?.user?.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Repair Tester B',
      email: 'repair.tester.b@carwise.test',
      password: 'SecurePassword123!',
    });
    otherUserToken = resB.body.data?.token;
    otherUserId = resB.body.data?.user?.id;

    // Create Damaged Inspection for User A
    const inspRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        fuelType: 'diesel',
        transmission: 'automatic',
        mileageKm: 34000,
        askingPrice: 1420000,
      });
    inspectionId = inspRes.body.data._id;

    // Create Clean Inspection for User A
    const cleanRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Maruti',
        model: 'Swift',
        year: 2024,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 5000,
        askingPrice: 700000,
      });
    cleanInspectionId = cleanRes.body.data._id;

    // Upload 4 views to damaged inspection
    const views = ['FRONT', 'REAR', 'LEFT', 'RIGHT'];
    for (const v of views) {
      await request(app)
        .post(`/api/v1/inspections/${inspectionId}/images`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', validSharpJpeg, `${v.toLowerCase()}.jpg`)
        .field('viewType', v);
    }

    // Run damage detection & evidence reasoning to populate upstream findings
    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/damage/detect`)
      .set('Authorization', `Bearer ${userToken}`);

    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/evidence/analyze`)
      .set('Authorization', `Bearer ${userToken}`);
  });

  after(async () => {
    await User.deleteMany({ email: /repair\.tester/ });
    if (inspectionId) await Inspection.findByIdAndDelete(inspectionId);
    if (cleanInspectionId) await Inspection.findByIdAndDelete(cleanInspectionId);
  });

  test('POST /api/v1/inspections/:id/repair/estimate rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/v1/inspections/${inspectionId}/repair/estimate`);
    assert.strictEqual(res.status, 401);
  });

  test('POST /api/v1/inspections/:id/repair/estimate rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/repair/estimate`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/repair/estimate computes repair ranges and updates MongoDB', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/repair/estimate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ regionTier: 'TIER_1_METRO' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.repairCostAssessment);

    const rep = res.body.data.repairCostAssessment;
    assert.strictEqual(rep.version, 'REPAIR_V1');
    assert.strictEqual(rep.currency, 'INR');
    assert.strictEqual(rep.regionTier, 'TIER_1_METRO');
    assert.ok(rep.totalEstimatedRange.min >= 0);
    assert.ok(rep.totalEstimatedRange.max >= rep.totalEstimatedRange.min);

    // Verify DB update
    const updated = await Inspection.findById(inspectionId);
    assert.ok(updated.repairCostAssessment);
    assert.strictEqual(updated.repairCostAssessment.version, 'REPAIR_V1');
    assert.strictEqual(updated.repairCostAssessment.totalEstimatedRange.min, rep.totalEstimatedRange.min);
  });

  test('GET /api/v1/inspections/:id/repair returns persisted repair cost assessment', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/repair`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.repairCostAssessment);
    assert.strictEqual(res.body.data.repairCostAssessment.version, 'REPAIR_V1');
  });

  test('GET /api/v1/inspections/:id/repair rejects unauthenticated request with 401', async () => {
    const res = await request(app).get(`/api/v1/inspections/${inspectionId}/repair`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/inspections/:id/repair rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/repair`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/repair/estimate supports Tier 3 Rural factor', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/repair/estimate`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ regionTier: 'TIER_3_RURAL' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.repairCostAssessment.regionTier, 'TIER_3_RURAL');
    assert.strictEqual(res.body.data.repairCostAssessment.multipliersApplied.regionFactor, 0.85);
  });

  test('POST /api/v1/inspections/:id/repair/estimate handles clean vehicle with zero repair cost', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${cleanInspectionId}/repair/estimate`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    const rep = res.body.data.repairCostAssessment;
    assert.strictEqual(rep.status, 'NO_DAMAGE_DETECTED');
    assert.strictEqual(rep.totalEstimatedRange.min, 0);
    assert.strictEqual(rep.totalEstimatedRange.max, 0);
    assert.strictEqual(rep.totalEstimatedRange.median, 0);
  });
});
