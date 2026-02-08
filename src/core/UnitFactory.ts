/**
 * Factory for creating UnitInstance objects with correct base stats.
 * Pure TypeScript -- no browser or rendering dependencies.
 */

import { UnitType, UnitSkill, UnitInstance, UnitStats } from './types.js';

/**
 * Hardcoded base stats for each unit type.
 * These match the data in /src/assets/data/units.json.
 */
const UNIT_BASE_STATS: Record<UnitType, UnitStats> = {
  [UnitType.Warrior]: {
    cost: 2,
    hp: 10,
    atk: 2,
    def: 2,
    movement: 1,
    range: 1,
    skills: [UnitSkill.Dash, UnitSkill.Fortify],
  },
  [UnitType.Archer]: {
    cost: 3,
    hp: 10,
    atk: 2,
    def: 1,
    movement: 1,
    range: 2,
    skills: [UnitSkill.Dash, UnitSkill.Fortify],
  },
  [UnitType.Defender]: {
    cost: 3,
    hp: 15,
    atk: 1,
    def: 3,
    movement: 1,
    range: 1,
    skills: [UnitSkill.Fortify],
  },
  [UnitType.Rider]: {
    cost: 3,
    hp: 10,
    atk: 2,
    def: 1,
    movement: 2,
    range: 1,
    skills: [UnitSkill.Dash, UnitSkill.Escape, UnitSkill.Fortify],
  },
  [UnitType.Swordsman]: {
    cost: 5,
    hp: 15,
    atk: 3,
    def: 3,
    movement: 1,
    range: 1,
    skills: [UnitSkill.Dash],
  },
  [UnitType.MindBender]: {
    cost: 5,
    hp: 10,
    atk: 0,
    def: 1,
    movement: 1,
    range: 1,
    skills: [UnitSkill.Heal, UnitSkill.Convert, UnitSkill.Stiff],
  },
  [UnitType.Catapult]: {
    cost: 8,
    hp: 10,
    atk: 4,
    def: 0,
    movement: 1,
    range: 3,
    skills: [UnitSkill.Stiff],
  },
  [UnitType.Knight]: {
    cost: 8,
    hp: 10,
    atk: 3.5,
    def: 1,
    movement: 3,
    range: 1,
    skills: [UnitSkill.Dash, UnitSkill.Persist, UnitSkill.Fortify],
  },
  [UnitType.Cloak]: {
    cost: 8,
    hp: 5,
    atk: 0,
    def: 0.5,
    movement: 2,
    range: 1,
    skills: [UnitSkill.Hide, UnitSkill.Creep, UnitSkill.Infiltrate, UnitSkill.Dash, UnitSkill.Stiff, UnitSkill.Scout],
  },
  [UnitType.Giant]: {
    cost: null,
    hp: 40,
    atk: 5,
    def: 4,
    movement: 1,
    range: 1,
    skills: [],
  },
  [UnitType.Raft]: {
    cost: 0,
    hp: null,
    atk: 0,
    def: 1,
    movement: 2,
    range: 0,
    skills: [UnitSkill.Water, UnitSkill.Carry, UnitSkill.Stiff],
  },
  [UnitType.Scout]: {
    cost: 5,
    hp: null,
    atk: 2,
    def: 1,
    movement: 3,
    range: 2,
    skills: [UnitSkill.Water, UnitSkill.Dash, UnitSkill.Carry, UnitSkill.Scout],
  },
  [UnitType.Rammer]: {
    cost: 5,
    hp: null,
    atk: 3,
    def: 3,
    movement: 3,
    range: 1,
    skills: [UnitSkill.Water, UnitSkill.Dash, UnitSkill.Carry],
  },
  [UnitType.Bomber]: {
    cost: 15,
    hp: null,
    atk: 3,
    def: 2,
    movement: 2,
    range: 3,
    skills: [UnitSkill.Water, UnitSkill.Carry, UnitSkill.Splash, UnitSkill.Stiff],
  },
};

/** Auto-incrementing counter for unit IDs. */
let nextUnitId = 1;

/** Reset the ID counter (useful for tests). */
export function resetUnitIdCounter(): void {
  nextUnitId = 1;
}

/**
 * Returns the base stats for a given unit type.
 */
export function getUnitBaseStats(type: UnitType): UnitStats {
  return UNIT_BASE_STATS[type];
}

/**
 * Creates a new UnitInstance of the given type, positioned at (x, y),
 * owned by the specified player.
 */
export function createUnit(
  type: UnitType,
  owner: number,
  x: number,
  y: number,
): UnitInstance {
  const stats = UNIT_BASE_STATS[type];
  const hp = stats.hp ?? 10; // Naval units with null HP default to 10

  const id = `unit-${nextUnitId++}`;

  return {
    id,
    type,
    owner,
    x,
    y,
    currentHp: hp,
    maxHp: hp,
    atk: stats.atk,
    def: stats.def,
    movement: stats.movement,
    range: stats.range,
    kills: 0,
    isVeteran: false,
    hasMoved: false,
    hasAttacked: false,
    isHidden: false,
    skills: stats.skills,
  };
}
