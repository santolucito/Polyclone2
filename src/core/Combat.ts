/**
 * Deterministic combat resolver for PolyClone2.
 * Pure TypeScript — no browser or rendering dependencies.
 *
 * Implements the Polytopia combat formula from docs/design/game-mechanics.md.
 */

import { UnitInstance, UnitSkill, TileType } from './types.js';

/** Result of resolving a single attack action. */
export interface CombatResult {
  /** Damage dealt to the defender. */
  readonly damageToDefender: number;
  /** Retaliation damage dealt to the attacker (0 if no retaliation). */
  readonly damageToAttacker: number;
  /** Whether the defender was killed. */
  readonly defenderKilled: boolean;
  /** Whether the attacker was killed by retaliation. */
  readonly attackerKilled: boolean;
  /** Updated attacker state after combat. */
  readonly attacker: UnitInstance;
  /** Updated defender state after combat (HP may be 0 or negative if killed). */
  readonly defender: UnitInstance;
}

/**
 * Get the defense bonus multiplier for a given terrain type.
 * Attacking from defensive terrain grants NO bonus — only defenders benefit.
 */
export function getDefenseBonusForTerrain(terrain: TileType): number {
  switch (terrain) {
    case TileType.Field:
      return 1.0;
    case TileType.Forest:
    case TileType.Mountain:
    case TileType.ShallowWater:
    case TileType.Ocean:
      return 1.5;
  }
}

/**
 * Get the defense bonus multiplier for a city.
 */
export function getCityDefenseBonus(hasWall: boolean): number {
  return hasWall ? 4.0 : 1.5;
}

/**
 * Resolves combat between an attacker and defender.
 *
 * @param attacker - The attacking unit
 * @param defender - The defending unit
 * @param defenseBonus - The defense bonus multiplier for the defender's position (terrain/city)
 * @param attackerDistance - Chebyshev distance between attacker and defender (for retaliation range check)
 * @returns The combat result with updated unit states
 */
export function resolveCombat(
  attacker: UnitInstance,
  defender: UnitInstance,
  defenseBonus: number,
  attackerDistance: number,
): CombatResult {
  // Calculate forces
  const attackForce = attacker.atk * (attacker.currentHp / attacker.maxHp);
  const defenseForce = defender.def * (defender.currentHp / defender.maxHp) * defenseBonus;
  const totalDamage = attackForce + defenseForce;

  // Avoid division by zero (e.g., both have 0 atk/def)
  if (totalDamage === 0) {
    return {
      damageToDefender: 0,
      damageToAttacker: 0,
      defenderKilled: false,
      attackerKilled: false,
      attacker,
      defender,
    };
  }

  // Calculate damage to defender
  const attackResult = Math.round((attackForce / totalDamage) * attacker.atk * 4.5);

  // Calculate retaliation damage (based on pre-attack HP)
  const defenseResult = Math.round((defenseForce / totalDamage) * defender.def * 4.5);

  // Apply damage to defender
  const defenderNewHp = defender.currentHp - attackResult;
  const defenderKilled = defenderNewHp <= 0;

  // Determine retaliation
  let damageToAttacker = 0;
  const hasRetaliation = !defenderKilled
    && attackerDistance <= defender.range
    && !defender.skills.includes(UnitSkill.Stiff)
    && defenseResult > 0;

  if (hasRetaliation) {
    damageToAttacker = defenseResult;
  }

  const attackerNewHp = attacker.currentHp - damageToAttacker;
  const attackerKilled = attackerNewHp <= 0;

  // Update attacker kill count
  const newKills = defenderKilled ? attacker.kills + 1 : attacker.kills;

  const updatedAttacker: UnitInstance = {
    ...attacker,
    currentHp: Math.max(0, attackerNewHp),
    kills: newKills,
    hasAttacked: true,
  };

  const updatedDefender: UnitInstance = {
    ...defender,
    currentHp: Math.max(0, defenderNewHp),
  };

  return {
    damageToDefender: attackResult,
    damageToAttacker,
    defenderKilled,
    attackerKilled,
    attacker: updatedAttacker,
    defender: updatedDefender,
  };
}

/**
 * Check if a unit is eligible for veteran promotion.
 * Requires 3+ kills and the unit must not have the Static skill.
 */
export function canPromote(unit: UnitInstance): boolean {
  if (unit.isVeteran) return false;
  if (unit.skills.includes(UnitSkill.Static)) return false;
  return unit.kills >= 3;
}

/**
 * Promote a unit to veteran status.
 * Grants +5 max HP and full heal to the new max.
 * Returns the updated unit, or the same unit if not eligible.
 */
export function promoteToVeteran(unit: UnitInstance): UnitInstance {
  if (!canPromote(unit)) return unit;

  const newMaxHp = unit.maxHp + 5;
  return {
    ...unit,
    maxHp: newMaxHp,
    currentHp: newMaxHp,
    isVeteran: true,
  };
}

/**
 * Calculate expected damage without applying it. Useful for battle preview.
 */
export function previewCombat(
  attacker: UnitInstance,
  defender: UnitInstance,
  defenseBonus: number,
  attackerDistance: number,
): { damageToDefender: number; damageToAttacker: number } {
  const attackForce = attacker.atk * (attacker.currentHp / attacker.maxHp);
  const defenseForce = defender.def * (defender.currentHp / defender.maxHp) * defenseBonus;
  const totalDamage = attackForce + defenseForce;

  if (totalDamage === 0) {
    return { damageToDefender: 0, damageToAttacker: 0 };
  }

  const attackResult = Math.round((attackForce / totalDamage) * attacker.atk * 4.5);
  const defenseResult = Math.round((defenseForce / totalDamage) * defender.def * 4.5);

  const defenderKilled = defender.currentHp - attackResult <= 0;

  let damageToAttacker = 0;
  if (!defenderKilled
    && attackerDistance <= defender.range
    && !defender.skills.includes(UnitSkill.Stiff)
    && defenseResult > 0) {
    damageToAttacker = defenseResult;
  }

  return { damageToDefender: attackResult, damageToAttacker };
}
