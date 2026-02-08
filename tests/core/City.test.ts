import { describe, it, expect } from 'vitest';
import {
  getPopToNextLevel,
  getCumulativePopForLevel,
  getUnitCapacity,
  getLevelRewards,
  createCity,
  addPopulation,
  canLevelUp,
  levelUp,
  calculateCityIncome,
  getCityTerritory,
  captureCity,
} from '../../src/core/City.js';
import { CityInstance } from '../../src/core/types.js';

describe('City', () => {
  describe('getPopToNextLevel', () => {
    it('should return correct thresholds for levels 1-5', () => {
      expect(getPopToNextLevel(1)).toBe(2);  // Level 1 -> 2: need 2
      expect(getPopToNextLevel(2)).toBe(3);  // Level 2 -> 3: need 3
      expect(getPopToNextLevel(3)).toBe(4);  // Level 3 -> 4: need 4
      expect(getPopToNextLevel(4)).toBe(5);  // Level 4 -> 5: need 5
    });

    it('should extrapolate for levels beyond 5', () => {
      expect(getPopToNextLevel(5)).toBe(6);
      expect(getPopToNextLevel(6)).toBe(7);
    });
  });

  describe('getCumulativePopForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(getCumulativePopForLevel(1)).toBe(0);
    });

    it('should return correct cumulative values', () => {
      expect(getCumulativePopForLevel(2)).toBe(2);   // 2
      expect(getCumulativePopForLevel(3)).toBe(5);   // 2+3
      expect(getCumulativePopForLevel(4)).toBe(9);   // 2+3+4
      expect(getCumulativePopForLevel(5)).toBe(14);  // 2+3+4+5
    });
  });

  describe('getUnitCapacity', () => {
    it('should return level + 1', () => {
      expect(getUnitCapacity(1)).toBe(2);
      expect(getUnitCapacity(2)).toBe(3);
      expect(getUnitCapacity(3)).toBe(4);
      expect(getUnitCapacity(5)).toBe(6);
    });
  });

  describe('getLevelRewards', () => {
    it('should return workshop/explorer for level 2', () => {
      const rewards = getLevelRewards(2);
      expect(rewards.optionA.kind).toBe('workshop');
      expect(rewards.optionB.kind).toBe('explorer');
    });

    it('should return wall/stars for level 3', () => {
      const rewards = getLevelRewards(3);
      expect(rewards.optionA.kind).toBe('cityWall');
      expect(rewards.optionB.kind).toBe('stars');
    });

    it('should return borderGrowth/population for level 4', () => {
      const rewards = getLevelRewards(4);
      expect(rewards.optionA.kind).toBe('borderGrowth');
      expect(rewards.optionB.kind).toBe('population');
    });

    it('should return park/giant for level 5+', () => {
      const rewards5 = getLevelRewards(5);
      expect(rewards5.optionA.kind).toBe('park');
      expect(rewards5.optionB.kind).toBe('superUnit');

      const rewards6 = getLevelRewards(6);
      expect(rewards6.optionA.kind).toBe('park');
      expect(rewards6.optionB.kind).toBe('superUnit');
    });
  });

  describe('createCity', () => {
    it('should create a level 1 city with 0 population', () => {
      const city = createCity('xinxi', { x: 5, y: 5 }, 'TestCity', false);
      expect(city.owner).toBe('xinxi');
      expect(city.position).toEqual({ x: 5, y: 5 });
      expect(city.name).toBe('TestCity');
      expect(city.level).toBe(1);
      expect(city.population).toBe(0);
      expect(city.isCapital).toBe(false);
      expect(city.hasWall).toBe(false);
      expect(city.hasWorkshop).toBe(false);
      expect(city.hasPark).toBe(false);
      expect(city.borderSize).toBe(3);
    });

    it('should create a capital city', () => {
      const city = createCity('imperius', { x: 8, y: 8 }, 'Capital', true);
      expect(city.isCapital).toBe(true);
    });
  });

  describe('addPopulation', () => {
    it('should increase population', () => {
      const city = createCity('xinxi', { x: 0, y: 0 }, 'Test', false);
      const updated = addPopulation(city, 3);
      expect(updated.population).toBe(3);
    });

    it('should not mutate original city', () => {
      const city = createCity('xinxi', { x: 0, y: 0 }, 'Test', false);
      addPopulation(city, 3);
      expect(city.population).toBe(0);
    });
  });

  describe('canLevelUp', () => {
    it('should return false when population is below threshold', () => {
      const city = createCity('xinxi', { x: 0, y: 0 }, 'Test', false);
      expect(canLevelUp(city)).toBe(false);
    });

    it('should return true when population meets threshold', () => {
      const city = addPopulation(
        createCity('xinxi', { x: 0, y: 0 }, 'Test', false),
        2,
      );
      expect(canLevelUp(city)).toBe(true);
    });

    it('should return true when population exceeds threshold', () => {
      const city = addPopulation(
        createCity('xinxi', { x: 0, y: 0 }, 'Test', false),
        5,
      );
      expect(canLevelUp(city)).toBe(true);
    });
  });

  describe('levelUp', () => {
    it('should increase level and subtract required population', () => {
      let city = createCity('xinxi', { x: 0, y: 0 }, 'Test', false);
      city = addPopulation(city, 3); // 3 pop, need 2 for level 2
      const updated = levelUp(city, { kind: 'workshop', description: '+1 SPT' });
      expect(updated.level).toBe(2);
      expect(updated.population).toBe(1); // 3 - 2 = 1 remaining
    });

    it('should apply workshop reward', () => {
      let city = addPopulation(createCity('xinxi', { x: 0, y: 0 }, 'Test', false), 2);
      city = levelUp(city, { kind: 'workshop', description: '+1 SPT' });
      expect(city.hasWorkshop).toBe(true);
    });

    it('should apply wall reward', () => {
      let city = addPopulation(createCity('xinxi', { x: 0, y: 0 }, 'Test', false), 2);
      city = levelUp(city, { kind: 'explorer', description: 'Reveals surrounding map' });
      city = addPopulation(city, 3);
      city = levelUp(city, { kind: 'cityWall', description: '4x defense bonus' });
      expect(city.hasWall).toBe(true);
      expect(city.level).toBe(3);
    });

    it('should apply border growth reward', () => {
      let city = addPopulation(createCity('xinxi', { x: 0, y: 0 }, 'Test', false), 2);
      city = levelUp(city, { kind: 'workshop', description: '+1 SPT' });
      city = addPopulation(city, 3);
      city = levelUp(city, { kind: 'cityWall', description: '4x defense bonus' });
      city = addPopulation(city, 4);
      city = levelUp(city, { kind: 'borderGrowth', description: '3x3 -> 5x5 territory' });
      expect(city.borderSize).toBe(5);
      expect(city.level).toBe(4);
    });

    it('should apply population reward', () => {
      let city = addPopulation(createCity('xinxi', { x: 0, y: 0 }, 'Test', false), 2);
      city = levelUp(city, { kind: 'workshop', description: '+1 SPT' });
      city = addPopulation(city, 3);
      city = levelUp(city, { kind: 'stars', amount: 5, description: 'Immediate stars' });
      city = addPopulation(city, 4);
      city = levelUp(city, { kind: 'population', amount: 3, description: '+3 population' });
      expect(city.population).toBe(3); // 0 remaining + 3 bonus
    });

    it('should apply park reward', () => {
      let city = addPopulation(createCity('xinxi', { x: 0, y: 0 }, 'Test', false), 2);
      city = levelUp(city, { kind: 'workshop', description: '+1 SPT' });
      city = addPopulation(city, 3);
      city = levelUp(city, { kind: 'cityWall', description: '4x defense bonus' });
      city = addPopulation(city, 4);
      city = levelUp(city, { kind: 'borderGrowth', description: '3x3 -> 5x5 territory' });
      city = addPopulation(city, 5);
      city = levelUp(city, { kind: 'park', description: '+1 SPT, +250 pts' });
      expect(city.hasPark).toBe(true);
      expect(city.level).toBe(5);
    });

    it('should not level up if population is insufficient', () => {
      const city = createCity('xinxi', { x: 0, y: 0 }, 'Test', false);
      const result = levelUp(city, { kind: 'workshop', description: '+1 SPT' });
      expect(result).toBe(city); // Same reference, no change
    });
  });

  describe('calculateCityIncome', () => {
    it('should return level for non-capital city', () => {
      const city = createCity('xinxi', { x: 0, y: 0 }, 'Test', false);
      expect(calculateCityIncome(city)).toBe(1);
    });

    it('should add +1 for capital', () => {
      const city = createCity('xinxi', { x: 0, y: 0 }, 'Capital', true);
      expect(calculateCityIncome(city)).toBe(2); // 1 (level) + 1 (capital)
    });

    it('should add +1 for workshop', () => {
      let city = addPopulation(createCity('xinxi', { x: 0, y: 0 }, 'Test', false), 2);
      city = levelUp(city, { kind: 'workshop', description: '+1 SPT' });
      expect(calculateCityIncome(city)).toBe(3); // 2 (level) + 1 (workshop)
    });

    it('should add +1 for park', () => {
      let city: CityInstance = {
        owner: 'xinxi',
        position: { x: 0, y: 0 },
        name: 'Test',
        level: 5,
        population: 0,
        isCapital: false,
        hasWall: false,
        hasWorkshop: false,
        hasPark: true,
        borderSize: 3,
      };
      expect(calculateCityIncome(city)).toBe(6); // 5 (level) + 1 (park)
    });

    it('should stack all bonuses', () => {
      let city: CityInstance = {
        owner: 'xinxi',
        position: { x: 0, y: 0 },
        name: 'Capital',
        level: 5,
        population: 0,
        isCapital: true,
        hasWall: true,
        hasWorkshop: true,
        hasPark: true,
        borderSize: 5,
      };
      expect(calculateCityIncome(city)).toBe(8); // 5 + 1(capital) + 1(workshop) + 1(park)
    });
  });

  describe('getCityTerritory', () => {
    it('should return 9 tiles for border size 3', () => {
      const city = createCity('xinxi', { x: 5, y: 5 }, 'Test', false);
      const territory = getCityTerritory(city);
      expect(territory).toHaveLength(9);
      // Should include the city center
      expect(territory).toContainEqual({ x: 5, y: 5 });
      // Should include corners
      expect(territory).toContainEqual({ x: 4, y: 4 });
      expect(territory).toContainEqual({ x: 6, y: 6 });
    });

    it('should return 25 tiles for border size 5', () => {
      const city: CityInstance = {
        ...createCity('xinxi', { x: 5, y: 5 }, 'Test', false),
        borderSize: 5,
      };
      const territory = getCityTerritory(city);
      expect(territory).toHaveLength(25);
      // Should include far corners
      expect(territory).toContainEqual({ x: 3, y: 3 });
      expect(territory).toContainEqual({ x: 7, y: 7 });
    });
  });

  describe('captureCity', () => {
    it('should change owner and reset upgrades', () => {
      const city: CityInstance = {
        owner: 'xinxi',
        position: { x: 5, y: 5 },
        name: 'Captured',
        level: 3,
        population: 4,
        isCapital: true,
        hasWall: true,
        hasWorkshop: true,
        hasPark: false,
        borderSize: 3,
      };

      const captured = captureCity(city, 'imperius');
      expect(captured.owner).toBe('imperius');
      expect(captured.isCapital).toBe(false);
      expect(captured.hasWall).toBe(false);
      expect(captured.hasWorkshop).toBe(false);
      expect(captured.level).toBe(3); // Level preserved
      expect(captured.population).toBe(4); // Population preserved
    });
  });
});
