/**
 * BattlePreview — Centered overlay for combat confirmation.
 *
 * Appears when battlePreview is not null. Shows attacker and defender
 * stats, predicted damage, kill indicators, and confirm/cancel buttons.
 */

import { useCallback } from 'preact/hooks';
import { useGameStore } from '../store/gameStore.js';
import { UnitType } from '../core/types.js';

/** Display names for unit types. */
const UNIT_DISPLAY_NAMES: Record<UnitType, string> = {
  [UnitType.Warrior]: 'Warrior',
  [UnitType.Archer]: 'Archer',
  [UnitType.Defender]: 'Defender',
  [UnitType.Rider]: 'Rider',
  [UnitType.Swordsman]: 'Swordsman',
  [UnitType.MindBender]: 'Mind Bender',
  [UnitType.Catapult]: 'Catapult',
  [UnitType.Knight]: 'Knight',
  [UnitType.Cloak]: 'Cloak',
  [UnitType.Giant]: 'Giant',
  [UnitType.Raft]: 'Raft',
  [UnitType.Scout]: 'Scout',
  [UnitType.Rammer]: 'Rammer',
  [UnitType.Bomber]: 'Bomber',
};

export function BattlePreview() {
  const battlePreview = useGameStore(s => s.battlePreview);
  const attackUnit = useGameStore(s => s.attackUnit);
  const dismissBattlePreview = useGameStore(s => s.dismissBattlePreview);

  const handleConfirm = useCallback(() => {
    if (!battlePreview) return;
    attackUnit(battlePreview.defender.x, battlePreview.defender.y);
  }, [battlePreview, attackUnit]);

  const handleCancel = useCallback(() => {
    dismissBattlePreview();
  }, [dismissBattlePreview]);

  if (!battlePreview) return null;

  const { attacker, defender, damageToDefender, damageToAttacker, defenderKilled, attackerKilled } =
    battlePreview;

  const attackerHpAfter = Math.max(0, attacker.currentHp - damageToAttacker);
  const defenderHpAfter = Math.max(0, defender.currentHp - damageToDefender);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Semi-transparent backdrop */}
      <div
        onClick={handleCancel}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Preview card */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#1a1a2e',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '20px',
          width: '320px',
          maxWidth: '90vw',
          color: '#fff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          Battle Preview
        </div>

        {/* Combatant cards */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'stretch',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          {/* Attacker side */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(74, 144, 217, 0.15)',
              border: '1px solid rgba(74, 144, 217, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                color: '#4a90d9',
                marginBottom: '6px',
              }}
            >
              Attacker
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
              {UNIT_DISPLAY_NAMES[attacker.type]}
            </div>

            {/* HP bar */}
            <div style={{ marginBottom: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '3px',
                }}
              >
                <span>HP</span>
                <span>
                  {attacker.currentHp} {'\u2192'} {attackerHpAfter}
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                {/* Current HP (full bar) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${(attacker.currentHp / attacker.maxHp) * 100}%`,
                    height: '100%',
                    backgroundColor: 'rgba(76, 175, 80, 0.4)',
                    borderRadius: '3px',
                  }}
                />
                {/* HP after combat */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${(attackerHpAfter / attacker.maxHp) * 100}%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <span>ATK {attacker.atk}</span>
              <span>DEF {attacker.def}</span>
            </div>

            {/* Kill warning */}
            {attackerKilled && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#ff5252',
                }}
              >
                {'\u26A0'} KILLED
              </div>
            )}
          </div>

          {/* Defender side */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'rgba(217, 74, 74, 0.15)',
              border: '1px solid rgba(217, 74, 74, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
                color: '#d94a4a',
                marginBottom: '6px',
              }}
            >
              Defender
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
              {UNIT_DISPLAY_NAMES[defender.type]}
            </div>

            {/* HP bar */}
            <div style={{ marginBottom: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '3px',
                }}
              >
                <span>HP</span>
                <span>
                  {defender.currentHp} {'\u2192'} {defenderHpAfter}
                </span>
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                {/* Current HP (full bar) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${(defender.currentHp / defender.maxHp) * 100}%`,
                    height: '100%',
                    backgroundColor: 'rgba(76, 175, 80, 0.4)',
                    borderRadius: '3px',
                  }}
                />
                {/* HP after combat */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${(defenderHpAfter / defender.maxHp) * 100}%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              <span>ATK {defender.atk}</span>
              <span>DEF {defender.def}</span>
            </div>

            {/* Kill indicator */}
            {defenderKilled && (
              <div
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#ff5252',
                }}
              >
                {'\u2620'} KILLED
              </div>
            )}
          </div>
        </div>

        {/* Damage summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '10px 0',
            marginBottom: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', marginBottom: '2px' }}>
              To Defender
            </div>
            <span style={{ fontWeight: 700, color: '#ff8a80' }}>
              {'\u2192'} {damageToDefender} dmg
            </span>
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', marginBottom: '2px' }}>
              To Attacker
            </div>
            <span style={{ fontWeight: 700, color: '#ffcc80' }}>
              {'\u2190'} {damageToAttacker} dmg
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel attack"
            style={{
              flex: 1,
              minHeight: '48px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
              transition: 'background-color 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            aria-label="Confirm attack"
            style={{
              flex: 1,
              minHeight: '48px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff',
              backgroundColor: '#d94a4a',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'sans-serif',
              boxShadow: '0 2px 8px rgba(217, 74, 74, 0.4)',
              transition: 'background-color 0.15s',
            }}
          >
            Attack
          </button>
        </div>
      </div>
    </div>
  );
}
