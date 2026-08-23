const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads_iqa';

const app = require('../src/index');
const Inspection = require('../src/models/Inspection');
const User = require('../src/models/User');

describe('CARWISE Phase 6: Image Quality Assessment (IQA) Integration Tests', () => {
  let userToken, userId;
  let otherUserToken, otherUserId;
  let inspectionId, emptyInspectionId;

  // Binary test fixtures
  const validSharpJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x00, 0x04, 0x00, 0x03, 0x01, 0x11,
    0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ]);

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Register User
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'IQA Tester',
      email: 'iqa.tester@carwise.test',
      password: 'SecurePassword123!',
    });
    userToken = resA.body.data?.token;
    userId = resA.body.data?.user?.id;

    // Register Other User
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Other User',
      email: 'other.user@carwise.test',
      password: 'SecurePassword123!',
    });
    otherUserToken = resB.body.data?.token;
    otherUserId = resB.body.data?.user?.id;

    // Create Inspection with Images
    const inspRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Maruti Suzuki',
        model: 'Baleno',
        year: 2022,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 28000,
        askingPrice: 720000,
      });
    inspectionId = inspRes.body.data._id;

    // Create Empty Inspection
    const emptyRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Tata',
        model: 'Nexon',
        year: 2023,
        fuelType: 'diesel',
        transmission: 'manual',
        mileageKm: 15000,
        askingPrice: 950000,
      });
    emptyInspectionId = emptyRes.body.data._id;

    // Upload Front and Rear images to inspectionId
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
    await Inspection.deleteMany({ _id: { $in: [inspectionId, emptyInspectionId] } });
    await User.deleteMany({ _id: { $in: [userId, otherUserId] } });
    await mongoose.connection.close();
  });

  test('POST /api/v1/inspections/:id/iqa rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/v1/inspections/${inspectionId}/iqa`);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('POST /api/v1/inspections/:id/iqa rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/iqa`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN');
  });

  test('POST /api/v1/inspections/:id/iqa rejects empty inspection with 400 NO_IMAGES', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${emptyInspectionId}/iqa`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'NO_IMAGES');
  });

  test('POST /api/v1/inspections/:id/iqa successfully evaluates images and updates MongoDB', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/iqa`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.totalEvaluated, 2);
    assert.ok(res.body.data.summary);
    assert.strictEqual(typeof res.body.data.allReadyForCV, 'boolean');

    // Verify MongoDB persistence
    const updatedInspection = await Inspection.findById(inspectionId);
    assert.strictEqual(updatedInspection.images.length, 2);

    for (const img of updatedInspection.images) {
      assert.notStrictEqual(img.qualityStatus, 'PENDING');
      assert.ok(['PASS', 'WARN', 'FAIL'].includes(img.qualityStatus));
      assert.strictEqual(typeof img.qualityScore, 'number');
      assert.strictEqual(img.processingStatus, 'PROCESSED');
      assert.ok(img.qualityMetrics);
    }
  });

  test('GET /api/v1/inspections/:id/iqa returns evaluated quality diagnostics', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/iqa`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.isEvaluated, true);
    assert.strictEqual(res.body.data.totalImages, 2);
    assert.ok(res.body.data.summary);
  });
});
