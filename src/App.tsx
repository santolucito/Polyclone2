import { useEffect, useRef } from 'preact/hooks';
import { Application } from 'pixi.js';
import { GameMap } from './core/GameMap.js';
import { TileType } from './core/types.js';
import { GameRenderer } from './render/GameRenderer.js';

/**
 * Build a sample 16x16 map with mixed terrain:
 *   - Mostly fields
 *   - Clusters of forest
 *   - Some mountains
 *   - A lake (shallow water + ocean core)
 */
function createSampleMap(): GameMap {
  const map = GameMap.create(16, 16, TileType.Field);

  // -- Forest clusters (upper-left and mid-right) --
  const forestTiles: [number, number][] = [
    // Upper-left cluster
    [1, 1], [2, 1], [3, 1],
    [1, 2], [2, 2], [3, 2], [4, 2],
    [2, 3], [3, 3],
    // Mid-right cluster
    [11, 5], [12, 5], [13, 5],
    [11, 6], [12, 6], [13, 6], [14, 6],
    [12, 7], [13, 7], [14, 7],
    [13, 8],
    // Small southern patch
    [5, 12], [6, 12], [6, 13], [7, 13],
  ];
  for (const [x, y] of forestTiles) {
    map.setTile(x, y, TileType.Forest);
  }

  // -- Mountain range (diagonal from center-left to upper-right) --
  const mountainTiles: [number, number][] = [
    [6, 4], [7, 3], [8, 3], [9, 2], [10, 2],
    [7, 4], [8, 4],
    [10, 1], [11, 1],
    // Small southern mountain
    [2, 10], [3, 10], [3, 11],
  ];
  for (const [x, y] of mountainTiles) {
    map.setTile(x, y, TileType.Mountain);
  }

  // -- Lake (shallow water ring with ocean core, lower-right area) --
  const shallowWaterTiles: [number, number][] = [
    [9, 10], [10, 9], [11, 9], [12, 9],
    [9, 11], [13, 10],
    [9, 12], [13, 11],
    [10, 13], [11, 13], [12, 13], [13, 12],
  ];
  for (const [x, y] of shallowWaterTiles) {
    map.setTile(x, y, TileType.ShallowWater);
  }

  const oceanTiles: [number, number][] = [
    [10, 10], [11, 10], [12, 10],
    [10, 11], [11, 11], [12, 11],
    [10, 12], [11, 12], [12, 12],
  ];
  for (const [x, y] of oceanTiles) {
    map.setTile(x, y, TileType.Ocean);
  }

  return map;
}

export function App() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application();
    let renderer: GameRenderer | undefined;

    const init = async () => {
      await app.init({
        resizeTo: canvasRef.current!,
        background: '#1a1a2e',
        antialias: true,
      });
      canvasRef.current!.appendChild(app.canvas);

      const gameMap = createSampleMap();
      renderer = new GameRenderer(app, gameMap);
      renderer.render();
    };

    init();

    return () => {
      renderer?.destroy();
      app.destroy(true);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={canvasRef} id="game-canvas" style={{ width: '100%', height: '100%' }} />
      <div id="ui-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
        <div style={{ padding: '12px 16px', color: '#fff', fontFamily: 'sans-serif', fontSize: '14px', pointerEvents: 'auto' }}>
          PolyClone2 — Phase 0
        </div>
      </div>
    </div>
  );
}
