/**
 * LevelUpModal — centered modal overlay for choosing a city level-up reward.
 *
 * Appears when `pendingLevelUp` is set in the game store.
 * Shows two large option cards (A and B) from getLevelRewards().
 * Tapping a card calls chooseLevelUpReward() and dismisses the modal.
 */

import { useCallback } from 'preact/hooks';
import { useGameStore } from '../store/gameStore.js';
import { getLevelRewards } from '../core/City.js';
import type { CityLevelRewardOption } from '../core/types.js';

/** Friendly display label for each reward kind. */
function getRewardTitle(option: CityLevelRewardOption): string {
  switch (option.kind) {
    case 'workshop': return 'Workshop';
    case 'explorer': return 'Explorer';
    case 'cityWall': return 'City Wall';
    case 'stars': return `${option.amount} Stars`;
    case 'borderGrowth': return 'Border Growth';
    case 'population': return 'Population Boom';
    case 'park': return 'Park';
    case 'superUnit': return 'Giant';
  }
}

/** Icon/emoji-free symbol for each reward kind. */
function getRewardSymbol(option: CityLevelRewardOption): string {
  switch (option.kind) {
    case 'workshop': return 'W';
    case 'explorer': return 'E';
    case 'cityWall': return 'D';
    case 'stars': return 'S';
    case 'borderGrowth': return 'B';
    case 'population': return 'P';
    case 'park': return 'K';
    case 'superUnit': return 'G';
  }
}

export function LevelUpModal() {
  const pendingLevelUp = useGameStore(s => s.pendingLevelUp);
  const chooseLevelUpReward = useGameStore(s => s.chooseLevelUpReward);

  const handleChoose = useCallback((option: CityLevelRewardOption) => {
    chooseLevelUpReward(option);
  }, [chooseLevelUpReward]);

  if (!pendingLevelUp) return null;

  const city = pendingLevelUp.city;
  const nextLevel = city.level + 1;
  const rewards = getLevelRewards(nextLevel);

  const cardStyle: Record<string, string | number> = {
    flex: '1 1 0',
    minWidth: '140px',
    maxWidth: '260px',
    minHeight: '180px',
    padding: '20px 16px',
    backgroundColor: '#1a237e',
    border: '2px solid #5c6bc0',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'background-color 0.15s, border-color 0.15s',
    textAlign: 'center',
  };

  const renderCard = (option: CityLevelRewardOption, label: string) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => handleChoose(option)}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleChoose(option);
        }
      }}
      style={cardStyle}
    >
      {/* Symbol circle */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: 700,
          color: '#ffd54f',
          flexShrink: 0,
        }}
      >
        {getRewardSymbol(option)}
      </div>

      {/* Label */}
      <div style={{ fontSize: '11px', color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
        {label}
      </div>

      {/* Reward title */}
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
        {getRewardTitle(option)}
      </div>

      {/* Reward description */}
      <div style={{ fontSize: '14px', color: '#b0bec5', lineHeight: '1.4' }}>
        {option.description}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Modal container */}
      <div
        style={{
          backgroundColor: '#0d1137',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
            City Level Up!
          </div>
          <div style={{ fontSize: '14px', color: '#b0bec5', marginTop: '4px' }}>
            {city.name} reaches Level {nextLevel}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            margin: '16px 0',
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#9fa8da',
            marginBottom: '20px',
          }}
        >
          Choose a reward:
        </div>

        {/* Option cards */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {renderCard(rewards.optionA, 'Option A')}
          {renderCard(rewards.optionB, 'Option B')}
        </div>
      </div>
    </div>
  );
}
