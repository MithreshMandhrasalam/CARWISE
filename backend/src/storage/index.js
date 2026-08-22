const LocalStorageProvider = require('./LocalStorageProvider');

const uploadDirectory = process.env.UPLOAD_DIR || './uploads';
const storageProvider = new LocalStorageProvider(uploadDirectory);

module.exports = storageProvider;
