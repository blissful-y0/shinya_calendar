import { Sticker } from '@components/Styling/StickerPanel';

/**
 * Convert pixel position to percentage based on container dimensions
 */
export const pixelToPercent = (pixelValue: number, containerSize: number): number => {
  return (pixelValue / containerSize) * 100;
};

/**
 * Convert percentage position to pixels based on container dimensions
 */
export const percentToPixel = (percentValue: number, containerSize: number): number => {
  return (percentValue / 100) * containerSize;
};

/**
 * Update sticker with percentage values based on current container size
 */
export const updateStickerPercentages = (
  sticker: Sticker,
  containerWidth: number,
  containerHeight: number
): Sticker => {
  return {
    ...sticker,
    xPercent: pixelToPercent(sticker.x, containerWidth),
    yPercent: pixelToPercent(sticker.y, containerHeight),
    widthPercent: pixelToPercent(sticker.width, containerWidth),
    heightPercent: pixelToPercent(sticker.height, containerHeight),
  };
};

/**
 * Calculate pixel positions from percentage values
 */
export const calculatePixelPositions = (
  sticker: Sticker,
  containerWidth: number,
  containerHeight: number
): Sticker => {
  // If percentage values exist, use them; otherwise use existing pixel values
  return {
    ...sticker,
    x: sticker.xPercent !== undefined
      ? percentToPixel(sticker.xPercent, containerWidth)
      : sticker.x,
    y: sticker.yPercent !== undefined
      ? percentToPixel(sticker.yPercent, containerHeight)
      : sticker.y,
    width: sticker.widthPercent !== undefined
      ? percentToPixel(sticker.widthPercent, containerWidth)
      : sticker.width,
    height: sticker.heightPercent !== undefined
      ? percentToPixel(sticker.heightPercent, containerHeight)
      : sticker.height,
  };
};

/**
 * Migrate existing stickers to use percentage-based positioning
 */
export const migrateStickerToResponsive = (
  stickers: Sticker[],
  containerWidth: number,
  containerHeight: number
): Sticker[] => {
  return stickers.map(sticker => {
    // If sticker already has percentage values, keep them
    if (sticker.xPercent !== undefined && sticker.yPercent !== undefined) {
      return sticker;
    }
    // Otherwise, calculate percentages from current pixel values
    return updateStickerPercentages(sticker, containerWidth, containerHeight);
  });
};

/**
 * Clamp sticker position within container bounds
 */
export const clampStickerPosition = (
  sticker: Sticker,
  containerWidth: number,
  containerHeight: number
): Sticker => {
  const minX = 0;
  const minY = 0;
  const maxX = Math.max(0, containerWidth - sticker.width);
  const maxY = Math.max(0, containerHeight - sticker.height);

  return {
    ...sticker,
    x: Math.max(minX, Math.min(sticker.x, maxX)),
    y: Math.max(minY, Math.min(sticker.y, maxY)),
  };
};