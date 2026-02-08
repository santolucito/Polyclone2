import { describe, it, expect } from 'vitest';
import {
  resolveCombat,
  canPromote,
  promoteToVeteran,
  previewCombat,
  getDefenseBonusForTerrain,
  getCityDefenseBonus,
} from '../../src/core/Combat.js';
import { UnitInstance, UnitSkill, UnitType, TileType } from '../../src/core/types.js';

/** Helper to create a unit for testing. */
function makeUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'test-unit',
    type: UnitType.Warrior,
    owner: 0,
    x: 0,
    y: 0,
    currentHp: 10,
    maxHp: 10,
    atk: 2,
    def: 2,
    movement: 1,
    range: 1,
    kills: 0,
    isVeteran: false,
    hasMoved: false,
    hasAttacked: false,
    isHidden: false,
    skills: [UnitSkill.Dash, UnitSkill.Fortify],
    ...overrides,
  };
}

describe('Combat', () => {
  describe('getDefenseBonusForTerrain', () => {
    it('should return 1.0 for field', () => {
      expect(getDefenseBonusForTerrain(TileType.Field)).toBe(1.0);
    });

    it('should return 1.5 for forest', () => {
      expect(getDefenseBonusForTerrain(TileType.Forest)).toBe(1.5);
    });

    it('should return 1.5 for mountain', () => {
      expect(getDefenseBonusForTerrain(TileType.Mountain)).toBe(1.5);
    });

    it('should return 1.5 for water tiles', () => {
      expect(getDefenseBonusForTerrain(TileType.ShallowWater)).toBe(1.5);
      expect(getDefenseBonusForTerrain(TileType.Ocean)).toBe(1.5);
    });
  });

  describe('getCityDefenseBonus', () => {
    it('should return 1.5 for city without walls', () => {
      expect(getCityDefenseBonus(false)).toBe(1.5);
    });

    it('should return 4.0 for city with walls', () => {
      expect(getCityDefenseBonus(true)).toBe(4.0);
    });
  });

  describe('resolveCombat', () => {
    it('should handle worked example: Swordsman vs Defender in forest', () => {
      const attacker = makeUnit({
        id: 'swordsman',
        type: UnitType.Swordsman,
        atk: 3,
        def: 3,
        currentHp: 15,
        maxHp: 15,
        skills: [UnitSkill.Dash],
      });
      const defender = makeUnit({
        id: 'defender',
        type: UnitType.Defender,
        owner: 1,
        atk: 1,
        def: 3,
        currentHp: 15,
        maxHp: 15,
        skills: [UnitSkill.Fortify],
      });

      const result = resolveCombat(attacker, defender, 1.5, 1);

      expect(result.damageToDefender).toBe(5);
      expect(result.damageToAttacker).toBe(8);
      expect(result.defenderKilled).toBe(false);
      expect(result.attackerKilled).toBe(false);
      expect(result.defender.currentHp).toBe(10);
      expect(result.attacker.currentHp).toBe(7);
    });

    it('should handle worked example: Knight vs half-health Warrior on field', () => {
      const attacker = makeUnit({
        id: 'knight',
        type: UnitType.Knight,
        atk: 3.5,
        def: 1,
        currentHp: 10,
        maxHp: 10,
        movement: 3,
        skills: [UnitSkill.Dash, UnitSkill.Persist, UnitSkill.Fortify],
      });
      const defender = makeUnit({
        id: 'warrior',
        type: UnitType.Warrior,
        owner: 1,
        atk: 2,
        def: 2,
        currentHp: 5,
        maxHp: 10,
      });

      const result = resolveCombat(attacker, defender, 1.0, 1);

      expect(result.damageToDefender).toBe(12);
      expect(result.defenderKilled).toBe(true);
      expect(result.damageToAttacker).toBe(0); // No retaliation (defender killed)
      expect(result.attacker.currentHp).toBe(10);
      expect(result.attacker.kills).toBe(1);
    });

    it('should not allow retaliation from Stiff units', () => {
      const attacker = makeUnit({ id: 'warrior', atk: 2, def: 2, currentHp: 10, maxHp: 10 });
      const defender = makeUnit({
        id: 'catapult',
        type: UnitType.Catapult,
        owner: 1,
        atk: 4,
        def: 0,
        currentHp: 10,
        maxHp: 10,
        range: 3,
        skills: [UnitSkill.Stiff],
      });

      const result = resolveCombat(attacker, defender, 1.0, 1);

      expect(result.damageToAttacker).toBe(0);
      expect(result.defenderKilled).toBe(false);
    });

    it('should not allow retaliation when attacker is out of defender range', () => {
      const attacker = makeUnit({
        id: 'archer',
        type: UnitType.Archer,
        atk: 2,
        def: 1,
        currentHp: 10,
        maxHp: 10,
        range: 2,
      });
      const defender = makeUnit({
        id: 'warrior',
        owner: 1,
        atk: 2,
        def: 2,
        currentHp: 10,
        maxHp: 10,
        range: 1,
      });

      // Archer attacks from distance 2, warrior has range 1
      const result = resolveCombat(attacker, defender, 1.0, 2);

      expect(result.damageToAttacker).toBe(0);
      expect(result.damageToDefender).toBeGreaterThan(0);
    });

    it('should correctly track hasAttacked flag', () => {
      const attacker = makeUnit({ hasAttacked: false });
      const defender = makeUnit({ id: 'def', owner: 1 });

      const result = resolveCombat(attacker, defender, 1.0, 1);
      expect(result.attacker.hasAttacked).toBe(true);
    });

    it('should handle zero-stat combat gracefully', () => {
      const attacker = makeUnit({ atk: 0, def: 0, currentHp: 10, maxHp: 10 });
      const defender = makeUnit({ id: 'def', owner: 1, atk: 0, def: 0, currentHp: 10, maxHp: 10 });

      const result = resolveCombat(attacker, defender, 1.0, 1);
      expect(result.damageToDefender).toBe(0);
      expect(result.damageToAttacker).toBe(0);
    });

    it('should calculate reduced force for damaged attacker', () => {
      // Full HP warrior vs full HP warrior on field
      const fullAttacker = makeUnit({ id: 'full', atk: 2, def: 2, currentHp: 10, maxHp: 10 });
      const defender = makeUnit({ id: 'def', owner: 1, atk: 2, def: 2, currentHp: 10, maxHp: 10 });

      const fullResult = resolveCombat(fullAttacker, defender, 1.0, 1);

      // Half HP warrior vs full HP warrior on field
      const halfAttacker = makeUnit({ id: 'half', atk: 2, def: 2, currentHp: 5, maxHp: 10 });
      const defender2 = makeUnit({ id: 'def2', owner: 1, atk: 2, def: 2, currentHp: 10, maxHp: 10 });

      const halfResult = resolveCombat(halfAttacker, defender2, 1.0, 1);

      // Half HP attacker should deal less damage
      expect(halfResult.damageToDefender).toBeLessThan(fullResult.damageToDefender);
    });

    it('should handle defender with 0 DEF', () => {
      const attacker = makeUnit({ atk: 3, def: 1, currentHp: 10, maxHp: 10 });
      const defender = makeUnit({
        id: 'def',
        owner: 1,
        atk: 4,
        def: 0,
        currentHp: 10,
        maxHp: 10,
        skills: [UnitSkill.Stiff],
      });

      const result = resolveCombat(attacker, defender, 1.0, 1);

      // With 0 DEF, defenseForce = 0, all damage to defender
      // attackResult = round((3/3) * 3 * 4.5) = round(13.5) = 14
      expect(result.damageToDefender).toBe(14);
    });

    it('should handle warrior vs warrior on field (symmetric)', () => {
      const attacker = makeUnit({ id: 'att', atk: 2, def: 2, currentHp: 10, maxHp: 10 });
      const defender = makeUnit({ id: 'def', owner: 1, atk: 2, def: 2, currentHp: 10, maxHp: 10 });

      const result = resolveCombat(attacker, defender, 1.0, 1);

      // attackForce = 2 * 1 = 2
      // defenseForce = 2 * 1 * 1 = 2
      // totalDamage = 4
      // attackResult = round((2/4) * 2 * 4.5) = round(4.5) = 5 (or 4 depending on rounding)
      // defenseResult = round((2/4) * 2 * 4.5) = round(4.5) = 5 (or 4)
      // Since symmetric, both should take equal damage
      expect(result.damageToDefender).toBe(result.damageToAttacker);
    });
  });

  describe('canPromote', () => {
    it('should return false for unit with fewer than 3 kills', () => {
      expect(canPromote(makeUnit({ kills: 0 }))).toBe(false);
      expect(canPromote(makeUnit({ kills: 1 }))).toBe(false);
      expect(canPromote(makeUnit({ kills: 2 }))).toBe(false);
    });

    it('should return true for unit with 3+ kills', () => {
      expect(canPromote(makeUnit({ kills: 3 }))).toBe(true);
      expect(canPromote(makeUnit({ kills: 5 }))).toBe(true);
    });

    it('should return false for already veteran unit', () => {
      expect(canPromote(makeUnit({ kills: 3, isVeteran: true }))).toBe(false);
    });

    it('should return false for Static skill units', () => {
      expect(canPromote(makeUnit({ kills: 3, skills: [UnitSkill.Static] }))).toBe(false);
    });
  });

  describe('promoteToVeteran', () => {
    it('should add +5 max HP and full heal', () => {
      const unit = makeUnit({ kills: 3, currentHp: 5, maxHp: 10 });
      const promoted = promoteToVeteran(unit);

      expect(promoted.maxHp).toBe(15);
      expect(promoted.currentHp).toBe(15);
      expect(promoted.isVeteran).toBe(true);
    });

    it('should not promote ineligible unit', () => {
      const unit = makeUnit({ kills: 1 });
      const result = promoteToVeteran(unit);
      expect(result).toBe(unit); // Same reference, no change
    });
  });

  describe('previewCombat', () => {
    it('should return same values as resolveCombat for damage', () => {
      const attacker = makeUnit({ atk: 3, def: 3, currentHp: 15, maxHp: 15, skills: [UnitSkill.Dash] });
      const defender = makeUnit({ id: 'def', owner: 1, atk: 1, def: 3, currentHp: 15, maxHp: 15, skills: [UnitSkill.Fortify] });

      const preview = previewCombat(attacker, defender, 1.5, 1);
      const result = resolveCombat(attacker, defender, 1.5, 1);

      expect(preview.damageToDefender).toBe(result.damageToDefender);
      expect(preview.damageToAttacker).toBe(result.damageToAttacker);
    });
  });
});
