// ═══════════════════════════════════════════════════════════════
// CARWISE — Request Validation Middleware
// Validates vehicle specifications and updates against domain rules
// ═══════════════════════════════════════════════════════════════

const VALID_FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];
const VALID_TRANSMISSIONS = ['manual', 'automatic', 'amt'];
const CURRENT_YEAR = new Date().getFullYear();

const validateInspectionCreation = (req, res, next) => {
  const { make, model, variant, year, fuelType, transmission, mileageKm, askingPrice, location, registrationNumber } = req.body || {};

  const errors = [];

  // 1. Make & Model
  if (!make || typeof make !== 'string' || make.trim().length === 0) {
    errors.push('Vehicle make is required and must be a valid text string.');
  } else if (make.trim().length > 100) {
    errors.push('Vehicle make cannot exceed 100 characters.');
  }

  if (!model || typeof model !== 'string' || model.trim().length === 0) {
    errors.push('Vehicle model is required and must be a valid text string.');
  } else if (model.trim().length > 100) {
    errors.push('Vehicle model cannot exceed 100 characters.');
  }

  // 2. Year Validation (1990 to Current Year + 1)
  const parsedYear = Number(year);
  if (year === undefined || year === null || isNaN(parsedYear)) {
    errors.push('Manufacturing year is required and must be a valid number.');
  } else if (parsedYear < 1990 || parsedYear > CURRENT_YEAR + 1) {
    errors.push(`Manufacturing year must be between 1990 and ${CURRENT_YEAR + 1}.`);
  }

  // 3. Mileage (non-negative integer)
  const parsedMileage = Number(mileageKm);
  if (mileageKm === undefined || mileageKm === null || isNaN(parsedMileage)) {
    errors.push('Odometer mileage (mileageKm) is required and must be a valid number.');
  } else if (parsedMileage < 0 || parsedMileage > 2000000) {
    errors.push('Odometer Mileage must be between 0 and 2,000,000 km.');
  }

  // 4. Asking Price (non-negative number)
  const parsedPrice = Number(askingPrice);
  if (askingPrice === undefined || askingPrice === null || isNaN(parsedPrice)) {
    errors.push('Asking price (askingPrice) is required and must be a valid number.');
  } else if (parsedPrice < 0 || parsedPrice > 1000000000) {
    errors.push('Asking price must be a valid positive amount.');
  }

  // 5. Fuel Type
  if (!fuelType || typeof fuelType !== 'string' || !VALID_FUEL_TYPES.includes(fuelType.toLowerCase())) {
    errors.push(`Fuel type must be one of: ${VALID_FUEL_TYPES.join(', ')}.`);
  }

  // 6. Transmission
  if (!transmission || typeof transmission !== 'string' || !VALID_TRANSMISSIONS.includes(transmission.toLowerCase())) {
    errors.push(`Transmission must be one of: ${VALID_TRANSMISSIONS.join(', ')}.`);
  }

  // Return validation error response if any rules failed
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.join(' '),
        details: errors,
      },
    });
  }

  // Format and sanitize payload onto req.validatedData
  req.validatedData = {
    make: make.trim(),
    model: model.trim(),
    variant: variant ? String(variant).trim() : '',
    year: Math.round(parsedYear),
    fuelType: fuelType.toLowerCase().trim(),
    transmission: transmission.toLowerCase().trim(),
    mileageKm: Math.round(parsedMileage),
    askingPrice: Math.round(parsedPrice),
    location: location ? String(location).trim() : '',
    registrationNumber: registrationNumber ? String(registrationNumber).trim().toUpperCase() : '',
  };

  next();
};

const validateInspectionUpdate = (req, res, next) => {
  const allowedFields = ['make', 'model', 'variant', 'year', 'fuelType', 'transmission', 'mileageKm', 'askingPrice', 'location', 'registrationNumber'];
  const updateData = {};
  const errors = [];

  for (const key of Object.keys(req.body || {})) {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'No valid vehicle information fields provided for update.',
      },
    });
  }

  if (updateData.year !== undefined) {
    const parsedYear = Number(updateData.year);
    if (isNaN(parsedYear) || parsedYear < 1990 || parsedYear > CURRENT_YEAR + 1) {
      errors.push(`Manufacturing year must be between 1990 and ${CURRENT_YEAR + 1}.`);
    } else {
      updateData.year = Math.round(parsedYear);
    }
  }

  if (updateData.mileageKm !== undefined) {
    const parsedMileage = Number(updateData.mileageKm);
    if (isNaN(parsedMileage) || parsedMileage < 0) {
      errors.push('Mileage must be a positive number.');
    } else {
      updateData.mileageKm = Math.round(parsedMileage);
    }
  }

  if (updateData.askingPrice !== undefined) {
    const parsedPrice = Number(updateData.askingPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.push('Asking price must be a positive number.');
    } else {
      updateData.askingPrice = Math.round(parsedPrice);
    }
  }

  if (updateData.fuelType !== undefined) {
    if (!VALID_FUEL_TYPES.includes(String(updateData.fuelType).toLowerCase())) {
      errors.push(`Fuel type must be one of: ${VALID_FUEL_TYPES.join(', ')}.`);
    } else {
      updateData.fuelType = String(updateData.fuelType).toLowerCase();
    }
  }

  if (updateData.transmission !== undefined) {
    if (!VALID_TRANSMISSIONS.includes(String(updateData.transmission).toLowerCase())) {
      errors.push(`Transmission must be one of: ${VALID_TRANSMISSIONS.join(', ')}.`);
    } else {
      updateData.transmission = String(updateData.transmission).toLowerCase();
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.join(' '),
        details: errors,
      },
    });
  }

  req.validatedUpdateData = updateData;
  next();
};

module.exports = {
  validateInspectionCreation,
  validateInspectionUpdate,
};
