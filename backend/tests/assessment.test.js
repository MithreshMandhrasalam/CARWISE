/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Phase 12: Assessment Orchestration Integration Tests
 * Validates end-to-end analysis, security, consistency, & persistence
 * ═══════════════════════════════════════════════════════════════
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads_assessment';

const app = require('../src/index');
const User = require('../src/models/User');
const Inspection = require('../src/models/Inspection');

describe('CARWISE Phase 12: End-to-End Assessment Orchestration Tests', () => {
  let userToken, userId;
  let otherUserToken, otherUserId;
  let inspectionId, emptyInspectionId;

  const validSharpJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x00, 0x04, 0x00, 0x03, 0x01, 0x11,
    0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ]);

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    await User.deleteMany({ email: /assessment\.tester/ });

    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'Assessment Tester A',
      email: 'assessment.tester.a@carwise.test',
      password: 'SecurePassword123!',
    });
    userToken = resA.body.data?.token;
    userId = resA.body.data?.user?.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Assessment Tester B',
      email: 'assessment.tester.b@carwise.test',
      password: 'SecurePassword123!',
    });
    otherUserToken = resB.body.data?.token;
    otherUserId = resB.body.data?.user?.id;

    // Create Primary Complete Inspection for User A
    const inspRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Hyundai',
        model: 'Creta',
        year: 2023,
        fuelType: 'diesel',
        transmission: 'automatic',
        mileageKm: 28000,
        askingPrice: 1180000,
      });
    inspectionId = inspRes.body.data._id;

    // Upload 4 views to primary inspection
    const views = ['FRONT', 'REAR', 'LEFT', 'RIGHT'];
    for (const v of views) {
      await request(app)
        .post(`/api/v1/inspections/${inspectionId}/images`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', validSharpJpeg, `${v.toLowerCase()}.jpg`)
        .field('viewType', v);
    }

    // Create Empty Inspection for User A
    const emptyRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Tata',
        model: 'Nexon',
        year: 2022,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 35000,
        askingPrice: 780000,
      });
    emptyInspectionId = emptyRes.body.data._id;
  });

  after(async () => {
    await User.deleteMany({ email: /assessment\.tester/ });
    if (inspectionId) await Inspection.findByIdAndDelete(inspectionId);
    if (emptyInspectionId) await Inspection.findByIdAndDelete(emptyInspectionId);
  });

  test('POST /api/v1/inspections/:id/analyze rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/v1/inspections/${inspectionId}/analyze`);
    assert.strictEqual(res.status, 401);
  });

  test('POST /api/v1/inspections/:id/analyze rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/analyze`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/analyze executes complete orchestration and updates MongoDB', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/analyze`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ regionTier: 'METRO_TIER_1' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.assessment);

    const ass = res.body.data.assessment;
    assert.strictEqual(ass.assessmentVersion, 'CARWISE_ASSESSMENT_V1');
    assert.ok(['COMPLETED', 'LIMITED_ASSESSMENT'].includes(ass.overallStatus));
    assert.ok(ass.timings);
    assert.ok(ass.executiveVerdict);

    // Verify MongoDB persistence
    const updated = await Inspection.findById(inspectionId);
    assert.ok(updated.finalAssessment);
    assert.strictEqual(updated.finalAssessment.assessmentVersion, 'CARWISE_ASSESSMENT_V1');
    assert.ok(updated.repairCostAssessment);
    assert.ok(updated.priceValuation);
  });

  test('GET /api/v1/inspections/:id/assessment returns consolidated buyer assessment', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/assessment`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.assessment);
    assert.strictEqual(res.body.data.assessment.assessmentVersion, 'CARWISE_ASSESSMENT_V1');
  });

  test('GET /api/v1/inspections/:id/assessment rejects unauthenticated request with 401', async () => {
    const res = await request(app).get(`/api/v1/inspections/${inspectionId}/assessment`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/inspections/:id/assessment rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/assessment`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/analyze handles empty inspection with INSUFFICIENT_EVIDENCE', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${emptyInspectionId}/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.assessment.overallStatus, 'INSUFFICIENT_EVIDENCE');
  });

  test('POST /api/v1/inspections/:id/analyze is idempotent and preserves consistency', async () => {
    const res1 = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/analyze`)
      .set('Authorization', `Bearer ${userToken}`);
    const res2 = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res1.body.data.assessment.overallStatus, res2.body.data.assessment.overallStatus);
  });
});
