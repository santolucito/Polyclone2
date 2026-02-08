/**
 * Shared rendering constants for PolyClone2.
 */

import { TileType } from '../core/types.js';

/** Size of each tile in pixels. */
export const TILE_SIZE = 64;

/** Border width around each tile in pixels. */
export const TILE_BORDER = 1;

/** Map from TileType to fill color (hex number). */
export const TERRAIN_COLORS: Record<TileType, number> = {
  [TileType.Field]:        0x7ec850,
  [TileType.Forest]:       0x2d5a1b,
  [TileType.Mountain]:     0x8b8b8b,
  [TileType.ShallowWater]: 0x4a90d9,
  [TileType.Ocean]:        0x1a5fb4,
};

/**
 * Slightly darker variant of each terrain color, used for borders
 * and visual depth effects.
 */
export const TERRAIN_BORDER_COLORS: Record<TileType, number> = {
  [TileType.Field]:        0x6ab040,
  [TileType.Forest]:       0x1e4012,
  [TileType.Mountain]:     0x6e6e6e,
  [TileType.ShallowWater]: 0x3a78b8,
  [TileType.Ocean]:        0x124a90,
};
