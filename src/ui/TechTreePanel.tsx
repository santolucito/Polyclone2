/**
 * TechTreePanel — full-screen overlay showing the 25-tech tree.
 *
 * Organized as 5 branches x 3 tiers in a scrollable grid.
 * Techs are color-coded by state: researched (green), available (bright), locked (gray).
 * Tapping an available tech researches it (deducting stars).
 */

import { useCallback } from 'preact/hooks';
import { useGameStore } from '../store/gameStore.js';
import { getAllTechs, getTechDefinition } from '../core/TechTree.js';
import type { TechId, TechDefinition, TechUnlock } from '../core/types.js';

/** The 5 branch roots, each defining a column in the tech tree grid. */
const BRANCHES: readonly { root: TechId; label: string }[] = [
  { root: 'climbing', label: 'Climbing' },
  { root: 'hunting', label: 'Hunting' },
  { root: 'organization', label: 'Organization' },
  { root: 'riding', label: 'Riding' },
  { root: 'fishing', label: 'Fishing' },
];

/**
 * Build a mapping: branchRoot -> [tier1, [tier2a, tier2b], [tier3a, tier3b]].
 * Each branch has 1 tier-1 tech, 2 tier-2 techs, and 2 tier-3 techs.
 */
function getBranchTechs(rootId: TechId): TechDefinition[][] {
  const allTechs = getAllTechs();
  const root = getTechDefinition(rootId);

  // Tier 2: prerequisite is the root
  const tier2 = allTechs.filter(t => t.tier === 2 && t.prerequisite === rootId);

  // Tier 3: prerequisite is one of the tier-2 techs
  const tier2Ids = new Set(tier2.map(t => t.id));
  const tier3 = allTechs.filter(t => t.tier === 3 && t.prerequisite !== null && tier2Ids.has(t.prerequisite));

  return [[root], tier2, tier3];
}

/** Format a single unlock for display. */
function formatUnlock(u: TechUnlock): string {
  switch (u.kind) {
    case 'unit': return `Unit: ${u.unitType}`;
    case 'building': return `Building: ${u.buildingType}`;
    case 'action': return u.action;
    case 'ability': return u.ability;
    case 'resource': return `Resource: ${u.resourceType}`;
  }
}

/** Tech node states for visual styling. */
type TechNodeState = 'researched' | 'available' | 'locked';

export function TechTreePanel() {
  const showTechTree = useGameStore(s => s.showTechTree);
  const toggleTechTree = useGameStore(s => s.toggleTechTree);
  const researchTech = useGameStore(s => s.researchTech);
  const gameState = useGameStore(s => s.gameState);
  const currentPlayer = useGameStore(s => s.currentPlayer);
  const stars = useGameStore(s => s.stars);

  const handleResearch = useCallback((techId: TechId) => {
    researchTech(techId);
  }, [researchTech]);

  if (!showTechTree || !gameState) return null;

  const techState = gameState.getTechState(currentPlayer);

  const getNodeState = (id: TechId): TechNodeState => {
    if (techState.hasResearched(id)) return 'researched';
    if (techState.canResearch(id)) return 'available';
    return 'locked';
  };

  const nodeStyles: Record<TechNodeState, Record<string, string | number>> = {
    researched: {
      backgroundColor: '#2e7d32',
      border: '2px solid #66bb6a',
      color: '#fff',
      cursor: 'default',
      opacity: 1,
    },
    available: {
      backgroundColor: '#1565c0',
      border: '2px solid #42a5f5',
      color: '#fff',
      cursor: 'pointer',
      opacity: 1,
    },
    locked: {
      backgroundColor: '#424242',
      border: '2px solid #616161',
      color: '#9e9e9e',
      cursor: 'default',
      opacity: 0.6,
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 700,
          }}
        >
          Tech Tree
        </span>
        <span
          style={{
            color: '#ffd54f',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Stars: {stars}
        </span>
        {/* Close button */}
        <button
          type="button"
          onClick={toggleTechTree}
          style={{
            minWidth: '48px',
            minHeight: '48px',
            padding: '8px 16px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          X
        </button>
      </div>

      {/* Scrollable grid area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '16px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Branch columns */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            minWidth: 'max-content',
          }}
        >
          {BRANCHES.map(branch => {
            const tiers = getBranchTechs(branch.root);

            return (
              <div
                key={branch.root}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minWidth: '160px',
                  flex: '1 0 160px',
                }}
              >
                {/* Branch label */}
                <div
                  style={{
                    color: '#b0bec5',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    textAlign: 'center',
                    paddingBottom: '4px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {branch.label}
                </div>

                {/* Tier rows */}
                {tiers.map((tierTechs, tierIndex) => (
                  <div key={tierIndex} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tierIndex > 0 && (
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'rgba(255,255,255,0.25)',
                          fontSize: '16px',
                          lineHeight: '1',
                        }}
                      >
                        |
                      </div>
                    )}
                    {tierTechs.map(tech => {
                      const state = getNodeState(tech.id);
                      const cost = gameState.getTechCost(currentPlayer, tech.id);
                      const canAfford = stars >= cost;
                      const isClickable = state === 'available' && canAfford;

                      return (
                        <div
                          key={tech.id}
                          role={isClickable ? 'button' : undefined}
                          tabIndex={isClickable ? 0 : undefined}
                          onClick={() => {
                            if (isClickable) handleResearch(tech.id);
                          }}
                          onKeyDown={(e: KeyboardEvent) => {
                            if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              handleResearch(tech.id);
                            }
                          }}
                          style={{
                            ...nodeStyles[state],
                            borderRadius: '8px',
                            padding: '10px',
                            minHeight: '48px',
                            textAlign: 'center',
                            transition: 'background-color 0.15s, opacity 0.15s',
                            ...(state === 'available' && !canAfford
                              ? { opacity: 0.7, cursor: 'not-allowed' }
                              : {}),
                          }}
                        >
                          {/* Tech name + checkmark */}
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              marginBottom: '4px',
                            }}
                          >
                            {state === 'researched' ? '\u2713 ' : ''}
                            {tech.name}
                          </div>

                          {/* Cost (only shown if not yet researched) */}
                          {state !== 'researched' && (
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: state === 'available' && canAfford ? '#ffd54f' : '#999',
                                marginBottom: '4px',
                              }}
                            >
                              Cost: {cost} stars
                            </div>
                          )}

                          {/* Tier label */}
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'rgba(255,255,255,0.5)',
                              marginBottom: '6px',
                            }}
                          >
                            Tier {tech.tier}
                          </div>

                          {/* Unlocks */}
                          <div
                            style={{
                              fontSize: '11px',
                              color: state === 'locked' ? '#777' : 'rgba(255,255,255,0.75)',
                              lineHeight: '1.4',
                            }}
                          >
                            {tech.unlocks.map((u, i) => (
                              <div key={i}>{formatUnlock(u)}</div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
