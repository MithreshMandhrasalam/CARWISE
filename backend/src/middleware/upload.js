const multer = require('multer');

// Store files in memory buffer for immediate magic-byte validation
const memoryStorage = multer.memoryStorage();

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10);

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 12, // Maximum 12 perspectives per vehicle
  },
});

module.exports = upload;
