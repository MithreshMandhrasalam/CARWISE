// ═══════════════════════════════════════════════════════════════
// CARWISE — Abstract StorageProvider Interface
// Pluggable persistence layer (Local disk, AWS S3, GCS)
// ═══════════════════════════════════════════════════════════════

class StorageProvider {
  /**
   * Saves image buffer to the underlying storage provider
   * @param {string} storageKey - Relative identifier (e.g. inspections/123/abc.jpg)
   * @param {Buffer} buffer - Binary data
   * @param {string} mimeType - Image mime type
   * @returns {Promise<{ storageKey: string, size: number }>}
   */
  async saveImage(storageKey, buffer, mimeType) {
    throw new Error('saveImage() must be implemented by storage provider subclass.');
  }

  /**
   * Retrieves image read stream from storage
   * @param {string} storageKey
   * @returns {Promise<ReadableStream | NodeJS.ReadableStream>}
   */
  async getImageStream(storageKey) {
    throw new Error('getImageStream() must be implemented by storage provider subclass.');
  }

  /**
   * Deletes an image from storage
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async deleteImage(storageKey) {
    throw new Error('deleteImage() must be implemented by storage provider subclass.');
  }

  /**
   * Checks if an image exists in storage
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async exists(storageKey) {
    throw new Error('exists() must be implemented by storage provider subclass.');
  }
}

module.exports = StorageProvider;
