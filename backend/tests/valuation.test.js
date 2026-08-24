/**
 * ═══════════════════════════════════════════════════════════════
 * CARWISE — Phase 11: Vehicle Valuation Integration Tests
 * Validates valuation endpoints, asking-price comparison, & security
 * ═══════════════════════════════════════════════════════════════
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carwise_db';
process.env.JWT_SECRET = 'test-secret-carwise-key-2026';
process.env.UPLOAD_DIR = './test_uploads_valuation';

const app = require('../src/index');
const User = require('../src/models/User');
const Inspection = require('../src/models/Inspection');

describe('CARWISE Phase 11: Vehicle Valuation Integration Tests', () => {
  let userToken, userId;
  let otherUserToken, otherUserId;
  let inspectionId, lowTrustInspectionId;

  const validSharpJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x00, 0x04, 0x00, 0x03, 0x01, 0x11,
    0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ]);

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    await User.deleteMany({ email: /valuation\.tester/ });

    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'Valuation Tester A',
      email: 'valuation.tester.a@carwise.test',
      password: 'SecurePassword123!',
    });
    userToken = resA.body.data?.token;
    userId = resA.body.data?.user?.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Valuation Tester B',
      email: 'valuation.tester.b@carwise.test',
      password: 'SecurePassword123!',
    });
    otherUserToken = resB.body.data?.token;
    otherUserId = resB.body.data?.user?.id;

    // Create Primary Complete Inspection for User A (Hyundai Creta)
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
        askingPrice: 820000,
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

    // Run upstream pipelines
    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/damage/detect`)
      .set('Authorization', `Bearer ${userToken}`);

    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/evidence/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/trust/analyze`)
      .set('Authorization', `Bearer ${userToken}`);

    await request(app)
      .post(`/api/v1/inspections/${inspectionId}/repair/estimate`)
      .set('Authorization', `Bearer ${userToken}`);

    // Create Low Trust / Empty Inspection for User A
    const lowTrustRes = await request(app)
      .post('/api/v1/inspections')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        make: 'Maruti',
        model: 'Swift',
        year: 2023,
        fuelType: 'petrol',
        transmission: 'manual',
        mileageKm: 20000,
        askingPrice: 650000,
      });
    lowTrustInspectionId = lowTrustRes.body.data._id;
  });

  after(async () => {
    await User.deleteMany({ email: /valuation\.tester/ });
    if (inspectionId) await Inspection.findByIdAndDelete(inspectionId);
    if (lowTrustInspectionId) await Inspection.findByIdAndDelete(lowTrustInspectionId);
  });

  test('POST /api/v1/inspections/:id/valuation/evaluate rejects unauthenticated request with 401', async () => {
    const res = await request(app).post(`/api/v1/inspections/${inspectionId}/valuation/evaluate`);
    assert.strictEqual(res.status, 401);
  });

  test('POST /api/v1/inspections/:id/valuation/evaluate rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/valuation/evaluate`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/valuation/evaluate evaluates fair-market range and updates MongoDB', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${inspectionId}/valuation/evaluate`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.priceValuation);

    const val = res.body.data.priceValuation;
    assert.strictEqual(val.version, 'VALUATION_V1');
    assert.strictEqual(val.currency, 'INR');
    assert.ok(val.fairMarketValueRange.min > 0);
    assert.ok(val.fairMarketValueRange.max >= val.fairMarketValueRange.min);
    assert.ok(val.fairMarketValueRange.midpoint > 0);
    assert.ok(['FAIRLY_PRICED', 'BELOW_FAIR_RANGE', 'ABOVE_FAIR_RANGE'].includes(val.status));

    // Verify DB update
    const updated = await Inspection.findById(inspectionId);
    assert.ok(updated.priceValuation);
    assert.strictEqual(updated.priceValuation.version, 'VALUATION_V1');
    assert.strictEqual(updated.priceValuation.fairMarketValueRange.midpoint, val.fairMarketValueRange.midpoint);
  });

  test('GET /api/v1/inspections/:id/valuation returns persisted valuation assessment', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/valuation`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'success');
    assert.ok(res.body.data.priceValuation);
    assert.strictEqual(res.body.data.priceValuation.version, 'VALUATION_V1');
  });

  test('GET /api/v1/inspections/:id/valuation rejects unauthenticated request with 401', async () => {
    const res = await request(app).get(`/api/v1/inspections/${inspectionId}/valuation`);
    assert.strictEqual(res.status, 401);
  });

  test('GET /api/v1/inspections/:id/valuation rejects cross-user access with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get(`/api/v1/inspections/${inspectionId}/valuation`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/inspections/:id/valuation/evaluate handles empty/low trust with INSUFFICIENT_EVIDENCE', async () => {
    const res = await request(app)
      .post(`/api/v1/inspections/${lowTrustInspectionId}/valuation/evaluate`)
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 200);
    const val = res.body.data.priceValuation;
    assert.strictEqual(val.status, 'INSUFFICIENT_EVIDENCE');
    assert.strictEqual(val.fairMarketValueRange.min, null);
    assert.strictEqual(val.fairMarketValueRange.midpoint, null);
    assert.strictEqual(val.valuationConfidence, 'LOW');
  });
});
