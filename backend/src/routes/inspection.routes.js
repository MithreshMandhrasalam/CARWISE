const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
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

// Optional authentication attaches user if token is valid, otherwise permits guest operation
router.use(optionalAuth);

// Core CRUD Endpoints
router.get('/', listInspections);
router.post('/', validateInspectionCreation, createInspection);
router.get('/:id', getInspection);
router.patch('/:id', validateInspectionUpdate, updateInspection);
router.delete('/:id', deleteInspection);

module.exports = router;
