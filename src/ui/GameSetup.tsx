import { useState } from 'preact/hooks';
import { useGameStore } from '../store/gameStore.js';
import type { TribeId, Difficulty, GameConfig } from '../core/types.js';

/** Tribe metadata for the selection UI. */
const TRIBES: readonly { id: TribeId; label: string; color: string }[] = [
  { id: 'xinxi', label: 'Xin-Xi', color: '#d13440' },
  { id: 'imperius', label: 'Imperius', color: '#3f51b5' },
  { id: 'bardur', label: 'Bardur', color: '#795548' },
  { id: 'oumaji', label: 'Oumaji', color: '#ffc107' },
];

const DIFFICULTIES: readonly { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'normal', label: 'Normal' },
  { value: 'hard', label: 'Hard' },
  { value: 'crazy', label: 'Crazy' },
];

const OPPONENT_COUNTS = [1, 2, 3] as const;

export function GameSetup() {
  const initGame = useGameStore(s => s.initGame);

  const [selectedTribe, setSelectedTribe] = useState<TribeId>('imperius');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [opponentCount, setOpponentCount] = useState(1);

  function handleStart() {
    // Build the AI opponent list from tribes the player didn't pick
    const remaining = TRIBES.map(t => t.id).filter(id => id !== selectedTribe);
    // Shuffle remaining tribes using Fisher-Yates
    const shuffled = [...remaining];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const aiTribes = shuffled.slice(0, opponentCount);

    const config: GameConfig = {
      mapSize: 16,
      waterLevel: 0.3,
      tribes: [selectedTribe, ...aiTribes],
      difficulty,
      winCondition: 'domination',
      turnLimit: null,
    };

    initGame(config, Date.now());
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        color: '#fff',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {/* Title */}
        <h1
          style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            textAlign: 'center',
          }}
        >
          PolyClone2
        </h1>

        {/* Tribe Selection */}
        <section style={{ width: '100%', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, opacity: 0.8 }}>
            Choose Your Tribe
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            {TRIBES.map(tribe => {
              const isSelected = selectedTribe === tribe.id;
              return (
                <button
                  key={tribe.id}
                  onClick={() => setSelectedTribe(tribe.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: tribe.color,
                      border: isSelected
                        ? '3px solid #fff'
                        : '3px solid transparent',
                      boxShadow: isSelected
                        ? `0 0 12px ${tribe.color}`
                        : 'none',
                      transition: 'border 0.15s, box-shadow 0.15s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontWeight: isSelected ? 700 : 400,
                    }}
                  >
                    {tribe.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Difficulty */}
        <section style={{ width: '100%', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, opacity: 0.8 }}>
            Difficulty
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {DIFFICULTIES.map(d => {
              const isSelected = difficulty === d.value;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  style={{
                    minWidth: '72px',
                    minHeight: '48px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                    background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: '14px',
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    fontFamily: 'sans-serif',
                    transition: 'background 0.15s, border 0.15s',
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Opponents */}
        <section style={{ width: '100%', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, opacity: 0.8 }}>
            Opponents
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {OPPONENT_COUNTS.map(count => {
              const isSelected = opponentCount === count;
              return (
                <button
                  key={count}
                  onClick={() => setOpponentCount(count)}
                  style={{
                    minWidth: '64px',
                    minHeight: '48px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                    background: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: '16px',
                    fontWeight: isSelected ? 700 : 400,
                    cursor: 'pointer',
                    fontFamily: 'sans-serif',
                    transition: 'background 0.15s, border 0.15s',
                  }}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </section>

        {/* Start Game */}
        <button
          onClick={handleStart}
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            background: '#4caf50',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'sans-serif',
            letterSpacing: '1px',
            marginTop: '8px',
            transition: 'background 0.15s',
          }}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
