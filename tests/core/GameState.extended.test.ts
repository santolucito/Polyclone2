/**
 * Tests for extended GameState functionality:
 * Income collection, combat execution, tech research, unit training, cities.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../src/core/GameState.js';
import { GameMap } from '../../src/core/GameMap.js';
import { createCity } from '../../src/core/City.js';
import { createUnit, resetUnitIdCounter } from '../../src/core/UnitFactory.js';
import { TileType, UnitType } from '../../src/core/types.js';
import type { GameConfig, CityInstance } from '../../src/core/types.js';

function makeConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    mapSize: 8,
    waterLevel: 0,
    tribes: ['xinxi', 'imperius'],
    difficulty: 'normal',
    winCondition: 'domination',
    turnLimit: null,
    ...overrides,
  };
}

function makeGameState(config?: GameConfig): GameState {
  const cfg = config ?? makeConfig();
  const map = GameMap.create(cfg.mapSize, cfg.mapSize, TileType.Field);
  return new GameState(map, cfg);
}

describe('GameState — Star Economy', () => {
  beforeEach(() => resetUnitIdCounter());

  it('starts each player with 5 stars', () => {
    const gs = makeGameState();
    expect(gs.getStars(0)).toBe(5);
    expect(gs.getStars(1)).toBe(5);
  });

  it('spendStars deducts and returns true', () => {
    const gs = makeGameState();
    expect(gs.spendStars(0, 3)).toBe(true);
    expect(gs.getStars(0)).toBe(2);
  });

  it('spendStars rejects insufficient funds', () => {
    const gs = makeGameState();
    expect(gs.spendStars(0, 10)).toBe(false);
    expect(gs.getStars(0)).toBe(5);
  });

  it('addStars increases balance', () => {
    const gs = makeGameState();
    gs.addStars(0, 7);
    expect(gs.getStars(0)).toBe(12);
  });

  it('collectIncome on endTurn adds city income', () => {
    const gs = makeGameState();
    const capital = createCity('xinxi', { x: 0, y: 0 }, 'Test Capital', true);
    gs.addCity(capital);

    // Player 0 starts with 5 stars. End turn advances to player 1, who gets income.
    // Player 1 has no cities but gets AI difficulty bonus (normal = +2).
    gs.endTurn(); // now player 1's turn
    expect(gs.getStars(1)).toBe(5 + 2); // 5 starting + 2 AI bonus (normal)

    // End turn again -> player 0's turn with capital income
    gs.endTurn(); // now player 0's turn
    // Capital level 1 = 1 SPT base + 1 capital bonus = 2 SPT
    expect(gs.getStars(0)).toBe(5 + 2);
  });

  it('workshop adds +1 to city income', () => {
    const gs = makeGameState();
    const capital: CityInstance = {
      ...createCity('xinxi', { x: 0, y: 0 }, 'Capital', true),
      hasWorkshop: true,
    };
    gs.addCity(capital);

    expect(gs.getIncome(0)).toBe(3); // 1 base + 1 capital + 1 workshop
  });

  it('AI difficulty bonus varies by setting', () => {
    const easy = makeGameState(makeConfig({ difficulty: 'easy' }));
    const crazy = makeGameState(makeConfig({ difficulty: 'crazy' }));

    expect(easy.getIncome(1)).toBe(1); // AI bonus only: easy = +1
    expect(crazy.getIncome(1)).toBe(5); // AI bonus only: crazy = +5
  });

  it('human player (0) gets no difficulty bonus', () => {
    const gs = makeGameState();
    expect(gs.getIncome(0)).toBe(0); // No cities, no bonus
  });
});

describe('GameState — Cities', () => {
  beforeEach(() => resetUnitIdCounter());

  it('addCity and getCityAt', () => {
    const gs = makeGameState();
    const city = createCity('xinxi', { x: 3, y: 4 }, 'Test', false);
    gs.addCity(city);
    expect(gs.getCityAt(3, 4)).toBeDefined();
    expect(gs.getCityAt(0, 0)).toBeUndefined();
  });

  it('getCitiesForPlayer returns correct cities', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 0, y: 0 }, 'A', true));
    gs.addCity(createCity('imperius', { x: 5, y: 5 }, 'B', true));
    gs.addCity(createCity('xinxi', { x: 2, y: 2 }, 'C', false));

    expect(gs.getCitiesForPlayer('xinxi')).toHaveLength(2);
    expect(gs.getCitiesForPlayer('imperius')).toHaveLength(1);
  });

  it('getCityCountForPlayer uses player index', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 0, y: 0 }, 'A', true));
    gs.addCity(createCity('xinxi', { x: 2, y: 2 }, 'B', false));

    expect(gs.getCityCountForPlayer(0)).toBe(2); // xinxi = player 0
    expect(gs.getCityCountForPlayer(1)).toBe(0); // imperius = player 1
  });

  it('levelUpCity applies reward', () => {
    const gs = makeGameState();
    // Create city with enough pop to level up
    const city: CityInstance = {
      ...createCity('xinxi', { x: 0, y: 0 }, 'Capital', true),
      population: 2, // Need 2 to level up from level 1
    };
    gs.addCity(city);

    const result = gs.levelUpCity(0, 0, { kind: 'workshop', description: '+1 SPT' });
    expect(result).toBeDefined();

    const updated = gs.getCityAt(0, 0);
    expect(updated?.level).toBe(2);
    expect(updated?.hasWorkshop).toBe(true);
  });

  it('levelUpCity with stars reward adds stars', () => {
    const gs = makeGameState();
    const city: CityInstance = {
      ...createCity('xinxi', { x: 0, y: 0 }, 'Capital', true),
      level: 2,
      population: 3, // Need 3 to level up from 2
    };
    gs.addCity(city);

    const starsBefore = gs.getStars(0);
    gs.levelUpCity(0, 0, { kind: 'stars', amount: 5, description: 'Immediate stars' });
    expect(gs.getStars(0)).toBe(starsBefore + 5);
  });
});

describe('GameState — Combat Execution', () => {
  beforeEach(() => resetUnitIdCounter());

  it('attackUnit deals damage and marks hasAttacked', () => {
    const gs = makeGameState();
    const attacker = createUnit(UnitType.Warrior, 0, 0, 0);
    const defender = createUnit(UnitType.Warrior, 1, 1, 0);
    gs.addUnit(attacker);
    gs.addUnit(defender);

    const result = gs.attackUnit(attacker.id, 1, 0);
    expect(result).toBeDefined();
    expect(result!.damageToDefender).toBeGreaterThan(0);

    // Attacker should be marked as having attacked
    const updated = gs.getUnit(attacker.id);
    if (updated) {
      expect(updated.hasAttacked).toBe(true);
    }
  });

  it('attackUnit removes dead defender', () => {
    const gs = makeGameState();
    // Create a strong attacker vs weak defender
    const attacker = createUnit(UnitType.Swordsman, 0, 0, 0);
    // Give the defender low HP by creating and then we'll attack multiple times
    const defender = createUnit(UnitType.Warrior, 1, 1, 0);
    gs.addUnit(attacker);
    gs.addUnit(defender);

    // Swordsman (ATK 3, DEF 3) vs Warrior (ATK 2, DEF 2) - likely kills on first hit
    const result = gs.attackUnit(attacker.id, 1, 0);
    expect(result).toBeDefined();

    if (result!.defenderKilled) {
      expect(gs.getUnitAt(1, 0)).toBeUndefined();
    } else {
      // Defender survived but took damage
      const def = gs.getUnit(defender.id);
      expect(def).toBeDefined();
      expect(def!.currentHp).toBeLessThan(defender.currentHp);
    }
  });

  it('attackUnit with retaliation damages attacker', () => {
    const gs = makeGameState();
    const attacker = createUnit(UnitType.Warrior, 0, 0, 0); // range 1
    const defender = createUnit(UnitType.Warrior, 1, 1, 0); // range 1, can retaliate
    gs.addUnit(attacker);
    gs.addUnit(defender);

    const result = gs.attackUnit(attacker.id, 1, 0);
    expect(result).toBeDefined();

    if (!result!.defenderKilled) {
      // If defender survived, it should have retaliated
      expect(result!.damageToAttacker).toBeGreaterThan(0);
    }
  });

  it('rejects attack on friendly unit', () => {
    const gs = makeGameState();
    const u1 = createUnit(UnitType.Warrior, 0, 0, 0);
    const u2 = createUnit(UnitType.Warrior, 0, 1, 0);
    gs.addUnit(u1);
    gs.addUnit(u2);

    expect(gs.attackUnit(u1.id, 1, 0)).toBeUndefined();
  });

  it('rejects attack out of range', () => {
    const gs = makeGameState();
    const attacker = createUnit(UnitType.Warrior, 0, 0, 0); // range 1
    const defender = createUnit(UnitType.Warrior, 1, 3, 0); // 3 tiles away
    gs.addUnit(attacker);
    gs.addUnit(defender);

    expect(gs.attackUnit(attacker.id, 3, 0)).toBeUndefined();
  });

  it('rejects attack if unit already attacked', () => {
    const gs = makeGameState();
    const attacker = createUnit(UnitType.Warrior, 0, 0, 0);
    const d1 = createUnit(UnitType.Warrior, 1, 1, 0);
    const d2 = createUnit(UnitType.Warrior, 1, 0, 1);
    gs.addUnit(attacker);
    gs.addUnit(d1);
    gs.addUnit(d2);

    gs.attackUnit(attacker.id, 1, 0);
    // Second attack should be rejected
    expect(gs.attackUnit(attacker.id, 0, 1)).toBeUndefined();
  });

  it('city defense bonus affects combat', () => {
    const gs = makeGameState();
    const attacker = createUnit(UnitType.Warrior, 0, 0, 0);
    const defender = createUnit(UnitType.Warrior, 1, 1, 0);
    gs.addUnit(attacker);
    gs.addUnit(defender);

    // Place a city with wall at defender position
    const city: CityInstance = {
      ...createCity('imperius', { x: 1, y: 0 }, 'Fortress', false),
      hasWall: true,
    };
    gs.addCity(city);

    const result = gs.attackUnit(attacker.id, 1, 0);
    expect(result).toBeDefined();
    // With 4x wall defense, attacker should do less damage
    // Warrior ATK 2, DEF 2, at full HP, wall = 4.0x defense bonus
    // The damage should be significantly less
    expect(result!.damageToDefender).toBeLessThan(10);
  });
});

describe('GameState — Tech Research', () => {
  beforeEach(() => resetUnitIdCounter());

  it('player starts with tribe starting tech', () => {
    const gs = makeGameState();
    expect(gs.getTechState(0).hasResearched('climbing')).toBe(true); // xinxi
    expect(gs.getTechState(1).hasResearched('organization')).toBe(true); // imperius
  });

  it('researchTech succeeds with enough stars', () => {
    const gs = makeGameState();
    // Xinxi starts with climbing. Mining requires climbing (tier 2).
    // Cost = tier(2) * numCities(1) + 4 = 6
    gs.addCity(createCity('xinxi', { x: 0, y: 0 }, 'Capital', true));
    gs.addStars(0, 10); // Give extra stars

    expect(gs.researchTech(0, 'mining')).toBe(true);
    expect(gs.getTechState(0).hasResearched('mining')).toBe(true);
  });

  it('researchTech deducts correct cost', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 0, y: 0 }, 'Capital', true));

    const starsBefore = gs.getStars(0);
    const cost = gs.getTechCost(0, 'mining'); // tier 2 * 1 city + 4 = 6
    expect(cost).toBe(6);

    gs.addStars(0, 10);
    gs.researchTech(0, 'mining');
    expect(gs.getStars(0)).toBe(starsBefore + 10 - cost);
  });

  it('researchTech rejects missing prerequisite', () => {
    const gs = makeGameState();
    // Player 0 (xinxi) has climbing. Try to research smithery which needs mining first.
    gs.addStars(0, 100);
    expect(gs.researchTech(0, 'smithery')).toBe(false);
  });

  it('researchTech rejects insufficient stars', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 0, y: 0 }, 'Capital', true));
    // Start with 5, mining costs 6
    expect(gs.researchTech(0, 'mining')).toBe(false);
    expect(gs.getTechState(0).hasResearched('mining')).toBe(false);
  });

  it('researchTech rejects already researched', () => {
    const gs = makeGameState();
    gs.addStars(0, 100);
    expect(gs.researchTech(0, 'climbing')).toBe(false); // Already have it
  });
});

describe('GameState — Unit Training', () => {
  beforeEach(() => resetUnitIdCounter());

  it('trainUnit creates a warrior at city', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 3, y: 3 }, 'Capital', true));
    gs.addStars(0, 10);

    const unit = gs.trainUnit(3, 3, UnitType.Warrior);
    expect(unit).toBeDefined();
    expect(unit!.type).toBe(UnitType.Warrior);
    expect(unit!.x).toBe(3);
    expect(unit!.y).toBe(3);
    expect(unit!.owner).toBe(0);
  });

  it('trainUnit deducts star cost', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 3, y: 3 }, 'Capital', true));
    gs.addStars(0, 10);

    const before = gs.getStars(0);
    gs.trainUnit(3, 3, UnitType.Warrior);
    expect(gs.getStars(0)).toBe(before - 2); // Warrior costs 2
  });

  it('trainUnit rejects without city', () => {
    const gs = makeGameState();
    gs.addStars(0, 10);
    expect(gs.trainUnit(3, 3, UnitType.Warrior)).toBeUndefined();
  });

  it('trainUnit rejects occupied tile', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 3, y: 3 }, 'Capital', true));
    gs.addStars(0, 10);

    gs.trainUnit(3, 3, UnitType.Warrior); // First unit
    expect(gs.trainUnit(3, 3, UnitType.Warrior)).toBeUndefined(); // Tile occupied
  });

  it('trainUnit rejects without tech unlock', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 3, y: 3 }, 'Capital', true));
    gs.addStars(0, 100);

    // Xinxi has climbing, not archery. Archer requires archery tech.
    expect(gs.trainUnit(3, 3, UnitType.Archer)).toBeUndefined();
  });

  it('trainUnit rejects insufficient stars', () => {
    const gs = makeGameState();
    gs.addCity(createCity('xinxi', { x: 3, y: 3 }, 'Capital', true));
    // Start with 5 stars, warrior costs 2, try to buy 3 warriors (6 total)
    gs.trainUnit(3, 3, UnitType.Warrior); // 5 - 2 = 3
    gs.removeUnit(gs.getUnitAt(3, 3)!.id); // Clear tile
    gs.trainUnit(3, 3, UnitType.Warrior); // 3 - 2 = 1
    gs.removeUnit(gs.getUnitAt(3, 3)!.id);
    expect(gs.trainUnit(3, 3, UnitType.Warrior)).toBeUndefined(); // 1 star left, need 2
  });

  it('trainUnit rejects non-current player city', () => {
    const gs = makeGameState();
    gs.addCity(createCity('imperius', { x: 3, y: 3 }, 'Enemy Capital', true));
    gs.addStars(0, 10);
    // Player 0 (xinxi) trying to train at player 1 (imperius) city
    expect(gs.trainUnit(3, 3, UnitType.Warrior)).toBeUndefined();
  });

  it('trainUnit allows rider for oumaji (has riding tech)', () => {
    const gs = makeGameState(makeConfig({ tribes: ['oumaji', 'imperius'] }));
    gs.addCity(createCity('oumaji', { x: 3, y: 3 }, 'Capital', true));
    gs.addStars(0, 10);

    const unit = gs.trainUnit(3, 3, UnitType.Rider);
    expect(unit).toBeDefined();
    expect(unit!.type).toBe(UnitType.Rider);
  });
});

describe('GameState — Tribe / Player mapping', () => {
  beforeEach(() => resetUnitIdCounter());

  it('getTribeForPlayer returns correct tribe', () => {
    const gs = makeGameState();
    expect(gs.getTribeForPlayer(0)).toBe('xinxi');
    expect(gs.getTribeForPlayer(1)).toBe('imperius');
  });

  it('getPlayerForTribe returns correct index', () => {
    const gs = makeGameState();
    expect(gs.getPlayerForTribe('xinxi')).toBe(0);
    expect(gs.getPlayerForTribe('imperius')).toBe(1);
  });
});

describe('GameState — Win Condition', () => {
  beforeEach(() => resetUnitIdCounter());

  it('no winner at game start', () => {
    const gs = makeGameState();
    expect(gs.getWinner()).toBe(-1);
  });

  it('detects winner when one player has no cities or units', () => {
    const gs = makeGameState();
    // Player 0 has a city and unit
    gs.addCity(createCity('xinxi', { x: 0, y: 0 }, 'Capital', true));
    gs.addUnit(createUnit(UnitType.Warrior, 0, 1, 0));
    // Player 1 has a unit only
    gs.addUnit(createUnit(UnitType.Warrior, 1, 5, 5));

    // Remove player 1's unit
    const p1Units = gs.getUnitsForPlayer(1);
    for (const u of p1Units) gs.removeUnit(u.id);

    // End turn to trigger win check
    gs.endTurn();
    gs.endTurn();

    expect(gs.getWinner()).toBe(0);
  });
});
