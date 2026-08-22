const path = require('path');
const Inspection = require('../models/Inspection');
const aiService = require('../services/aiService');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// POST /api/v1/inspections
const createInspection = async (req, res, next) => {
  try {
    const { make, model, variant, year, fuelType, transmission, mileageKm, askingPrice, location } =
      req.body;

    if (!make || !model || !year || !fuelType || !transmission || !mileageKm || !askingPrice) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required vehicle information.' });
    }

    const inspection = await Inspection.create({
      userId: req.user._id,
      vehicleInfo: {
        make,
        model,
        variant: variant || '',
        year: parseInt(year),
        fuelType,
        transmission,
        mileageKm: parseInt(mileageKm),
        askingPrice: parseFloat(askingPrice),
        location: location || '',
      },
    });

    res.status(201).json({ success: true, data: inspection });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/inspections/:id/images
const uploadImages = async (req, res, next) => {
  try {
    const inspection = await Inspection.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }

    const angles = req.body.angles
      ? Array.isArray(req.body.angles)
        ? req.body.angles
        : [req.body.angles]
      : [];

    const newImages = req.files.map((file, idx) => ({
      angle: angles[idx] || 'front',
      storageKey: file.path,
      url: `${BACKEND_URL}/uploads/${inspection._id}/${file.filename}`,
    }));

    inspection.images.push(...newImages);
    await inspection.save();

    res.json({ success: true, data: { images: inspection.images } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/inspections/:id/analyze
const analyzeInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (inspection.status === 'processing') {
      return res.status(409).json({ success: false, message: 'Analysis already in progress.' });
    }

    // Mark as processing
    inspection.status = 'processing';
    await inspection.save();

    // Call AI service (async — runs after response)
    res.json({ success: true, message: 'Analysis started.', inspectionId: inspection._id });

    try {
      const results = await aiService.runFullAnalysis(inspection);
      inspection.aiResults = results;
      inspection.status = 'complete';
      inspection.completedAt = new Date();
      await inspection.save();
    } catch (aiErr) {
      console.error('[AI Analysis Error]', aiErr.message);
      inspection.status = 'failed';
      await inspection.save();
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/inspections/:id
const getInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findOne({ _id: req.params.id, userId: req.user._id });
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }
    res.json({ success: true, data: inspection });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/inspections
const listInspections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [inspections, total] = await Promise.all([
      Inspection.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-aiResults.damageDetection.detections -images.storageKey'),
      Inspection.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      data: inspections,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/inspections/:id
const deleteInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }
    res.json({ success: true, message: 'Inspection deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInspection,
  uploadImages,
  analyzeInspection,
  getInspection,
  listInspections,
  deleteInspection,
};
