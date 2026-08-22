const mongoose = require('mongoose');
const Inspection = require('../models/Inspection');

/**
 * POST /api/v1/inspections
 * Creates a new inspection with validated vehicle info. Initial status: PENDING.
 */
const createInspection = async (req, res, next) => {
  try {
    const vehicleData = req.validatedData;

    const inspection = await Inspection.create({
      userId: req.user ? req.user._id : null,
      status: 'PENDING',
      vehicleInfo: vehicleData,
      images: [],
    });

    res.status(201).json({
      success: true,
      data: inspection,
      message: 'Inspection record successfully created in pending state.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/inspections/:id
 * Retrieves an inspection by its unique MongoDB ObjectId.
 */
const getInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The provided inspection ID is not a valid identifier.',
        },
      });
    }

    const query = { _id: id, isDeleted: false };
    // If user is authenticated, allow viewing their own or public records
    if (req.user) {
      // Authenticated users can view records they own or unclaimed records
      query.$or = [{ userId: req.user._id }, { userId: null }];
    }

    const inspection = await Inspection.findOne(query).select('-__v');

    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inspection record not found or has been deleted.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: inspection,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/inspections
 * Lists inspections with pagination, sorting, and optional status/make filters.
 */
const listInspections = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    // Scope to user if authenticated
    if (req.user) {
      filter.userId = req.user._id;
    }

    // Optional status filter
    if (req.query.status) {
      filter.status = String(req.query.status).toUpperCase();
    }

    // Optional make filter
    if (req.query.make) {
      filter['vehicleInfo.make'] = { $regex: String(req.query.make).trim(), $options: 'i' };
    }

    // Sorting
    const sortField = req.query.sortBy === 'updatedAt' ? 'updatedAt' : 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortField]: sortOrder };

    const [inspections, total] = await Promise.all([
      Inspection.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select('vehicleInfo status createdAt updatedAt images.viewType images.qualityStatus trustScore conditionScore'),
      Inspection.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/inspections/:id
 * Safely updates vehicle information fields only.
 */
const updateInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The provided inspection ID is not a valid identifier.',
        },
      });
    }

    const query = { _id: id, isDeleted: false };
    if (req.user) {
      query.userId = req.user._id;
    }

    const inspection = await Inspection.findOne(query);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inspection record not found or update unauthorized.',
        },
      });
    }

    // Prevent modifying completed or processing inspections
    if (['PROCESSING', 'COMPLETE'].includes(inspection.status)) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'STATE_LOCKED',
          message: `Cannot update vehicle details while inspection is in '${inspection.status}' state.`,
        },
      });
    }

    // Apply only validated vehicle info fields
    Object.assign(inspection.vehicleInfo, req.validatedUpdateData);
    await inspection.save();

    res.status(200).json({
      success: true,
      data: inspection,
      message: 'Vehicle information successfully updated.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/inspections/:id
 * Performs safe soft deletion of an inspection record.
 */
const deleteInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The provided inspection ID is not a valid identifier.',
        },
      });
    }

    const query = { _id: id, isDeleted: false };
    if (req.user) {
      query.userId = req.user._id;
    }

    const inspection = await Inspection.findOne(query);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inspection record not found or already deleted.',
        },
      });
    }

    inspection.isDeleted = true;
    inspection.deletedAt = new Date();
    await inspection.save();

    res.status(200).json({
      success: true,
      message: 'Inspection record successfully archived (soft deleted).',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInspection,
  getInspection,
  listInspections,
  updateInspection,
  deleteInspection,
};
