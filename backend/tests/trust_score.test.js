/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Phase 9: Buyer Assessment Trust Integration Tests
 * Tests Evidence Completeness, Reliability, Trust Scoring, Gating Caps, & Persistence
 * ═══════════════════════════════════════════════════════════════
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads_trust';

const app = require('../src/index');
const User = require('../src/models/User');
const Inspection = require('../src/models/Inspection');

describe('CARWISE Phase 9: Buyer Assessment Trust Integration Tests', () => {
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

    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'Trust Tester A',
      email: 'trust.tester.a@carwise.test',
      password: 'SecurePassword123!',
    });
    userToken = resA.body.data?.token;
    userId = resA.body.data?.user?.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Trust Tester B',
      email: 'trust.tester.b@carwise.test',
      password: 'SecurePassword123!',
    });
    otherUserToken = resB.body.data?.token;
    otherUserId = resB.body.data?.user?.id;

    // Create Complete Inspection for User A
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

    // Create Empty Inspection for User A
    const emptyRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Maruti',
        model: 'Swift',
        year: 2021,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 42000,
        askingPrice: 610000,
      });
    emptyInspectionId = emptyRes.body.data._id;

    // Upload 4 Mandatory Images
    const views = ['FRONT', 'REAR', 'LEFT', 'RIGHT'];
    for (const v of views) {
      await request(app)
        .post(`/api/v1/inspections/${inspectionId}/images`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('image', validSharpJpeg, `${v.toLowerCase()}.jpg`)
        .field('viewType', v);
    }

    // Run damage detection and evidence reasoning to populate upstream data
    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/damage/detect`)
      .set('Authorization', `Bearer ${userToken}`);

    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/evidence/analyze`)
      .set('Authorization', `Bearer ${userToken}`);
  });

  after(async () => {
    await User.deleteMany({ email: /trust\.tester/ });
    if (inspectionId) await Inspection.findByIdAndDelete(inspectionId);
    if (emptyInspectionId) await Inspection.findByIdAndDelete(emptyInspectionId);
  });

  test('POST /api/v1/inspections/:id/trust/analyze rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/v1/inspections/${inspectionId}/trust/analyze`);
    assert.strictEqual(res.status, 401);
  });

  test('POST /api/v1/inspections/:id/trust/analyze rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/trust/analyze`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/trust/analyze evaluates trust score and updates MongoDB', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/trust/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.assessmentTrust);

    const trust = res.body.data.assessmentTrust;
    assert.strictEqual(trust.version, 'TRUST_V1');
    assert.ok(trust.trustScore.trustScore >= 0 && trust.trustScore.trustScore <= 100);
    assert.ok(['HIGH_CONFIDENCE', 'MODERATE_CONFIDENCE', 'PROCEED_WITH_CAUTION', 'INSUFFICIENT_EVIDENCE'].includes(trust.trustScore.trustBand));
    assert.strictEqual(trust.evidenceCompleteness.mandatoryViewsComplete, true);
    assert.strictEqual(trust.evidenceCompleteness.usableImageCount, 4);

    // Verify DB update
    const updated = await Inspection.findById(inspectionId);
    assert.ok(updated.evidenceAssessment.trustScore);
    assert.strictEqual(updated.evidenceAssessment.trustScore.formulaVersion, 'TRUST_V1');
    assert.strictEqual(updated.trustScore.overallTrustScore, trust.trustScore.trustScore);
  });

  test('GET /api/v1/inspections/:id/trust returns persisted trust assessment', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/trust`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.trustScore);
    assert.strictEqual(res.body.data.trustScore.formulaVersion, 'TRUST_V1');
  });

  test('GET /api/v1/inspections/:id/trust rejects unauthenticated request with 401', async () => {
    const res = await request(app).get(`/api/v1/inspections/${inspectionId}/trust`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/inspections/:id/trust rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/trust`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/trust/analyze handles empty inspection with INSUFFICIENT_EVIDENCE', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${emptyInspectionId}/trust/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.data.assessmentTrust.trustScore.trustScore, null);
    assert.strictEqual(res.body.data.assessmentTrust.trustScore.trustBand, 'INSUFFICIENT_EVIDENCE');
    assert.strictEqual(res.body.data.assessmentTrust.assessmentStatus, 'INSUFFICIENT_EVIDENCE');
  });
});
