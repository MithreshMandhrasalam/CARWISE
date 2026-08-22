const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createInspection,
  uploadImages,
  analyzeInspection,
  getInspection,
  listInspections,
  deleteInspection,
} = require('../controllers/inspection.controller');

router.use(auth); // All inspection routes require authentication

router.get('/', listInspections);
router.post('/', createInspection);
router.get('/:id', getInspection);
router.delete('/:id', deleteInspection);
router.post('/:id/images', upload.array('images', 15), uploadImages);
router.post('/:id/analyze', analyzeInspection);

module.exports = router;
