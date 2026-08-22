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

describe('CARWISE Phase 3 Backend & MongoDB Integration Tests', () => {
  let createdInspectionId;
  let testUserId;

  before(async () => {
    // Wait for Mongoose connection if needed
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  after(async () => {
    // Cleanup created test records
    if (createdInspectionId) {
      await Inspection.deleteOne({ _id: createdInspectionId });
    }
    if (testUserId) {
      await User.deleteOne({ _id: testUserId });
    }
    await mongoose.connection.close();
  });

  // ── 1. Health Check Endpoint ────────────────────────────────────────────────
  test('GET /health returns 200 with service information', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'HEALTHY');
    assert.strictEqual(res.body.data.service, 'CARWISE API Gateway');
  });

  // ── 2. Create Inspection (Valid) ───────────────────────────────────────────
  test('POST /api/v1/inspections creates new pending inspection', async () => {
    const payload = {
      make: 'Honda',
      model: 'City',
      variant: 'ZX 1.5 i-VTEC',
      year: 2021,
      fuelType: 'petrol',
      transmission: 'manual',
      mileageKm: 42500,
      askingPrice: 890000,
      location: 'Bengaluru, Karnataka',
      registrationNumber: 'KA01MJ4921',
    };

    const res = await request(app).post('/api/v1/inspections').send(payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data._id);
    assert.strictEqual(res.body.data.status, 'PENDING');
    assert.strictEqual(res.body.data.vehicleInfo.make, 'Honda');
    assert.strictEqual(res.body.data.vehicleInfo.year, 2021);
    assert.strictEqual(res.body.data.isDeleted, false);

    createdInspectionId = res.body.data._id;
  });

  // ── 3. Validation: Reject Negative Mileage ──────────────────────────────────
  test('POST /api/v1/inspections rejects negative mileage with 400', async () => {
    const payload = {
      make: 'Hyundai',
      model: 'Creta',
      year: 2020,
      fuelType: 'diesel',
      transmission: 'automatic',
      mileageKm: -5000,
      askingPrice: 1250000,
    };

    const res = await request(app).post('/api/v1/inspections').send(payload);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('Mileage'));
  });

  // ── 4. Validation: Reject Invalid Year ───────────────────────────────────────
  test('POST /api/v1/inspections rejects impossible year with 400', async () => {
    const payload = {
      make: 'Maruti',
      model: 'Swift',
      year: 1980, // min is 1990
      fuelType: 'petrol',
      transmission: 'manual',
      mileageKm: 60000,
      askingPrice: 450000,
    };

    const res = await request(app).post('/api/v1/inspections').send(payload);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('year'));
  });

  // ── 5. Validation: Reject Invalid Fuel Type ─────────────────────────────────
  test('POST /api/v1/inspections rejects invalid fuelType with 400', async () => {
    const payload = {
      make: 'Toyota',
      model: 'Innova',
      year: 2022,
      fuelType: 'uranium_nuclear',
      transmission: 'manual',
      mileageKm: 30000,
      askingPrice: 1800000,
    };

    const res = await request(app).post('/api/v1/inspections').send(payload);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('Fuel type'));
  });

  // ── 6. Get Single Inspection (200 OK) ───────────────────────────────────────
  test('GET /api/v1/inspections/:id retrieves created inspection', async () => {
    assert.ok(createdInspectionId);
    const res = await request(app).get(`/api/v1/inspections/${createdInspectionId}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data._id, createdInspectionId);
    assert.strictEqual(res.body.data.vehicleInfo.model, 'City');
  });

  // ── 7. Get Single Inspection (404 for Non-Existent ID) ───────────────────────
  test('GET /api/v1/inspections/:id returns 404 for non-existent valid ObjectId', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/v1/inspections/${fakeId}`);

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'NOT_FOUND');
  });

  // ── 8. Get Single Inspection (400 for Malformed ID) ─────────────────────────
  test('GET /api/v1/inspections/:id returns 400 for malformed identifier string', async () => {
    const res = await request(app).get('/api/v1/inspections/not-a-valid-object-id-123');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'INVALID_ID');
  });

  // ── 9. List Inspections with Pagination ─────────────────────────────────────
  test('GET /api/v1/inspections returns paginated list', async () => {
    const res = await request(app).get('/api/v1/inspections?page=1&limit=5');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination);
    assert.strictEqual(res.body.pagination.page, 1);
    assert.strictEqual(res.body.pagination.limit, 5);
    assert.ok(res.body.pagination.total >= 1);
  });

  // ── 10. Update Inspection Vehicle Details (PATCH 200 OK) ───────────────────
  test('PATCH /api/v1/inspections/:id safely updates vehicle information', async () => {
    assert.ok(createdInspectionId);
    const updatePayload = {
      mileageKm: 43000,
      askingPrice: 875000,
      location: 'Koramangala, Bengaluru',
    };

    const res = await request(app).patch(`/api/v1/inspections/${createdInspectionId}`).send(updatePayload);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.vehicleInfo.mileageKm, 43000);
    assert.strictEqual(res.body.data.vehicleInfo.askingPrice, 875000);
    assert.strictEqual(res.body.data.vehicleInfo.location, 'Koramangala, Bengaluru');
  });

  // ── 11. Soft Delete Inspection (DELETE 200 OK) ──────────────────────────────
  test('DELETE /api/v1/inspections/:id performs soft deletion', async () => {
    assert.ok(createdInspectionId);
    const res = await request(app).delete(`/api/v1/inspections/${createdInspectionId}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes('soft delete'));

    // Verify record is flagged in database as isDeleted: true
    const docInDb = await Inspection.findOne({ _id: createdInspectionId, isDeleted: true });
    assert.ok(docInDb);
    assert.strictEqual(docInDb.isDeleted, true);
    assert.ok(docInDb.deletedAt instanceof Date);
  });

  // ── 12. Retrieval of Soft Deleted Record returns 404 ────────────────────────
  test('GET /api/v1/inspections/:id returns 404 for soft deleted record', async () => {
    assert.ok(createdInspectionId);
    const res = await request(app).get(`/api/v1/inspections/${createdInspectionId}`);

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'NOT_FOUND');
  });

  // ── 13. Soft Deleted Record Excluded from List ──────────────────────────────
  test('GET /api/v1/inspections excludes soft-deleted records from results', async () => {
    assert.ok(createdInspectionId);
    const res = await request(app).get('/api/v1/inspections');

    assert.strictEqual(res.status, 200);
    const found = res.body.data.find((item) => item._id === createdInspectionId);
    assert.strictEqual(found, undefined);
  });

  // ── 14. 404 Route Handling with Standard Envelope ───────────────────────────
  test('Non-existent route returns 404 with standardized error envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, 'ROUTE_NOT_FOUND');
  });
});
