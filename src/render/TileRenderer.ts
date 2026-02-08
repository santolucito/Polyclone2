/**
 * Renders individual map tiles as isometric diamonds using PixiJS 8 Graphics.
 *
 * Each tile is a 64x32 pixel diamond with:
 *   - A fill color determined by terrain type
 *   - A 1px border in a slightly darker shade
 *   - Optional visual depth details (mountain peak, water waves, forest circles)
 */

import { Graphics } from 'pixi.js';
import { TileType } from '../core/types.js';
import type { Tile } from '../core/types.js';
import { TERRAIN_COLORS, TERRAIN_BORDER_COLORS } from './constants.js';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  TILE_BORDER,
  gridToIso,
  getDiamondVertices,
} from './CoordinateUtils.js';

/**
 * Creates a PixiJS Graphics object representing the given tile as an isometric diamond.
 */
export function createTileGraphic(tile: Tile, mapHeight: number): Graphics {
  const g = new Graphics();
  const { px, py } = gridToIso(tile.x, tile.y, mapHeight);

  const fillColor = TERRAIN_COLORS[tile.type];
  const borderColor = TERRAIN_BORDER_COLORS[tile.type];

  // Draw diamond shape
  const [top, right, bottom, left] = getDiamondVertices(px, py);
  g.moveTo(top.x, top.y)
    .lineTo(right.x, right.y)
    .lineTo(bottom.x, bottom.y)
    .lineTo(left.x, left.y)
    .closePath()
    .fill({ color: fillColor })
    .stroke({ width: TILE_BORDER, color: borderColor });

  // Add visual depth details per terrain type
  addTerrainDetails(g, tile.type, px, py);

  return g;
}

/**
 * Adds subtle visual depth effects on top of the base diamond tile.
 */
function addTerrainDetails(
  g: Graphics,
  type: TileType,
  px: number,
  py: number,
): void {
  switch (type) {
    case TileType.Mountain:
      drawMountainDetail(g, px, py);
      break;
    case TileType.ShallowWater:
    case TileType.Ocean:
      drawWaterWaves(g, type, px, py);
      break;
    case TileType.Forest:
      drawForestDetail(g, px, py);
      break;
    case TileType.Field:
      break;
  }
}

/** Mountains: a small triangle peak in the center of the diamond. */
function drawMountainDetail(g: Graphics, px: number, py: number): void {
  const cx = px + TILE_WIDTH / 2;
  const cy = py + TILE_HEIGHT / 2;

  // Triangle peak rising above center
  const peakH = TILE_HEIGHT * 0.45;
  const baseW = TILE_WIDTH * 0.25;

  g.moveTo(cx, cy - peakH)
    .lineTo(cx + baseW, cy)
    .lineTo(cx - baseW, cy)
    .closePath()
    .fill({ color: 0xa0a0a0, alpha: 0.5 });

  // Shadow at base
  g.moveTo(cx - baseW, cy)
    .lineTo(cx + baseW, cy)
    .lineTo(cx + baseW * 0.6, cy + TILE_HEIGHT * 0.2)
    .lineTo(cx - baseW * 0.6, cy + TILE_HEIGHT * 0.2)
    .closePath()
    .fill({ color: 0x6e6e6e, alpha: 0.4 });
}

/** Water: subtle wave lines following the diamond angle. */
function drawWaterWaves(
  g: Graphics,
  type: TileType,
  px: number,
  py: number,
): void {
  const waveColor = type === TileType.Ocean ? 0x2470c4 : 0x5aa0e9;
  const waveAlpha = 0.35;
  const cx = px + TILE_WIDTH / 2;
  const cy = py + TILE_HEIGHT / 2;

  // Draw 3 horizontal wave lines within the diamond
  const waveOffsets = [-0.2, 0, 0.2];
  for (const offset of waveOffsets) {
    const wy = cy + offset * TILE_HEIGHT;
    // Calculate diamond width at this y position
    const distFromCenter = Math.abs(offset * TILE_HEIGHT);
    const halfWidth = (TILE_WIDTH / 2) * (1 - distFromCenter / (TILE_HEIGHT / 2)) * 0.6;
    if (halfWidth > 2) {
      g.moveTo(cx - halfWidth, wy)
        .lineTo(cx + halfWidth, wy)
        .stroke({ width: 1, color: waveColor, alpha: waveAlpha });
    }
  }
}

/** Forest: small dark circles suggesting tree canopy, centered in the diamond. */
function drawForestDetail(g: Graphics, px: number, py: number): void {
  const treeColor = 0x1a4010;
  const treeAlpha = 0.45;
  const cx = px + TILE_WIDTH / 2;
  const cy = py + TILE_HEIGHT / 2;

  g.circle(cx - 6, cy - 2, 6)
    .fill({ color: treeColor, alpha: treeAlpha });
  g.circle(cx + 5, cy + 2, 7)
    .fill({ color: treeColor, alpha: treeAlpha });
}
