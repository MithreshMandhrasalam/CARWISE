/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Phase 8: Evidence Reasoning Integration Tests
 * Tests Evidence Normalization, Zone Mapping, Severity, Condition Score, & Persistence
 * ═══════════════════════════════════════════════════════════════
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads_evidence';

const app = require('../src/index');
const User = require('../src/models/User');
const Inspection = require('../src/models/Inspection');

describe('CARWISE Phase 8: Evidence Reasoning & Deterministic Assessment Integration Tests', () => {
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
      name: 'Evidence Tester A',
      email: 'evidence.tester.a@carwise.test',
      password: 'SecurePassword123!',
    });
    userToken = resA.body.data?.token;
    userId = resA.body.data?.user?.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Evidence Tester B',
      email: 'evidence.tester.b@carwise.test',
      password: 'SecurePassword123!',
    });
    otherUserToken = resB.body.data?.token;
    otherUserId = resB.body.data?.user?.id;

    // Create Inspection for User A
    const inspRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Tata',
        model: 'Nexon',
        year: 2023,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 22000,
        askingPrice: 890000,
      });
    inspectionId = inspRes.body.data._id;

    // Create Empty Inspection for User A
    const emptyRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Mahindra',
        model: 'Scorpio-N',
        year: 2023,
        fuelType: 'diesel',
        transmission: 'automatic',
        mileageKm: 14000,
        askingPrice: 1650000,
      });
    emptyInspectionId = emptyRes.body.data._id;

    // Upload FRONT and REAR images
    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/images`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('image', validSharpJpeg, 'front.jpg')
      .field('viewType', 'FRONT');

    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/images`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('image', validSharpJpeg, 'rear.jpg')
      .field('viewType', 'REAR');

    // Run Damage Detection first to populate damageDetections
    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/damage/detect`)
      .set('Authorization', `Bearer ${userToken}`);
  });

  after(async () => {
    await User.deleteMany({ email: /evidence\.tester/ });
    if (inspectionId) await Inspection.findByIdAndDelete(inspectionId);
    if (emptyInspectionId) await Inspection.findByIdAndDelete(emptyInspectionId);
  });

  test('POST /api/v1/inspections/:id/evidence/analyze rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/v1/inspections/${inspectionId}/evidence/analyze`);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error?.code || res.body.code, 'UNAUTHORIZED');
  });

  test('POST /api/v1/inspections/:id/evidence/analyze rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/evidence/analyze`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error?.code || res.body.code, 'FORBIDDEN');
  });

  test('POST /api/v1/inspections/:id/evidence/analyze evaluates evidence and updates MongoDB', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/evidence/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.evidenceAssessment);

    const assessment = res.body.data.evidenceAssessment;
    assert.strictEqual(assessment.version, 'EVIDENCE_V1');
    assert.ok(assessment.conditionScore.score >= 0 && assessment.conditionScore.score <= 100);
    assert.strictEqual(assessment.conditionScore.baseScore, 100);
    assert.ok(Array.isArray(assessment.findings));
    assert.ok(Array.isArray(assessment.zones));
    assert.strictEqual(assessment.trustScore.status, 'PENDING_TRUST_MODEL');

    // Verify DB update
    const updated = await Inspection.findById(inspectionId);
    assert.ok(updated.evidenceAssessment);
    assert.strictEqual(updated.evidenceAssessment.version, 'EVIDENCE_V1');
    assert.strictEqual(updated.conditionScore.overallScore, assessment.conditionScore.score);
  });

  test('GET /api/v1/inspections/:id/evidence returns persisted evidence report', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/evidence`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.evidenceAssessment);
    assert.strictEqual(res.body.data.evidenceAssessment.version, 'EVIDENCE_V1');
  });

  test('GET /api/v1/inspections/:id/evidence rejects unauthenticated request with 401', async () => {
    const res = await request(app).get(`/api/v1/inspections/${inspectionId}/evidence`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/inspections/:id/evidence rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/evidence`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/evidence/analyze handles empty inspection without crashing', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${emptyInspectionId}/evidence/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.data.evidenceAssessment.totalEvidenceCount, 0);
    assert.strictEqual(res.body.data.evidenceAssessment.conditionScore.score, 100);
  });
});
