const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Inspection = require('../models/Inspection');
const storageProvider = require('../storage');
const {
  MANDATORY_VIEW_TYPES,
  normalizeViewType,
  validateImageBuffer,
} = require('../utils/imageValidator');

/**
 * Calculates server-side completeness against mandatory views
 */
function calculateCompleteness(images = []) {
  const presentViews = images.map((img) => img.viewType);
  const missingMandatoryViews = MANDATORY_VIEW_TYPES.filter((mv) => !presentViews.includes(mv));
  const optionalViews = presentViews.filter((v) => !MANDATORY_VIEW_TYPES.includes(v));

  return {
    complete: missingMandatoryViews.length === 0,
    mandatoryComplete: missingMandatoryViews.length === 0,
    missingMandatoryViews,
    presentViews,
    mandatoryCount: MANDATORY_VIEW_TYPES.length - missingMandatoryViews.length,
    optionalCount: optionalViews.length,
    totalImages: images.length,
  };
}

/**
 * POST /api/v1/inspections/:id/images
 * Ingests, validates, stores, and attaches an image to an inspection
 */
const uploadImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawViewType = req.body.viewType || req.body.angle;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The provided inspection ID is not a valid identifier.',
        },
      });
    }

    const inspection = await Inspection.findOne({ _id: id, isDeleted: false });

    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inspection record not found or has been deleted.',
        },
      });
    }

    // Strict Authorization: Verify ownership
    if (!inspection.userId || inspection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to upload images to this inspection.',
        },
      });
    }

    // Validate View Type
    const viewType = normalizeViewType(rawViewType);
    if (!viewType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VIEW_TYPE',
          message: `Invalid view type '${rawViewType}'. Supported views: FRONT, REAR, LEFT, RIGHT, FRONT_LEFT, FRONT_RIGHT, REAR_LEFT, REAR_RIGHT, INTERIOR, DASHBOARD, ENGINE_BAY, TYRES.`,
        },
      });
    }

    // Validate File Existence
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'An image file is required in multipart/form-data payload.',
        },
      });
    }

    // Validate Magic Bytes and Formats (JPEG, PNG, WebP)
    const validation = validateImageBuffer(req.file.buffer);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: validation.error,
        },
      });
    }

    // Check if an image for this viewType already exists (Replacement Flow)
    const existingIndex = inspection.images.findIndex((img) => img.viewType === viewType);
    if (existingIndex !== -1) {
      const oldImage = inspection.images[existingIndex];
      if (oldImage.storageKey) {
        // Asynchronously clean up old file from storage
        storageProvider.deleteImage(oldImage.storageKey).catch((err) => {
          console.warn(`[Storage Warning] Failed to delete replaced image ${oldImage.storageKey}:`, err.message);
        });
      }
      inspection.images.splice(existingIndex, 1);
    }

    // Store File via StorageProvider
    const imageId = uuidv4();
    const storageKey = `inspections/${inspection._id}/${imageId}.${validation.extension}`;
    await storageProvider.saveImage(storageKey, req.file.buffer, validation.mimeType);

    // Save Image Metadata
    const imageMetadata = {
      imageId,
      viewType,
      storageKey,
      originalFilename: req.file.originalname ? String(req.file.originalname).substring(0, 150) : '',
      mimeType: validation.mimeType,
      fileSize: req.file.buffer.length,
      width: validation.width,
      height: validation.height,
      uploadedAt: new Date(),
      processingStatus: 'UPLOADED',
      qualityStatus: 'PENDING',
      qualityScore: null,
      warnings: [],
      qualityMetrics: {
        blurScore: null,
        brightnessMean: null,
        isDuplicate: false,
        notes: [],
      },
    };

    inspection.images.push(imageMetadata);
    await inspection.save();

    const completeness = calculateCompleteness(inspection.images);

    res.status(201).json({
      success: true,
      data: {
        image: imageMetadata,
        completeness,
      },
      message: `Image for view '${viewType}' successfully uploaded and stored.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/inspections/:id/images/:imageId
 * Securely streams an authenticated vehicle image
 */
const getImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid inspection ID.' },
      });
    }

    const inspection = await Inspection.findOne({ _id: id, isDeleted: false });
    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Inspection not found.' },
      });
    }

    // Strict Authorization: Verify ownership
    if (!inspection.userId || inspection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this inspection image.',
        },
      });
    }

    const imageMeta = inspection.images.find((img) => img.imageId === imageId);
    if (!imageMeta) {
      return res.status(404).json({
        success: false,
        error: { code: 'IMAGE_NOT_FOUND', message: 'Image record not found.' },
      });
    }

    const stream = await storageProvider.getImageStream(imageMeta.storageKey);
    if (!stream) {
      return res.status(404).json({
        success: false,
        error: { code: 'STORAGE_OBJECT_NOT_FOUND', message: 'Image file not found in storage provider.' },
      });
    }

    res.setHeader('Content-Type', imageMeta.mimeType);
    res.setHeader('Content-Length', imageMeta.fileSize);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/inspections/:id/images/:imageId
 * Removes an image from storage and MongoDB metadata
 */
const deleteImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid inspection ID.' },
      });
    }

    const inspection = await Inspection.findOne({ _id: id, isDeleted: false });
    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Inspection not found.' },
      });
    }

    // Strict Authorization: Verify ownership
    if (!inspection.userId || inspection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete images from this inspection.',
        },
      });
    }

    const imageIndex = inspection.images.findIndex((img) => img.imageId === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'IMAGE_NOT_FOUND', message: 'Image record not found.' },
      });
    }

    const [removedImage] = inspection.images.splice(imageIndex, 1);
    await inspection.save();

    // Delete file from storage
    if (removedImage.storageKey) {
      await storageProvider.deleteImage(removedImage.storageKey);
    }

    const completeness = calculateCompleteness(inspection.images);

    res.status(200).json({
      success: true,
      data: {
        deletedImageId: imageId,
        completeness,
      },
      message: 'Image successfully deleted from inspection and storage.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/inspections/:id/completeness
 * Evaluates mandatory view completeness for the inspection
 */
const getCompleteness = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid inspection ID.' },
      });
    }

    const inspection = await Inspection.findOne({ _id: id, isDeleted: false });
    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Inspection not found.' },
      });
    }

    // Strict Authorization: Verify ownership
    if (!inspection.userId || inspection.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view completeness for this inspection.',
        },
      });
    }

    const completeness = calculateCompleteness(inspection.images);

    res.status(200).json({
      success: true,
      data: completeness,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadImage,
  getImage,
  deleteImage,
  getCompleteness,
};
