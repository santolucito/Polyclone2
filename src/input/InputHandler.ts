/**
 * Input handler for PolyClone2.
 *
 * Translates raw DOM pointer / wheel events on the PixiJS canvas into
 * Camera operations (pan, zoom, pinch-to-zoom).
 *
 * Design notes:
 *   - We use DOM `pointer*` events (not PixiJS interaction events) so we
 *     have full control and avoid PixiJS version-specific API churn.
 *   - Multi-touch pinch-to-zoom is tracked by maintaining a map of active
 *     pointer IDs. When two pointers are down we compute the distance
 *     between them on each move and translate changes into Camera.setZoom.
 *   - The handler must be `destroy()`ed to remove its listeners.
 */

import { Camera } from './Camera.js';

/** Stored pointer state for multi-touch tracking. */
interface PointerState {
  id: number;
  x: number;
  y: number;
}

/** Maximum pointer movement (in px) to still count as a tap, not a drag. */
const TAP_THRESHOLD = 8;

export class InputHandler {
  private readonly camera: Camera;
  private readonly canvas: HTMLCanvasElement;

  /**
   * Callback invoked after any camera state change so the caller can
   * re-apply the transform. This keeps InputHandler decoupled from the
   * renderer / PixiJS container.
   */
  private readonly onCameraChange: () => void;

  /**
   * Optional callback invoked when the user taps (clicks without dragging)
   * on the canvas. The coordinates are in *world* space (map pixels).
   */
  private readonly onTap: ((worldX: number, worldY: number) => void) | null;

  /** Map pixel dimensions of the game map in world space. */
  private readonly mapWidth: number;
  private readonly mapHeight: number;

  /** Viewport (canvas) dimensions, updated on resize. */
  private viewportWidth: number;
  private viewportHeight: number;

  // -- Pointer tracking --
  private readonly pointers: Map<number, PointerState> = new Map();

  /**
   * When a pinch gesture is active (two fingers), we store the initial
   * distance and the zoom level at the start of the pinch so we can
   * compute a smooth proportional zoom.
   */
  private pinchStartDist = 0;
  private pinchStartZoom = 1;

  // -- Tap detection --
  private tapPointerId = -1;
  private tapStartX = 0;
  private tapStartY = 0;

  // -- Bound handler references (so we can removeEventListener) --
  private readonly handlePointerDown: (e: PointerEvent) => void;
  private readonly handlePointerMove: (e: PointerEvent) => void;
  private readonly handlePointerUp: (e: PointerEvent) => void;
  private readonly handleWheel: (e: WheelEvent) => void;
  private readonly handleResize: () => void;

  constructor(
    camera: Camera,
    canvas: HTMLCanvasElement,
    mapWidth: number,
    mapHeight: number,
    onCameraChange: () => void,
    onTap?: (worldX: number, worldY: number) => void,
  ) {
    this.camera = camera;
    this.canvas = canvas;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.onCameraChange = onCameraChange;
    this.onTap = onTap ?? null;
    this.viewportWidth = canvas.clientWidth;
    this.viewportHeight = canvas.clientHeight;

    // Bind handlers once.
    this.handlePointerDown = this.onPointerDown.bind(this);
    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerUp = this.onPointerUp.bind(this);
    this.handleWheel = this.onWheel.bind(this);
    this.handleResize = this.onResize.bind(this);

    this.attach();
  }

  // -----------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------

  private attach(): void {
    const c = this.canvas;
    c.addEventListener('pointerdown', this.handlePointerDown);
    c.addEventListener('pointermove', this.handlePointerMove);
    c.addEventListener('pointerup', this.handlePointerUp);
    c.addEventListener('pointercancel', this.handlePointerUp);
    c.addEventListener('pointerleave', this.handlePointerUp);
    c.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('resize', this.handleResize);
  }

