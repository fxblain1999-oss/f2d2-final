(() => {
  const MAX_SAMPLE_SIZE = 320;
  const ALPHA_THRESHOLD = 8;

  const getVisibleBounds = (image) => {
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    if (!naturalWidth || !naturalHeight) return null;

    const scale = Math.min(1, MAX_SAMPLE_SIZE / Math.max(naturalWidth, naturalHeight));
    const width = Math.max(1, Math.round(naturalWidth * scale));
    const height = Math.max(1, Math.round(naturalHeight * scale));
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
        const alpha = pixels[(y * width + x) * 4 + 3];

        if (alpha > ALPHA_THRESHOLD) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }

    if (top > bottom || left > right) return null;

    return {
      top: top / scale,
      bottom: (naturalHeight - bottom - 1) / scale,
    };
  };

  const trimMediaImage = (image) => {
    const mediaContainer = image.closest('.product__media-container');
    if (!mediaContainer || mediaContainer.dataset.transparentTrim === 'done') return;

    try {
      const bounds = getVisibleBounds(image);
      if (!bounds) return;

      const renderedScale = image.getBoundingClientRect().height / image.naturalHeight;
      const topGap = Math.max(0, Math.round(bounds.top * renderedScale));
      const bottomGap = Math.max(0, Math.round(bounds.bottom * renderedScale));

      mediaContainer.style.setProperty('--transparent-trim-top', `${topGap}px`);
      mediaContainer.style.setProperty('--transparent-trim-bottom', `${bottomGap}px`);
      mediaContainer.dataset.transparentTrim = 'done';
    } catch (error) {
      mediaContainer.dataset.transparentTrim = 'skipped';
    }
  };

  const trimProductImages = () => {
    if (!window.matchMedia('(max-width: 767.98px)').matches) return;

    document.querySelectorAll('.product__media-container img').forEach((image) => {
      if (image.complete) {
        trimMediaImage(image);
      } else {
        image.addEventListener('load', () => trimMediaImage(image), { once: true });
      }
    });
  };

  document.addEventListener('DOMContentLoaded', trimProductImages);
  document.addEventListener('shopify:section:load', trimProductImages);
})();
