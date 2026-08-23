/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Phase 7C: Damage Detection Integration Tests
 * Tests BaseDamageDetector Gateway, IQA Gating, Ownership, and MongoDB
 * ═══════════════════════════════════════════════════════════════
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads_damage';

const app = require('../src/index');
const User = require('../src/models/User');
const Inspection = require('../src/models/Inspection');

describe('CARWISE Phase 7C: Computer Vision Damage Detection Integration Tests', () => {
  let userToken, userId;
  let otherUserToken, otherUserId;
  let inspectionId, emptyInspectionId;

  // Minimal valid 1x1 JPEG byte stream for test uploads
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
      name: 'Damage Tester A',
      email: 'damage.tester.a@carwise.test',
      password: 'SecurePassword123!',
    });
    userToken = resA.body.data?.token;
    userId = resA.body.data?.user?.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Damage Tester B',
      email: 'damage.tester.b@carwise.test',
      password: 'SecurePassword123!',
    });
    otherUserToken = resB.body.data?.token;
    otherUserId = resB.body.data?.user?.id;

    // Create Inspection for User A with Images
    const inspRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Maruti Suzuki',
        model: 'Swift',
        year: 2021,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 32000,
        askingPrice: 580000,
      });
    inspectionId = inspRes.body.data._id;

    // Create Empty Inspection for User A
    const emptyRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Hyundai',
        model: 'i20',
        year: 2022,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 18000,
        askingPrice: 750000,
      });
    emptyInspectionId = emptyRes.body.data._id;

    // Upload FRONT and REAR images to inspectionId
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
  });

  after(async () => {
    await User.deleteMany({ email: /damage\.tester/ });
    if (inspectionId) await Inspection.findByIdAndDelete(inspectionId);
    if (emptyInspectionId) await Inspection.findByIdAndDelete(emptyInspectionId);
  });

  test('POST /api/v1/inspections/:id/damage/detect rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/v1/inspections/${inspectionId}/damage/detect`);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error?.code || res.body.code, 'UNAUTHORIZED');
  });

  test('POST /api/v1/inspections/:id/damage/detect rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/damage/detect`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error?.code || res.body.code, 'FORBIDDEN');
  });

  test('POST /api/v1/inspections/:id/damage/detect rejects empty inspection with 400 NO_IMAGES', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${emptyInspectionId}/damage/detect`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.code, 'NO_IMAGES');
  });

  test('POST /api/v1/inspections/:id/damage/detect successfully evaluates images and updates MongoDB', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/damage/detect`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.data.totalImagesAnalyzed, 2);
    assert.strictEqual(res.body.data.results.length, 2);

    for (const result of res.body.data.results) {
      assert.ok(['COMPLETE', 'NO_DAMAGE_DETECTED', 'BLOCKED_BY_IQA'].includes(result.status));
      assert.ok(result.viewType);
      assert.ok(Array.isArray(result.detections));

      for (const det of result.detections) {
        assert.ok(['scratch', 'dent', 'crack', 'glass_shatter', 'lamp_broken', 'tire_flat'].includes(det.className));
        assert.ok(det.confidence >= 0.40);
        assert.ok(['HIGH_CONFIDENCE', 'POTENTIAL'].includes(det.confidenceBand));
        assert.ok(det.bbox.xMin >= 0.0 && det.bbox.xMax <= 1.0);
      }
    }

    // Verify MongoDB persistence
    const updated = await Inspection.findById(inspectionId);
    assert.strictEqual(updated.damageDetections.length, 2);
  });

  test('GET /api/v1/inspections/:id/damage returns persisted damage findings', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/damage`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.data.damageDetections.length, 2);
  });
});
