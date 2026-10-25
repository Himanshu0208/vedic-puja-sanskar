export const MAX_IMAGE_UPLOAD_BYTES = 1 * 1024 * 1024;

export async function optimizeImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  let optimized = file;
  if (file.type !== 'image/gif' && typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable');
      context.drawImage(bitmap, 0, 0);
      bitmap.close();

      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (png && png.size < file.size) {
        const name = file.name.replace(/\.[^.]+$/, '.png');
        optimized = new File([png], name, { type: 'image/png', lastModified: file.lastModified });
      }
    } catch {
      // Keep the original when the browser cannot losslessly re-encode it.
    }
  }

  if (optimized.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error('Images must be 1 MB or smaller after lossless optimization.');
  }
  return optimized;
}