  destroy(): void {
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.handlePointerDown);
    c.removeEventListener('pointermove', this.handlePointerMove);
    c.removeEventListener('pointerup', this.handlePointerUp);
    c.removeEventListener('pointercancel', this.handlePointerUp);
    c.removeEventListener('pointerleave', this.handlePointerUp);
    c.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('resize', this.handleResize);
    this.pointers.clear();
  }

  // -----------------------------------------------------------------
  // Pointer events
  // -----------------------------------------------------------------

  private onPointerDown(e: PointerEvent): void {
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);

    const pt: PointerState = { id: e.pointerId, x: e.clientX, y: e.clientY };
    this.pointers.set(e.pointerId, pt);

    if (this.pointers.size === 1) {
      // Single-finger / mouse: start pan and record for tap detection.
      this.camera.startDrag(e.clientX, e.clientY);
      this.tapPointerId = e.pointerId;
      this.tapStartX = e.clientX;
      this.tapStartY = e.clientY;
    } else if (this.pointers.size === 2) {
      // Second finger down: transition from pan to pinch.
      this.camera.endDrag();
      this.initPinch();
    }
  }

  private onPointerMove(e: PointerEvent): void {
    const stored = this.pointers.get(e.pointerId);
    if (!stored) return;

    stored.x = e.clientX;
    stored.y = e.clientY;

    if (this.pointers.size === 1) {
      // Single pointer: pan.
      this.camera.drag(e.clientX, e.clientY);
    } else if (this.pointers.size === 2) {
      // Two pointers: pinch-to-zoom.
      this.handlePinchMove();
    }

    this.clampAndNotify();
  }

  private onPointerUp(e: PointerEvent): void {
    // Detect tap: same pointer, minimal movement.
    if (
      e.pointerId === this.tapPointerId &&
      this.pointers.size === 1 &&
      this.onTap !== null
    ) {
      const dx = e.clientX - this.tapStartX;
      const dy = e.clientY - this.tapStartY;
      if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD) {
        // Convert screen coords to world coords using camera offset/zoom.
        const worldX = (e.clientX - this.camera.x) / this.camera.zoom;
        const worldY = (e.clientY - this.camera.y) / this.camera.zoom;
        this.onTap(worldX, worldY);
      }
    }
    this.tapPointerId = -1;

    this.pointers.delete(e.pointerId);

    if (this.pointers.size < 2) {
      // Pinch ended. If one finger remains, restart a drag from it.
      if (this.pointers.size === 1) {
        const remaining = this.pointers.values().next().value as PointerState;
        this.camera.startDrag(remaining.x, remaining.y);
      } else {
        this.camera.endDrag();
      }
    }
  }

  // -----------------------------------------------------------------
  // Wheel (mouse zoom)
  // -----------------------------------------------------------------

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = Camera.wheelDeltaToZoom(e.deltaY);
    this.camera.zoomAt(delta, e.clientX, e.clientY);
    this.clampAndNotify();
  }

  // -----------------------------------------------------------------
  // Pinch-to-zoom helpers
  // -----------------------------------------------------------------

  /** Snapshot the two-pointer distance and current zoom to start a pinch. */
  private initPinch(): void {
    const [a, b] = this.getTwoPointers();
    this.pinchStartDist = dist(a, b);
    this.pinchStartZoom = this.camera.zoom;
  }

  /** Process an ongoing two-pointer pinch gesture. */
  private handlePinchMove(): void {
    const [a, b] = this.getTwoPointers();
    const currentDist = dist(a, b);

    if (this.pinchStartDist === 0) return; // safety

    const scale = currentDist / this.pinchStartDist;
    const newZoom = this.pinchStartZoom * scale;

    // Zoom towards the midpoint of the two pointers.
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;

    this.camera.setZoom(newZoom, cx, cy);
  }

  /** Returns exactly two PointerState entries (assumes size >= 2). */
  private getTwoPointers(): [PointerState, PointerState] {
    const it = this.pointers.values();
    const a = it.next().value as PointerState;
    const b = it.next().value as PointerState;
    return [a, b];
  }

  // -----------------------------------------------------------------
  // Resize
  // -----------------------------------------------------------------

  private onResize(): void {
    this.viewportWidth = this.canvas.clientWidth;
    this.viewportHeight = this.canvas.clientHeight;
    this.clampAndNotify();
  }

  // -----------------------------------------------------------------
  // Shared helper
  // -----------------------------------------------------------------

  private clampAndNotify(): void {
    this.camera.clampBounds(
      this.mapWidth,
      this.mapHeight,
      this.viewportWidth,
      this.viewportHeight,
    );
    this.onCameraChange();
  }
}

// -----------------------------------------------------------------
// Geometry helpers
// -----------------------------------------------------------------

function dist(a: PointerState, b: PointerState): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
