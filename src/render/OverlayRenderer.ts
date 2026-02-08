/**
 * Renders overlay highlights on the game map:
 *   - Movement range (semi-transparent blue squares)
 *   - Selection highlight (bright border on the selected tile)
 */

import { Container, Graphics } from 'pixi.js';
import { Coord } from '../core/types.js';
import { TILE_SIZE } from './constants.js';

/** Color for movement range tiles. */
const MOVEMENT_RANGE_COLOR = 0x4488ff;
const MOVEMENT_RANGE_ALPHA = 0.3;

/** Color for the selected tile highlight border. */
const SELECTION_HIGHLIGHT_COLOR = 0xffff00;
const SELECTION_HIGHLIGHT_ALPHA = 0.8;

/**
 * Creates a container with semi-transparent overlay squares for each
 * tile in the given coordinate set.
 */
export function renderMovementOverlay(tiles: Set<string>): Container {
  const container = new Container();

  for (const key of tiles) {
    const [x, y] = key.split(',').map(Number);
    const g = new Graphics();
    g.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      .fill({ color: MOVEMENT_RANGE_COLOR, alpha: MOVEMENT_RANGE_ALPHA });
    container.addChild(g);
  }

  return container;
}

/**
 * Creates a bright border highlight on a single tile (the selected tile).
 */
export function renderSelectionHighlight(coord: Coord): Container {
  const container = new Container();
  const g = new Graphics();
  g.rect(
    coord.x * TILE_SIZE + 1,
    coord.y * TILE_SIZE + 1,
    TILE_SIZE - 2,
    TILE_SIZE - 2,
  ).stroke({
    width: 3,
    color: SELECTION_HIGHLIGHT_COLOR,
    alpha: SELECTION_HIGHLIGHT_ALPHA,
  });
  container.addChild(g);
  return container;
}
