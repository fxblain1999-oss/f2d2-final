(() => {
  const MAX_SAMPLE_SIZE = 360;
  const ALPHA_THRESHOLD = 8;
  const FRAME_PADDING = 0.08;
  const MAX_SCALE = 2.2;

  const getVisibleBounds = (image) => {
    if (!image.naturalWidth || !image.naturalHeight) return null;

    const scale = Math.min(1, MAX_SAMPLE_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height).data;
    let top = height;
    let right = 0;
    let bottom = 0;
    let left = width;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] <= ALPHA_THRESHOLD) continue;

        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
        left = Math.min(left, x);
      }
    }

    if (top > bottom || left > right) return null;

    return {
      width: (right - left + 1) / width,
      height: (bottom - top + 1) / height,
      centerX: (left + right + 1) / 2 / width,
      centerY: (top + bottom + 1) / 2 / height,
    };
  };

  const fitTransparentImage = (image) => {
    const container = image.closest('.product__media-container');
    if (!container || image.dataset.transparentFit) return;

    try {
      const bounds = getVisibleBounds(image);
      if (!bounds) return;

      const target = 1 - FRAME_PADDING * 2;
      const scale = Math.min(MAX_SCALE, target / Math.max(bounds.width, bounds.height));

      if (scale <= 1.04) {
        image.dataset.transparentFit = 'none';
        return;
      }

      image.style.setProperty('--transparent-fit-scale', scale.toFixed(3));
      image.style.setProperty('--transparent-fit-x', `${((0.5 - bounds.centerX) * 100).toFixed(2)}%`);
      image.style.setProperty('--transparent-fit-y', `${((0.5 - bounds.centerY) * 100).toFixed(2)}%`);
      image.dataset.transparentFit = 'done';
    } catch (error) {
      image.dataset.transparentFit = 'skipped';
    }
  };

  const fitProductImages = () => {
    if (!window.matchMedia('(max-width: 767.98px)').matches) return;

    document.querySelectorAll('.product__media-container img').forEach((image) => {
      if (image.complete) {
        fitTransparentImage(image);
      } else {
        image.addEventListener('load', () => fitTransparentImage(image), { once: true });
      }
    });
  };

  document.addEventListener('DOMContentLoaded', fitProductImages);
  document.addEventListener('shopify:section:load', fitProductImages);
})();
