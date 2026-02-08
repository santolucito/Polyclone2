/**
 * Renders overlay highlights on the game map:
 *   - Movement range (semi-transparent diamond overlays)
 *   - Selection highlight (bright diamond border on the selected tile)
 */

import { Container, Graphics } from 'pixi.js';
import { Coord } from '../core/types.js';
import {
  gridToIso,
  getDiamondVertices,
} from './CoordinateUtils.js';

/** Color for movement range tiles. */
const MOVEMENT_RANGE_COLOR = 0x4488ff;
const MOVEMENT_RANGE_ALPHA = 0.3;

/** Color for the selected tile highlight border. */
const SELECTION_HIGHLIGHT_COLOR = 0xffff00;
const SELECTION_HIGHLIGHT_ALPHA = 0.8;

/**
 * Creates a container with semi-transparent diamond overlays for each
 * tile in the given coordinate set.
 */
export function renderMovementOverlay(tiles: Set<string>, mapHeight: number): Container {
  const container = new Container();

  for (const key of tiles) {
    const [x, y] = key.split(',').map(Number);
    const { px, py } = gridToIso(x, y, mapHeight);
    const [top, right, bottom, left] = getDiamondVertices(px, py);

    const g = new Graphics();
    g.moveTo(top.x, top.y)
      .lineTo(right.x, right.y)
      .lineTo(bottom.x, bottom.y)
      .lineTo(left.x, left.y)
      .closePath()
      .fill({ color: MOVEMENT_RANGE_COLOR, alpha: MOVEMENT_RANGE_ALPHA });
    container.addChild(g);
  }

  return container;
}

/**
 * Creates a bright diamond border highlight on a single tile (the selected tile).
 */
export function renderSelectionHighlight(coord: Coord, mapHeight: number): Container {
  const container = new Container();
  const { px, py } = gridToIso(coord.x, coord.y, mapHeight);
  const [top, right, bottom, left] = getDiamondVertices(px, py);

  const g = new Graphics();
  g.moveTo(top.x, top.y)
    .lineTo(right.x, right.y)
    .lineTo(bottom.x, bottom.y)
    .lineTo(left.x, left.y)
    .closePath()
    .stroke({
      width: 3,
      color: SELECTION_HIGHLIGHT_COLOR,
      alpha: SELECTION_HIGHLIGHT_ALPHA,
    });
  container.addChild(g);
  return container;
}
