import { describe, it, expect } from 'vitest';
import {
  TILE_WIDTH,
  TILE_HEIGHT,
  gridToIso,
  gridToIsoCenter,
  isoToGrid,
  getIsoBounds,
  getDiamondVertices,
} from '../../src/render/CoordinateUtils.js';

describe('CoordinateUtils', () => {
  const MAP_SIZE = 16;

  describe('gridToIso', () => {
    it('should convert (0,0) correctly', () => {
      const { px, py } = gridToIso(0, 0, MAP_SIZE);
      // originOffsetX = (16-1) * 32 = 480
      expect(px).toBe(480);
      expect(py).toBe(0);
    });

    it('should convert (0, mapHeight-1) to the left edge', () => {
      const { px, py } = gridToIso(0, MAP_SIZE - 1, MAP_SIZE);
      // px = (0 - 15) * 32 + 480 = -480 + 480 = 0
      expect(px).toBe(0);
      expect(py).toBe(15 * TILE_HEIGHT / 2);
    });

    it('should convert (mapWidth-1, 0) to the right edge', () => {
      const { px, py } = gridToIso(MAP_SIZE - 1, 0, MAP_SIZE);
      // px = (15 - 0) * 32 + 480 = 480 + 480 = 960
      expect(px).toBe(960);
      expect(py).toBe(15 * TILE_HEIGHT / 2);
    });
  });

  describe('gridToIsoCenter', () => {
    it('should return center of diamond', () => {
      const { cx, cy } = gridToIsoCenter(0, 0, MAP_SIZE);
      const { px, py } = gridToIso(0, 0, MAP_SIZE);
      // The iso center corresponds to grid (gx+0.5, gy+0.5).
      // Due to the iso subtraction, the +0.5 offsets cancel in X: cx = px.
      // In Y they add: cy = py + TILE_HEIGHT/2.
      expect(cx).toBe(px);
      expect(cy).toBe(py + TILE_HEIGHT / 2);
    });
  });

  describe('isoToGrid round-trip', () => {
    it('should round-trip for all grid positions (center of tile)', () => {
      for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
          const { cx, cy } = gridToIsoCenter(x, y, MAP_SIZE);
          const result = isoToGrid(cx, cy, MAP_SIZE, MAP_SIZE);
          expect(result, `Round-trip failed for (${x},${y})`).not.toBeNull();
          expect(result!.x, `x mismatch for grid (${x},${y})`).toBe(x);
          expect(result!.y, `y mismatch for grid (${x},${y})`).toBe(y);
        }
      }
    });

    it('should return null for out-of-bounds pixels', () => {
      // Far negative
      expect(isoToGrid(-100, -100, MAP_SIZE, MAP_SIZE)).toBeNull();
      // Far positive
      expect(isoToGrid(5000, 5000, MAP_SIZE, MAP_SIZE)).toBeNull();
    });
  });

  describe('getIsoBounds', () => {
    it('should return correct dimensions for 16x16 map', () => {
      const bounds = getIsoBounds(MAP_SIZE, MAP_SIZE);
      // (16+16) * 32 = 1024
      expect(bounds.width).toBe(1024);
      // (16+16) * 16 = 512
      expect(bounds.height).toBe(512);
    });

    it('should handle non-square maps', () => {
      const bounds = getIsoBounds(8, 12);
      expect(bounds.width).toBe((8 + 12) * TILE_WIDTH / 2);
      expect(bounds.height).toBe((8 + 12) * TILE_HEIGHT / 2);
    });
  });

  describe('getDiamondVertices', () => {
    it('should return 4 vertices forming a diamond', () => {
      const [top, right, bottom, left] = getDiamondVertices(100, 50);
      // Top vertex: center-x, top-y
      expect(top.x).toBe(100 + TILE_WIDTH / 2);
      expect(top.y).toBe(50);
      // Right vertex
      expect(right.x).toBe(100 + TILE_WIDTH);
      expect(right.y).toBe(50 + TILE_HEIGHT / 2);
      // Bottom vertex
      expect(bottom.x).toBe(100 + TILE_WIDTH / 2);
      expect(bottom.y).toBe(50 + TILE_HEIGHT);
      // Left vertex
      expect(left.x).toBe(100);
      expect(left.y).toBe(50 + TILE_HEIGHT / 2);
    });
  });
});
