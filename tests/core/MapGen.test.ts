import { describe, it, expect } from 'vitest';
import {
  SeededRandom,
  getMapSize,
  placeCapitals,
  placeVillages,
  generateMap,
  countTerrain,
} from '../../src/core/MapGen.js';
import { TileType } from '../../src/core/types.js';
import type { GameConfig } from '../../src/core/types.js';

const TEST_SEED = 42;

function makeConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    mapSize: 16,
    waterLevel: 0.3,
    tribes: ['xinxi', 'imperius'],
    difficulty: 'normal',
    winCondition: 'domination',
    turnLimit: null,
    ...overrides,
  };
}

describe('MapGen', () => {
  describe('SeededRandom', () => {
    it('should produce deterministic sequences', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('should produce values in [0, 1)', () => {
      const rng = new SeededRandom(123);
      for (let i = 0; i < 1000; i++) {
        const val = rng.next();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('should produce different sequences for different seeds', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(99);
      let allSame = true;
      for (let i = 0; i < 10; i++) {
        if (rng1.next() !== rng2.next()) allSame = false;
      }
      expect(allSame).toBe(false);
    });

    it('nextInt should produce integers in range', () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(3, 10);
        expect(val).toBeGreaterThanOrEqual(3);
        expect(val).toBeLessThan(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('shuffle should be deterministic', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      rng1.shuffle(arr1);
      rng2.shuffle(arr2);
      expect(arr1).toEqual(arr2);
    });
  });

  describe('getMapSize', () => {
    it('should return correct sizes', () => {
      expect(getMapSize('tiny')).toBe(11);
      expect(getMapSize('small')).toBe(14);
      expect(getMapSize('normal')).toBe(16);
      expect(getMapSize('large')).toBe(18);
    });
  });

  describe('placeCapitals', () => {
    it('should place one capital per player', () => {
      const rng = new SeededRandom(TEST_SEED);
      const caps = placeCapitals(16, 2, rng);
      expect(caps).toHaveLength(2);
    });

    it('should place at most 4 capitals', () => {
      const rng = new SeededRandom(TEST_SEED);
      const caps = placeCapitals(16, 4, rng);
      expect(caps).toHaveLength(4);
    });

    it('should place capitals within map bounds', () => {
      const rng = new SeededRandom(TEST_SEED);
      const caps = placeCapitals(16, 4, rng);
      for (const cap of caps) {
        expect(cap.x).toBeGreaterThanOrEqual(0);
        expect(cap.x).toBeLessThan(16);
        expect(cap.y).toBeGreaterThanOrEqual(0);
        expect(cap.y).toBeLessThan(16);
      }
    });

    it('should place capitals in separate quadrants', () => {
      const rng = new SeededRandom(TEST_SEED);
      const caps = placeCapitals(16, 4, rng);
      const half = 8;

      // Check each capital is in a different quadrant
      const quadrants = caps.map(c => {
        const qx = c.x < half ? 0 : 1;
        const qy = c.y < half ? 0 : 1;
        return `${qx},${qy}`;
      });
      const uniqueQuadrants = new Set(quadrants);
      expect(uniqueQuadrants.size).toBe(4);
    });
  });

  describe('placeVillages', () => {
    it('should place villages away from capitals', () => {
      const rng = new SeededRandom(TEST_SEED);
      const capitals = [{ x: 4, y: 4 }, { x: 12, y: 12 }];
      const villages = placeVillages(16, capitals, rng);

      for (const v of villages) {
        for (const c of capitals) {
          const dist = Math.max(Math.abs(v.x - c.x), Math.abs(v.y - c.y));
          expect(dist).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it('should place villages within map bounds with edge margin', () => {
      const rng = new SeededRandom(TEST_SEED);
      const capitals = [{ x: 4, y: 4 }];
      const villages = placeVillages(16, capitals, rng);

      for (const v of villages) {
        expect(v.x).toBeGreaterThanOrEqual(3);
        expect(v.x).toBeLessThan(13);
        expect(v.y).toBeGreaterThanOrEqual(3);
        expect(v.y).toBeLessThan(13);
      }
    });

    it('should place villages at least 2 apart from each other', () => {
      const rng = new SeededRandom(TEST_SEED);
      const capitals = [{ x: 4, y: 4 }];
      const villages = placeVillages(16, capitals, rng);

      for (let i = 0; i < villages.length; i++) {
        for (let j = i + 1; j < villages.length; j++) {
          const dist = Math.max(
            Math.abs(villages[i].x - villages[j].x),
            Math.abs(villages[i].y - villages[j].y),
          );
          expect(dist).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  describe('generateMap', () => {
    it('should produce a map of the correct size', () => {
      const result = generateMap(makeConfig({ mapSize: 16 }), TEST_SEED);
      expect(result.map.width).toBe(16);
      expect(result.map.height).toBe(16);
    });

    it('should be deterministic with the same seed', () => {
      const result1 = generateMap(makeConfig(), TEST_SEED);
      const result2 = generateMap(makeConfig(), TEST_SEED);

      const counts1 = countTerrain(result1.map);
      const counts2 = countTerrain(result2.map);
      expect(counts1).toEqual(counts2);
      expect(result1.capitals).toEqual(result2.capitals);
    });

    it('should produce different maps with different seeds', () => {
      const result1 = generateMap(makeConfig(), 42);
      const result2 = generateMap(makeConfig(), 99);

      const counts1 = countTerrain(result1.map);
      const counts2 = countTerrain(result2.map);
      // Very unlikely to be exactly the same
      const same = Object.keys(counts1).every(
        k => counts1[k as TileType] === counts2[k as TileType],
      );
      expect(same).toBe(false);
    });

    it('should have water tiles when waterLevel > 0', () => {
      const result = generateMap(makeConfig({ waterLevel: 0.3 }), TEST_SEED);
      const counts = countTerrain(result.map);
      const waterTiles = counts[TileType.ShallowWater] + counts[TileType.Ocean];
      expect(waterTiles).toBeGreaterThan(0);
    });

    it('should have no water tiles when waterLevel = 0', () => {
      const result = generateMap(makeConfig({ waterLevel: 0 }), TEST_SEED);
      const counts = countTerrain(result.map);
      expect(counts[TileType.ShallowWater]).toBe(0);
      expect(counts[TileType.Ocean]).toBe(0);
    });

    it('should have forests and mountains', () => {
      const result = generateMap(makeConfig({ waterLevel: 0 }), TEST_SEED);
      const counts = countTerrain(result.map);
      expect(counts[TileType.Forest]).toBeGreaterThan(0);
      expect(counts[TileType.Mountain]).toBeGreaterThan(0);
    });

    it('should keep capital tiles as field', () => {
      const result = generateMap(makeConfig(), TEST_SEED);
      for (const cap of result.capitals) {
        const tile = result.map.getTile(cap.x, cap.y);
        expect(tile).not.toBeNull();
        expect(tile!.type).toBe(TileType.Field);
      }
    });

    it('should return correct number of capitals', () => {
      const result2 = generateMap(makeConfig({ tribes: ['xinxi', 'imperius'] }), TEST_SEED);
      expect(result2.capitals).toHaveLength(2);

      const result4 = generateMap(makeConfig({ tribes: ['xinxi', 'imperius', 'bardur', 'oumaji'] }), TEST_SEED);
      expect(result4.capitals).toHaveLength(4);
    });

    it('should work with all map sizes', () => {
      for (const size of [11, 14, 16, 18]) {
        const result = generateMap(makeConfig({ mapSize: size }), TEST_SEED);
        expect(result.map.width).toBe(size);
        expect(result.map.height).toBe(size);
      }
    });

    it('oumaji maps should have fewer forests', () => {
      const oumaji = generateMap(makeConfig({ tribes: ['oumaji', 'oumaji'], waterLevel: 0 }), TEST_SEED);
      const bardur = generateMap(makeConfig({ tribes: ['bardur', 'bardur'], waterLevel: 0 }), TEST_SEED);

      const oumajiCounts = countTerrain(oumaji.map);
      const bardurCounts = countTerrain(bardur.map);

      // Oumaji has 0.2x forest modifier vs Bardur's 0.8x, so should have fewer forests
      expect(oumajiCounts[TileType.Forest]).toBeLessThan(bardurCounts[TileType.Forest]);
    });
  });

  describe('countTerrain', () => {
    it('should count all tiles correctly', () => {
      const result = generateMap(makeConfig(), TEST_SEED);
      const counts = countTerrain(result.map);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      expect(total).toBe(16 * 16); // All tiles accounted for
    });
  });
});
