/**
 * Renders units on the game map as colored circles with type indicators.
 *
 * Player 0 = blue tint, Player 1 = red tint.
 * Selected units get a bright highlight ring.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UnitInstance, UnitType } from '../core/types.js';
import { TILE_HEIGHT } from './constants.js';
import { gridToIsoCenter } from './CoordinateUtils.js';

/** Player colors: index -> fill color. */
const PLAYER_COLORS: Record<number, number> = {
  0: 0x3388ff,  // Blue
  1: 0xff4444,  // Red
};

/** Darker border variant per player. */
const PLAYER_BORDER_COLORS: Record<number, number> = {
  0: 0x2266cc,
  1: 0xcc2222,
};

/** Selection highlight ring color. */
const SELECTION_COLOR = 0xffff00;

/** Map from UnitType to a short label letter. */
const UNIT_TYPE_LABELS: Partial<Record<UnitType, string>> = {
  [UnitType.Warrior]: 'W',
  [UnitType.Archer]: 'A',
  [UnitType.Defender]: 'D',
  [UnitType.Rider]: 'R',
  [UnitType.Swordsman]: 'S',
  [UnitType.MindBender]: 'M',
  [UnitType.Catapult]: 'C',
  [UnitType.Knight]: 'K',
  [UnitType.Cloak]: 'L',
  [UnitType.Giant]: 'G',
  [UnitType.Raft]: 'r',
  [UnitType.Scout]: 's',
  [UnitType.Rammer]: 'x',
  [UnitType.Bomber]: 'B',
};

/** The radius of the unit circle — fits within 32px-tall diamond. */
const UNIT_RADIUS = TILE_HEIGHT * 0.38;

/**
 * Creates a PixiJS Container representing a unit on the map.
 * Includes a colored circle, a type label, and optionally a selection ring.
 */
export function createUnitGraphic(
  unit: UnitInstance,
  isSelected: boolean,
  mapHeight: number,
): Container {
  const container = new Container();
  const { cx, cy } = gridToIsoCenter(unit.x, unit.y, mapHeight);

  container.position.set(cx, cy);

  const fillColor = PLAYER_COLORS[unit.owner] ?? 0x888888;
  const borderColor = PLAYER_BORDER_COLORS[unit.owner] ?? 0x555555;

  // Selection highlight ring (drawn first, behind the unit)
  if (isSelected) {
    const ring = new Graphics();
    ring.circle(0, 0, UNIT_RADIUS + 3)
      .stroke({ width: 2, color: SELECTION_COLOR, alpha: 0.9 });
    container.addChild(ring);
  }

  // Unit circle
  const circle = new Graphics();
  circle.circle(0, 0, UNIT_RADIUS)
    .fill({ color: fillColor })
    .stroke({ width: 2, color: borderColor });
  container.addChild(circle);

  // Type label
  const label = UNIT_TYPE_LABELS[unit.type] ?? '?';
  const style = new TextStyle({
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fill: 0xffffff,
  });
  const text = new Text({ text: label, style });
  text.anchor.set(0.5, 0.5);
  container.addChild(text);

  return container;
}

/**
 * Renders all units into a container.
 * Returns the container so it can be added to the stage.
 */
export function renderUnitsToContainer(
  units: UnitInstance[],
  selectedUnitId: string | null,
  mapHeight: number,
): Container {
  const container = new Container();

  for (const unit of units) {
    const isSelected = unit.id === selectedUnitId;
    const graphic = createUnitGraphic(unit, isSelected, mapHeight);
    container.addChild(graphic);
  }

  return container;
}
