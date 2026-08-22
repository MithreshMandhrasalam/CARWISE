const fs = require('fs');
const path = require('path');
const StorageProvider = require('./StorageProvider');

class LocalStorageProvider extends StorageProvider {
  constructor(baseDirectory = './uploads') {
    super();
    this.baseDirectory = path.resolve(baseDirectory);
    if (!fs.existsSync(this.baseDirectory)) {
      fs.mkdirSync(this.baseDirectory, { recursive: true });
    }
  }

  /**
   * Resolves storageKey to an absolute path while preventing path traversal
   */
  _resolveSecurePath(storageKey) {
    // Strip leading slashes and backslashes
    const sanitizedKey = storageKey.replace(/^[/\\]+/, '');
    const resolvedPath = path.resolve(this.baseDirectory, sanitizedKey);

    // Prevent path traversal outside base directory
    if (!resolvedPath.startsWith(this.baseDirectory)) {
      throw new Error('Security Exception: Path traversal attempt detected in storage key.');
    }

    return resolvedPath;
  }

  async saveImage(storageKey, buffer, mimeType) {
    const fullPath = this._resolveSecurePath(storageKey);
    const directory = path.dirname(fullPath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);
    return {
      storageKey,
      size: buffer.length,
      mimeType,
    };
  }

  async getImageStream(storageKey) {
    const fullPath = this._resolveSecurePath(storageKey);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.createReadStream(fullPath);
  }

  async deleteImage(storageKey) {
    try {
      const fullPath = this._resolveSecurePath(storageKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);

        // Clean up parent directory if empty
        const dir = path.dirname(fullPath);
        if (fs.existsSync(dir)) {
          const files = await fs.promises.readdir(dir);
          if (files.length === 0) {
            await fs.promises.rmdir(dir);
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[Storage Warning] Could not delete file for ${storageKey}:`, err.message);
      return false;
    }
  }

  async exists(storageKey) {
    try {
      const fullPath = this._resolveSecurePath(storageKey);
      return fs.existsSync(fullPath);
    } catch (err) {
      return false;
    }
  }
}

module.exports = LocalStorageProvider;
