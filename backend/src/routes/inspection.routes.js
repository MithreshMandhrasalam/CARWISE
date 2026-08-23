const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  validateInspectionCreation,
  validateInspectionUpdate,
} = require('../middleware/validate');
const {
  createInspection,
  getInspection,
  listInspections,
  updateInspection,
  deleteInspection,
} = require('../controllers/inspection.controller');
const {
  uploadImage,
  getImage,
  deleteImage,
  getCompleteness,
} = require('../controllers/image.controller');
const {
  runInspectionIQA,
  getInspectionIQA,
} = require('../controllers/iqa.controller');
const {
  detectDamage,
  getDamageDetections,
} = require('../controllers/damage.controller');
const {
  analyzeInspectionEvidence,
  getInspectionEvidence,
} = require('../controllers/evidence.controller');

// All inspection routes strictly require valid JWT authentication
router.use(auth);

// Core CRUD Endpoints (strictly scoped to authenticated user)
router.get('/', listInspections);
router.post('/', validateInspectionCreation, createInspection);
router.get('/:id', getInspection);
router.patch('/:id', validateInspectionUpdate, updateInspection);
router.delete('/:id', deleteInspection);

// Image Pipeline Endpoints (Phase 5)
router.post('/:id/images', upload.single('image'), uploadImage);
router.get('/:id/images/:imageId', getImage);
router.delete('/:id/images/:imageId', deleteImage);
router.get('/:id/completeness', getCompleteness);

// Image Quality Assessment (IQA) Endpoints (Phase 6)
router.post('/:id/iqa', runInspectionIQA);
router.get('/:id/iqa', getInspectionIQA);

// Computer Vision Damage Detection Endpoints (Phase 7C)
router.post('/:id/damage/detect', detectDamage);
router.get('/:id/damage', getDamageDetections);

// Evidence Reasoning & Deterministic Damage Assessment (Phase 8)
router.post('/:id/evidence/analyze', analyzeInspectionEvidence);
router.get('/:id/evidence', getInspectionEvidence);

module.exports = router;
