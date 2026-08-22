const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads';

const app = require('../src/index');
const Inspection = require('../src/models/Inspection');
const User = require('../src/models/User');
const storageProvider = require('../src/storage');

describe('CARWISE Phase 5: Image Ingestion & Storage Pipeline Integration Tests', () => {
  let userAToken, userAId;
  let userBToken, userBId;
  let inspectionAId, inspectionBId;
  let uploadedFrontImageId, uploadedRearImageId;

  // Binary test fixtures
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x64, 0x00, 0x64, 0x03, 0x01, 0x11,
    0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ]);

  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);

  const validWebPBuffer = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c,
    0x0e, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00, 0x00, 0x07, 0x00, 0x00, 0xfe, 0xff,
  ]);

  const invalidFakeBuffer = Buffer.from('<script>alert("malicious script")</script>');

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'Image Tester A',
      email: 'image.tester.a@carwise.test',
      password: 'SecurePassword123!',
    });
    userAToken = resA.body.data?.token;
    userAId = resA.body.data?.user?.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Image Tester B',
      email: 'image.tester.b@carwise.test',
      password: 'SecurePassword123!',
    });
    userBToken = resB.body.data?.token;
    userBId = resB.body.data?.user?.id;

    // User A creates Inspection A
    const inspARes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        make: 'Honda',
        model: 'City',
        year: 2021,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 35000,
        askingPrice: 850000,
      });
    inspectionAId = inspARes.body.data._id;

    // User B creates Inspection B
    const inspBRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        make: 'Hyundai',
        model: 'Creta',
        year: 2022,
        fuelType: 'diesel',
        transmission: 'automatic',
        mileageKm: 25000,
        askingPrice: 1250000,
      });
    inspectionBId = inspBRes.body.data._id;
  });

  after(async () => {
    await Inspection.deleteMany({ _id: { $in: [inspectionAId, inspectionBId] } });
    await User.deleteMany({ _id: { $in: [userAId, userBId] } });
    await mongoose.connection.close();
  });

  // ── 1. Unauthenticated / Unauthorized Uploads ──────────────────────────────
  test('POST /api/v1/inspections/:id/images rejects unauthenticated upload with 401', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .attach('image', validJpegBuffer, 'front.jpg')
      .field('viewType', 'FRONT');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error.code, 'UNAUTHORIZED');
  });

  test('POST /api/v1/inspections/:id/images rejects cross-user upload with 403 FORBIDDEN', async () => {
    // User A attempts to upload to User B's inspection
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionBId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', validJpegBuffer, 'front.jpg')
      .field('viewType', 'FRONT');

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN');
  });

  // ── 2. View Type Validation ────────────────────────────────────────────────
  test('POST /api/v1/inspections/:id/images rejects arbitrary viewType with 400', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', validJpegBuffer, 'random.jpg')
      .field('viewType', 'ARBITRARY_ANGLE_FLYING');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'INVALID_VIEW_TYPE');
  });

  // ── 3. Magic Byte & File Type Validation ───────────────────────────────────
  test('POST /api/v1/inspections/:id/images rejects spoofed file with 400', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', invalidFakeBuffer, 'fake.jpg')
      .field('viewType', 'FRONT');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error.code, 'INVALID_FILE_TYPE');
  });

  // ── 4. Valid Formats Upload (JPEG, PNG, WebP) ──────────────────────────────
  test('Uploads valid FRONT JPEG image successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', validJpegBuffer, 'front.jpg')
      .field('viewType', 'FRONT');

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.image.imageId);
    assert.strictEqual(res.body.data.image.viewType, 'FRONT');
    assert.strictEqual(res.body.data.image.mimeType, 'image/jpeg');
    assert.strictEqual(res.body.data.image.processingStatus, 'UPLOADED');
    assert.strictEqual(res.body.data.image.qualityStatus, 'PENDING');
    assert.strictEqual(res.body.data.completeness.mandatoryCount, 1);
    assert.strictEqual(res.body.data.completeness.complete, false);

    uploadedFrontImageId = res.body.data.image.imageId;
  });

  test('Uploads valid REAR PNG image successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', validPngBuffer, 'rear.png')
      .field('viewType', 'REAR');

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.image.viewType, 'REAR');
    assert.strictEqual(res.body.data.image.mimeType, 'image/png');
    assert.strictEqual(res.body.data.completeness.mandatoryCount, 2);

    uploadedRearImageId = res.body.data.image.imageId;
  });

  test('Uploads valid LEFT WebP image successfully', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', validWebPBuffer, 'left.webp')
      .field('viewType', 'left'); // Lowercase normalized to LEFT

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.image.viewType, 'LEFT');
    assert.strictEqual(res.body.data.image.mimeType, 'image/webp');
  });

  test('Uploads valid RIGHT image to achieve full mandatory completeness', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', validJpegBuffer, 'right.jpg')
      .field('viewType', 'RIGHT');

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.completeness.mandatoryComplete, true);
    assert.strictEqual(res.body.data.completeness.complete, true);
    assert.strictEqual(res.body.data.completeness.missingMandatoryViews.length, 0);
  });

  // ── 5. Completeness Calculation Endpoint ───────────────────────────────────
  test('GET /api/v1/inspections/:id/completeness returns accurate completeness', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionAId}/completeness`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.complete, true);
    assert.strictEqual(res.body.data.mandatoryCount, 4);
  });

  // ── 6. Authenticated Image Streaming & Authorization ───────────────────────
  test('GET /api/v1/inspections/:id/images/:imageId serves image stream to owner', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionAId}/images/${uploadedFrontImageId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['content-type'], 'image/jpeg');
    assert.ok(res.body.length > 0);
  });

  test('GET /api/v1/inspections/:id/images/:imageId rejects non-owner with 403', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionAId}/images/${uploadedFrontImageId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN');
  });

  // ── 7. Image Replacement Flow (No Orphaned Files) ──────────────────────────
  test('Re-uploading FRONT image replaces existing image and deletes old storage file', async () => {
    // Fetch old storage key
    const docBefore = await Inspection.findById(inspectionAId);
    const oldFrontImage = docBefore.images.find((i) => i.viewType === 'FRONT');
    assert.ok(oldFrontImage);
    const oldStorageKey = oldFrontImage.storageKey;

    // Upload new FRONT image (PNG replacing JPEG)
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionAId}/images`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('image', validPngBuffer, 'new_front.png')
      .field('viewType', 'FRONT');

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.image.mimeType, 'image/png');
    assert.notStrictEqual(res.body.data.image.imageId, oldFrontImage.imageId);

    // Verify old file was deleted from storage provider
    const oldExists = await storageProvider.exists(oldStorageKey);
    assert.strictEqual(oldExists, false, 'Replaced image file should be cleaned up from storage');
  });

  // ── 8. Image Deletion Flow ─────────────────────────────────────────────────
  test('DELETE /api/v1/inspections/:id/images/:imageId removes image from DB and storage', async () => {
    const docBefore = await Inspection.findById(inspectionAId);
    const rearImage = docBefore.images.find((i) => i.viewType === 'REAR');
    assert.ok(rearImage);

    const res = await request(app)
      .delete(`/api/v1/inspections/${inspectionAId}/images/${rearImage.imageId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.completeness.complete, false, 'Completeness should now be false missing REAR');

    // Verify removed from storage
    const fileExists = await storageProvider.exists(rearImage.storageKey);
    assert.strictEqual(fileExists, false);
  });
});
