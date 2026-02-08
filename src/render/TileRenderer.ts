/**
 * Renders individual map tiles as colored rectangles using PixiJS 8 Graphics.
 *
 * Each tile is a 64x64 pixel square with:
 *   - A fill color determined by terrain type
 *   - A 1px border in a slightly darker shade
 *   - Optional visual depth details (mountain shading, water wave lines)
 */

import { Graphics } from 'pixi.js';
import { TileType } from '../core/types.js';
import type { Tile } from '../core/types.js';
import {
  TILE_SIZE,
  TILE_BORDER,
  TERRAIN_COLORS,
  TERRAIN_BORDER_COLORS,
} from './constants.js';

/**
 * Creates a PixiJS Graphics object representing the given tile.
 * The graphic is positioned at (tile.x * TILE_SIZE, tile.y * TILE_SIZE).
 */
export function createTileGraphic(tile: Tile): Graphics {
  const g = new Graphics();
  const px = tile.x * TILE_SIZE;
  const py = tile.y * TILE_SIZE;

  const fillColor = TERRAIN_COLORS[tile.type];
  const borderColor = TERRAIN_BORDER_COLORS[tile.type];

  // Base rectangle with border
  g.rect(px, py, TILE_SIZE, TILE_SIZE)
    .fill({ color: fillColor })
    .stroke({ width: TILE_BORDER, color: borderColor });

  // Add visual depth details per terrain type
  addTerrainDetails(g, tile.type, px, py);

  return g;
}

/**
 * Adds subtle visual depth effects on top of the base tile rectangle.
 * These are simple geometric hints -- no sprites needed.
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
      // No extra detail for fields
      break;
  }
}

/** Mountains: a darker band at the bottom to suggest shadow / depth. */
function drawMountainDetail(g: Graphics, px: number, py: number): void {
  const shadowHeight = 12;
  g.rect(px + TILE_BORDER, py + TILE_SIZE - shadowHeight, TILE_SIZE - TILE_BORDER * 2, shadowHeight - TILE_BORDER)
    .fill({ color: 0x6e6e6e, alpha: 0.4 });

  // Simple triangle peak in the center
  const cx = px + TILE_SIZE / 2;
  const topY = py + 10;
  const baseY = py + TILE_SIZE - shadowHeight;
  const halfW = 16;

  g.moveTo(cx, topY)
    .lineTo(cx + halfW, baseY)
    .lineTo(cx - halfW, baseY)
    .closePath()
    .fill({ color: 0xa0a0a0, alpha: 0.5 });
}

/** Water: subtle horizontal wave lines. */
function drawWaterWaves(
  g: Graphics,
  type: TileType,
  px: number,
  py: number,
): void {
  const waveColor = type === TileType.Ocean ? 0x2470c4 : 0x5aa0e9;
  const waveAlpha = 0.35;
  const waveCount = 3;
  const margin = 8;
  const spacing = (TILE_SIZE - margin * 2) / (waveCount + 1);

  for (let i = 1; i <= waveCount; i++) {
    const wy = py + margin + spacing * i;
    g.moveTo(px + margin, wy)
      .lineTo(px + TILE_SIZE - margin, wy)
      .stroke({ width: 1, color: waveColor, alpha: waveAlpha });
  }
}

/** Forest: a pair of small dark circles suggesting tree canopy. */
function drawForestDetail(g: Graphics, px: number, py: number): void {
  const treeColor = 0x1a4010;
  const treeAlpha = 0.45;

  // Two overlapping circles for tree canopy
  g.circle(px + TILE_SIZE * 0.35, py + TILE_SIZE * 0.4, 10)
    .fill({ color: treeColor, alpha: treeAlpha });
  g.circle(px + TILE_SIZE * 0.6, py + TILE_SIZE * 0.55, 12)
    .fill({ color: treeColor, alpha: treeAlpha });
}
