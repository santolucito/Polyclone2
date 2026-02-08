/**
 * Camera system for PolyClone2.
 *
 * Manages viewport state (offset + zoom) and applies the resulting
 * transform to a PixiJS Container. The camera itself is rendering-
 * agnostic -- it only computes numbers and calls `.position.set()` /
 * `.scale.set()` on whatever Container it is given.
 *
 * Coordinate conventions:
 *   - "screen" space is the raw pixel position on the HTML canvas.
 *   - "world" space is the underlying map coordinate system (before zoom).
 *   - The container's position is the *world origin in screen space*.
 *     Positive x/y moves the map right/down.
 */

import { Container } from 'pixi.js';

/** Zoom boundaries. */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

/**
 * How much a single "click" of the mouse wheel zooms.
 * Larger numbers = faster zoom per scroll tick.
 */
const WHEEL_ZOOM_SPEED = 0.001;

export class Camera {
  /** Offset of the world origin relative to the viewport's top-left corner. */
  private offsetX = 0;
  private offsetY = 0;

  /** Current zoom (scale) level. 1 = 100 %. */
  private _zoom = 1;

  // -- Drag state --
  private dragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOriginX = 0;
  private dragOriginY = 0;

  // -----------------------------------------------------------------
  // Read-only accessors
  // -----------------------------------------------------------------

  get x(): number {
    return this.offsetX;
  }

  get y(): number {
    return this.offsetY;
  }

  get zoom(): number {
    return this._zoom;
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  // -----------------------------------------------------------------
  // Drag (pan) API
  // -----------------------------------------------------------------

  /**
   * Begin a drag operation.  `sx` / `sy` are the pointer position in
   * *screen* pixels (e.g. from `event.clientX/Y` relative to the canvas).
   */
  startDrag(sx: number, sy: number): void {
    this.dragging = true;
    this.dragStartX = sx;
    this.dragStartY = sy;
    this.dragOriginX = this.offsetX;
    this.dragOriginY = this.offsetY;
  }

  /**
   * Continue a drag. Updates the camera offset so the world position
   * that was under the pointer at `startDrag` stays under the pointer.
   */
  drag(sx: number, sy: number): void {
    if (!this.dragging) return;
    this.offsetX = this.dragOriginX + (sx - this.dragStartX);
    this.offsetY = this.dragOriginY + (sy - this.dragStartY);
  }

  /** End the current drag. */
  endDrag(): void {
    this.dragging = false;
  }

  // -----------------------------------------------------------------
  // Zoom API
  // -----------------------------------------------------------------

  /**
   * Zoom in or out, keeping the given *screen* pixel fixed in world
   * space (i.e. the map point under the cursor does not move).
   *
   * @param delta  Positive = zoom in, negative = zoom out.
   *               Typically derived from `event.deltaY * -WHEEL_ZOOM_SPEED`.
   * @param cx     Screen-space x to zoom towards.
   * @param cy     Screen-space y to zoom towards.
   */
  zoomAt(delta: number, cx: number, cy: number): void {
    const oldZoom = this._zoom;
    const newZoom = clamp(oldZoom + delta, MIN_ZOOM, MAX_ZOOM);
    if (newZoom === oldZoom) return;

    // World point under (cx, cy) before the zoom change.
    // world = (screen - offset) / zoom
    const wx = (cx - this.offsetX) / oldZoom;
    const wy = (cy - this.offsetY) / oldZoom;

    this._zoom = newZoom;

    // Recompute offset so (wx, wy) maps back to (cx, cy).
    // screen = world * newZoom + offset  =>  offset = screen - world * newZoom
    this.offsetX = cx - wx * newZoom;
    this.offsetY = cy - wy * newZoom;
  }

  /**
   * Set the zoom level directly (used by pinch-to-zoom).
   * Keeps the given screen point fixed, same as `zoomAt`.
   */
  setZoom(newZoom: number, cx: number, cy: number): void {
    const clamped = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
    if (clamped === this._zoom) return;

    const wx = (cx - this.offsetX) / this._zoom;
    const wy = (cy - this.offsetY) / this._zoom;

    this._zoom = clamped;

    this.offsetX = cx - wx * clamped;
    this.offsetY = cy - wy * clamped;
  }

  /** Convenience: convert a wheel event deltaY into a zoom delta. */
  static wheelDeltaToZoom(deltaY: number): number {
    return -deltaY * WHEEL_ZOOM_SPEED;
  }

  // -----------------------------------------------------------------
  // Bounds clamping
  // -----------------------------------------------------------------

  /**
   * Clamp the camera so the visible area does not exceed the map.
   *
   * The map occupies world-space rect [0, 0] .. [mapW, mapH].
   * After scaling by `zoom`, the map in screen space is
   *   [offsetX, offsetY] .. [offsetX + mapW*zoom, offsetY + mapH*zoom].
   *
   * We want:
   *   - The map to fill the viewport if it is large enough.
   *   - If the viewport is larger than the map (zoomed out far), center
   *     the map instead.
   *
   * @param mapW  Map width in world pixels (e.g. 16 * 64 = 1024).
   * @param mapH  Map height in world pixels.
   * @param vpW   Viewport (canvas) width in screen pixels.
   * @param vpH   Viewport (canvas) height in screen pixels.
   */
  clampBounds(mapW: number, mapH: number, vpW: number, vpH: number): void {
    const scaledW = mapW * this._zoom;
    const scaledH = mapH * this._zoom;

    if (scaledW <= vpW) {
      // Map fits horizontally -- center it.
      this.offsetX = (vpW - scaledW) / 2;
    } else {
      // Map is wider than viewport -- don't let edges show.
      // offsetX <= 0  (left edge)
      // offsetX + scaledW >= vpW  =>  offsetX >= vpW - scaledW
      this.offsetX = clamp(this.offsetX, vpW - scaledW, 0);
    }

    if (scaledH <= vpH) {
      this.offsetY = (vpH - scaledH) / 2;
    } else {
      this.offsetY = clamp(this.offsetY, vpH - scaledH, 0);
    }
  }

  // -----------------------------------------------------------------
  // Apply to container
  // -----------------------------------------------------------------

  /** Write the current camera state to a PixiJS container's transform. */
  applyTransform(container: Container): void {
    container.position.set(this.offsetX, this.offsetY);
    container.scale.set(this._zoom);
  }
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
