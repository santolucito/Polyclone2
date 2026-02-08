/**
 * Isometric coordinate conversion utilities.
 * Single source of truth for all grid <-> pixel transformations.
 */

/** Width of a diamond tile in pixels (horizontal span). */
export const TILE_WIDTH = 64;

/** Height of a diamond tile in pixels (vertical span). */
export const TILE_HEIGHT = 32;

/** Border width around each tile in pixels. */
export const TILE_BORDER = 1;

/**
 * Convert grid coordinates to isometric pixel coordinates.
 * Returns the top-left corner of the diamond's bounding box.
 *
 * The isometric transform uses a standard diamond layout:
 *   px = (gridX - gridY) * (TILE_WIDTH / 2) + originOffsetX
 *   py = (gridX + gridY) * (TILE_HEIGHT / 2)
 *
 * originOffsetX shifts all tiles right so the map starts at x=0.
 */
export function gridToIso(gridX: number, gridY: number, mapHeight: number): { px: number; py: number } {
  const originOffsetX = (mapHeight - 1) * (TILE_WIDTH / 2);
  const px = (gridX - gridY) * (TILE_WIDTH / 2) + originOffsetX;
  const py = (gridX + gridY) * (TILE_HEIGHT / 2);
  return { px, py };
}

/**
 * Convert grid coordinates to the pixel center of the isometric diamond.
 *
 * The center corresponds to the fractional grid position (gridX + 0.5, gridY + 0.5).
 * Due to the iso transform, the +0.5 offsets cancel in the X direction
 * (subtraction) and add in the Y direction, giving:
 *   cx = px
 *   cy = py + TILE_HEIGHT / 2
 * where (px, py) is the bounding-box top-left from gridToIso().
 */
export function gridToIsoCenter(gridX: number, gridY: number, mapHeight: number): { cx: number; cy: number } {
  const { px, py } = gridToIso(gridX, gridY, mapHeight);
  return { cx: px, cy: py + TILE_HEIGHT / 2 };
}

/**
 * Convert pixel coordinates back to grid coordinates.
 * Returns null if the pixel is outside the map bounds.
 *
 * Inverse of the iso transform:
 *   gridX = (px' / (TILE_WIDTH/2) + py' / (TILE_HEIGHT/2)) / 2
 *   gridY = (py' / (TILE_HEIGHT/2) - px' / (TILE_WIDTH/2)) / 2
 *
 * Where px' = pixelX - originOffsetX
 */
export function isoToGrid(
  pixelX: number,
  pixelY: number,
  mapWidth: number,
  mapHeight: number,
): { x: number; y: number } | null {
  const originOffsetX = (mapHeight - 1) * (TILE_WIDTH / 2);
  const px = pixelX - originOffsetX;
  const py = pixelY;

  // Solve for fractional grid coords.
  // A small epsilon prevents floating-point rounding from pushing values
  // like -3e-16 to the wrong tile (Math.floor(-3e-16) === -1).
  const EPSILON = 1e-10;
  const gxFrac = (px / (TILE_WIDTH / 2) + py / (TILE_HEIGHT / 2)) / 2;
  const gyFrac = (py / (TILE_HEIGHT / 2) - px / (TILE_WIDTH / 2)) / 2;

  const gx = Math.floor(gxFrac + EPSILON);
  const gy = Math.floor(gyFrac + EPSILON);

  if (gx < 0 || gx >= mapWidth || gy < 0 || gy >= mapHeight) return null;
  return { x: gx, y: gy };
}

/**
 * Get the total pixel dimensions of the isometric map.
 * The diamond-shaped map spans:
 *   width  = (mapWidth + mapHeight) * TILE_WIDTH / 2
 *   height = (mapWidth + mapHeight) * TILE_HEIGHT / 2
 */
export function getIsoBounds(mapWidth: number, mapHeight: number): { width: number; height: number } {
  return {
    width: (mapWidth + mapHeight) * (TILE_WIDTH / 2),
    height: (mapWidth + mapHeight) * (TILE_HEIGHT / 2),
  };
}

/**
 * Get the 4 vertices of a diamond tile given its top-left bounding box corner.
 * Returns [top, right, bottom, left] in clockwise order.
 */
export function getDiamondVertices(px: number, py: number): [
  { x: number; y: number },
  { x: number; y: number },
  { x: number; y: number },
  { x: number; y: number },
] {
  const hw = TILE_WIDTH / 2;
  const hh = TILE_HEIGHT / 2;
  return [
    { x: px + hw, y: py },          // top
    { x: px + TILE_WIDTH, y: py + hh },  // right
    { x: px + hw, y: py + TILE_HEIGHT }, // bottom
    { x: px, y: py + hh },          // left
  ];
}
