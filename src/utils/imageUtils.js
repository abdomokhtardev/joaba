/**
 * Compresses an image file to a Base64 JPEG string.
 * Resizes to fit within MAX_WIDTH x MAX_HEIGHT while maintaining aspect ratio.
 * 
 * @param {File} file - The image file to compress
 * @param {Object} [options] - Compression options
 * @param {number} [options.maxWidth=600] - Maximum width in pixels
 * @param {number} [options.maxHeight=600] - Maximum height in pixels
 * @param {number} [options.quality=0.5] - JPEG quality (0-1)
 * @returns {Promise<string>} - Base64 data URL of the compressed image
 */
export const compressImage = (file, options = {}) => {
  const { maxWidth = 600, maxHeight = 600, quality = 0.5 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('فشل في قراءة الملف.'));

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => reject(new Error('فشل في تحميل الصورة.'));

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};
