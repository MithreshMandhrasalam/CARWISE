const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
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

// All inspection routes strictly require valid JWT authentication
router.use(auth);

// Core CRUD Endpoints (strictly scoped to authenticated user)
router.get('/', listInspections);
router.post('/', validateInspectionCreation, createInspection);
router.get('/:id', getInspection);
router.patch('/:id', validateInspectionUpdate, updateInspection);
router.delete('/:id', deleteInspection);

module.exports = router;
