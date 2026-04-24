import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import * as fabric from 'fabric';
import { Layer, LayerType } from '../models/project.model';
import { v4 as uuidv4 } from 'uuid';

export type ShapeType = 'rect' | 'circle' | 'triangle' | 'star' | 'polygon' | 'diamond' | 'hexagon' | 'arrow' | 'line';
export type BackgroundMode = 'white' | 'transparent' | 'custom';

const SNAP_THRESHOLD = 6;
const GUIDE_COLOR = '#ff2d87';

@Injectable({ providedIn: 'root' })
export class CanvasService {
  private canvas: fabric.Canvas | null = null;
  private guidelines: fabric.Line[] = [];

  private readonly _layers = signal<Layer[]>([]);
  private readonly _activeLayerId = signal<string | null>(null);
  private readonly _canvasWidth = signal(1000);
  private readonly _canvasHeight = signal(1000);
  private readonly _zoom = signal(1);
  private readonly _backgroundMode = signal<BackgroundMode>('white');
  private readonly _backgroundColor = signal('#ffffff');
  private readonly _isPanning = signal(false);
  private readonly _showGrid = signal(false);
  private readonly _snapToGrid = signal(false);
  private readonly _snapToThirds = signal(false);
  private readonly _showThirds = signal(false);
  private thirdsLines: fabric.Line[] = [];
  private readonly _printMode = signal(false);
  private printGuides: fabric.FabricObject[] = [];
  readonly printMode = this._printMode.asReadonly();
  private readonly _gridSize = signal(20);
  private gridLines: fabric.Line[] = [];
  private readonly _isDrawing = signal(false);
  private readonly _brushColor = signal('#000000');
  private readonly _brushSize = signal(4);
  private panStartPoint: { x: number; y: number } | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;

  readonly isDrawing = this._isDrawing.asReadonly();
  readonly brushColor = this._brushColor.asReadonly();
  readonly brushSize = this._brushSize.asReadonly();
  readonly isPanning = this._isPanning.asReadonly();
  readonly showGrid = this._showGrid.asReadonly();
  readonly snapToGrid = this._snapToGrid.asReadonly();
  readonly gridSize = this._gridSize.asReadonly();
  readonly snapToThirds = this._snapToThirds.asReadonly();
  readonly showThirds = this._showThirds.asReadonly();
  readonly layers = this._layers.asReadonly();
  readonly activeLayerId = this._activeLayerId.asReadonly();
  readonly canvasWidth = this._canvasWidth.asReadonly();
  readonly canvasHeight = this._canvasHeight.asReadonly();
  readonly zoom = this._zoom.asReadonly();
  readonly backgroundMode = this._backgroundMode.asReadonly();
  readonly backgroundColor = this._backgroundColor.asReadonly();

  readonly activeLayer = computed(() => {
    const id = this._activeLayerId();
    return this._layers().find(l => l.id === id) ?? null;
  });

  /**
   * Initialize the underlying fabric.js canvas on the given DOM element.
   *
   * @param canvasElement - The `<canvas>` host DOM node.
   * @param width - Logical canvas width (design px).
   * @param height - Logical canvas height (design px).
   * @returns The created {@link fabric.Canvas} instance.
   *
   * @remarks
   * Wires up selection, snapping, pan/zoom, and touch-gesture listeners.
   * Must be called exactly once per component lifecycle. Call
   * {@link dispose} during teardown.
   */
  initCanvas(canvasElement: HTMLCanvasElement, width: number, height: number): fabric.Canvas {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    this.canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      allowTouchScrolling: false,
      enablePointerEvents: isTouch,
      // Fire Fabric events for right-click so our context menu works reliably
      fireRightClick: true,
      stopContextMenu: true,
    });

    // Bigger touch-friendly controls on touch devices
    if (isTouch) {
      fabric.FabricObject.prototype.cornerSize = 18;
      fabric.FabricObject.prototype.touchCornerSize = 30;
      fabric.FabricObject.prototype.padding = 6;
    }

    this._canvasWidth.set(width);
    this._canvasHeight.set(height);

    // Enable spellcheck on the hidden text editing element
    this.canvas.on('text:editing:entered', (e: any) => {
      const obj = e.target;
      const hiddenEl = (obj as any)?.hiddenTextarea as HTMLTextAreaElement | undefined;
      if (hiddenEl) {
        hiddenEl.setAttribute('spellcheck', 'true');
        hiddenEl.setAttribute('autocorrect', 'on');
        hiddenEl.setAttribute('autocapitalize', 'sentences');
      }
    });

    this.canvas.on('selection:created', (e) => {
      this.handleObjectSelection(e.selected?.[0]);
    });

    this.canvas.on('selection:updated', (e) => {
      this.handleObjectSelection(e.selected?.[0]);
    });

    this.canvas.on('selection:cleared', () => {
      this._activeLayerId.set(null);
    });

    // --- Smart snapping guides + grid snap ---
    this.canvas.on('object:moving', (e) => {
      if (this._snapToGrid()) {
        const obj = e.target;
        if (obj) {
          const grid = this._gridSize();
          obj.set({
            left: Math.round((obj.left ?? 0) / grid) * grid,
            top: Math.round((obj.top ?? 0) / grid) * grid,
          });
        }
      }
      this.handleObjectMoving(e);
    });
    this.canvas.on('object:modified', () => this.clearGuidelines());
    this.canvas.on('mouse:up', () => this.clearGuidelines());

    // Right-click — emit DOM event for the context menu
    this.canvas.on('mouse:down', (opt) => {
      const e = opt.e as MouseEvent;
      if (e && e.button === 2) {
        // If right-click hit an object, Fabric auto-sets it as target. Activate it.
        if (opt.target) {
          this.canvas!.setActiveObject(opt.target);
          this.canvas!.requestRenderAll();
        }
        this.rightClick$.next(e);
      }
    });

    // Double-click — forward to consumers (e.g. for quick text edit)
    this.canvas.on('mouse:dblclick', (opt) => {
      const e = opt.e as MouseEvent;
      if (e) this.doubleClick$.next(e);
    });

    // Rotation snap: hold Shift to snap to 15° increments
    this.canvas.on('object:rotating', (e) => {
      if (e.e?.shiftKey) {
        const obj = e.target;
        if (obj) {
          const angle = obj.angle ?? 0;
          obj.rotate(Math.round(angle / 15) * 15);
        }
      }
    });

    // --- Pan mode (spacebar + drag) ---
    this.canvas.on('mouse:down', (opt) => {
      if (this._isPanning()) {
        const evt = opt.e as MouseEvent;
        this.panStartPoint = { x: evt.clientX, y: evt.clientY };
        this.canvas!.selection = false;
        this.canvas!.setCursor('grabbing');
      }
    });

    this.canvas.on('mouse:move', (opt) => {
      if (this._isPanning() && this.panStartPoint) {
        const evt = opt.e as MouseEvent;
        const vpt = this.canvas!.viewportTransform!;
        vpt[4] += evt.clientX - this.panStartPoint.x;
        vpt[5] += evt.clientY - this.panStartPoint.y;
        this.panStartPoint = { x: evt.clientX, y: evt.clientY };
        this.canvas!.requestRenderAll();
      }
    });

    this.canvas.on('mouse:up', () => {
      if (this.panStartPoint) {
        this.panStartPoint = null;
        this.canvas!.selection = !this._isPanning();
        if (this._isPanning()) {
          this.canvas!.setCursor('grab');
        }
      }
    });

    this.setupPanKeyListeners();
    this.setupTouchGestures();

    return this.canvas;
  }

  /**
   * Get the current fabric canvas, if one has been initialized.
   *
   * @returns The fabric canvas or `null` before {@link initCanvas} / after {@link dispose}.
   */
  getCanvas(): fabric.Canvas | null {
    return this.canvas;
  }

  /** Subject emitting the DOM MouseEvent when the user right-clicks on the canvas. */
  readonly rightClick$ = new Subject<MouseEvent>();

  /** Subject emitting the DOM MouseEvent when the user double-clicks on the canvas. */
  readonly doubleClick$ = new Subject<MouseEvent>();

  /**
   * Notify the canvas that a programmatic change was made.
   * Fires the 'object:modified' event so listeners (history, auto-save,
   * quality score) react to property changes triggered by panels.
   * Use this after any `obj.set(...)` outside of user-driven events.
   */
  commitChange(obj?: fabric.FabricObject | null): void {
    if (!this.canvas) return;
    const target = obj ?? this.canvas.getActiveObject() ?? undefined;
    this.canvas.requestRenderAll();
    if (target) {
      this.canvas.fire('object:modified', { target });
    }
  }

  // ============================
  // Object creation — all centered
  // ============================

  /**
   * Add an image layer from a URL (data URL or http(s)) to the canvas.
   *
   * @param url - Image URL (CORS-enabled for remote URLs).
   * @remarks The image is centered and scaled to fit 80% of the canvas.
   * Asynchronous — completes when the browser fires `Image.onload`.
   */
  addImage(url: string): void {
    if (!this.canvas) return;

    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';

    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl);

      const cw = this._canvasWidth();
      const ch = this._canvasHeight();

      const scale = Math.min(
        (cw * 0.8) / (fabricImg.width ?? cw),
        (ch * 0.8) / (fabricImg.height ?? ch),
        1
      );

      fabricImg.set({
        scaleX: scale,
        scaleY: scale,
        left: cw / 2,
        top: ch / 2,
        originX: 'center',
        originY: 'center',
      });

      const layerId = uuidv4();
      (fabricImg as any).layerId = layerId;

      this.canvas!.add(fabricImg);
      this.canvas!.setActiveObject(fabricImg);
      this.canvas!.renderAll();

      this.addLayer({
        id: layerId,
        name: 'Image Layer',
        type: LayerType.Image,
        visible: true,
        locked: false,
        opacity: 1,
        order: this._layers().length,
        data: {},
      });
    };

    imgEl.onerror = (err) => {
      console.error('Failed to load image:', err);
    };

    imgEl.src = url;
  }

  /**
   * Parse an SVG string and add it as a single grouped layer.
   *
   * @param svgString - Well-formed SVG source.
   * @returns A promise that resolves when the group has been added.
   */
  async addSvg(svgString: string): Promise<void> {
    if (!this.canvas) return;

    try {
      const objects = await fabric.loadSVGFromString(svgString);
      if (!objects || !objects.objects || objects.objects.length === 0) return;

      const group = fabric.util.groupSVGElements(
        objects.objects.filter((o): o is fabric.FabricObject => o !== null),
        objects.options
      );

      const cw = this._canvasWidth();
      const ch = this._canvasHeight();
      const scale = Math.min(
        (cw * 0.6) / (group.width ?? cw),
        (ch * 0.6) / (group.height ?? ch),
        1
      );

      group.set({
        scaleX: scale,
        scaleY: scale,
        left: cw / 2,
        top: ch / 2,
        originX: 'center',
        originY: 'center',
      });

      const layerId = uuidv4();
      (group as any).layerId = layerId;

      this.canvas.add(group);
      this.canvas.setActiveObject(group);
      this.canvas.renderAll();

      this.addLayer({
        id: layerId,
        name: 'SVG',
        type: LayerType.Shape,
        visible: true,
        locked: false,
        opacity: 1,
        order: this._layers().length,
        data: {},
      });
    } catch (e) {
      console.error('Failed to load SVG:', e);
    }
  }

  /**
   * Add an editable text layer centered on the canvas.
   *
   * @param text - Initial text content.
   * @param options - Optional fabric `IText` overrides (fontSize, fill, etc.).
   */
  addText(text: string, options?: Partial<fabric.FabricText>): void {
    if (!this.canvas) return;

    const cw = this._canvasWidth();
    const ch = this._canvasHeight();
    const layerId = uuidv4();

    const textObj = new fabric.IText(text, {
      left: cw / 2,
      top: ch / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 48,
      fontFamily: 'Roboto',
      fill: '#000000',
      ...options,
    });

    (textObj as any).layerId = layerId;
    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    this.canvas.renderAll();

    this.addLayer({
      id: layerId,
      name: text.substring(0, 20),
      type: LayerType.Text,
      visible: true,
      locked: false,
      opacity: 1,
      order: this._layers().length,
      data: {},
    });
  }

  /**
   * Add a geometric shape layer centered on the canvas.
   *
   * @param type - One of {@link ShapeType}.
   */
  addShape(type: ShapeType): void {
    if (!this.canvas) return;

    const cw = this._canvasWidth();
    const ch = this._canvasHeight();
    const layerId = uuidv4();
    let shape: fabric.FabricObject;

    const commonProps = {
      left: cw / 2,
      top: ch / 2,
      originX: 'center' as const,
      originY: 'center' as const,
      fill: '#4285f4',
      stroke: '#000000',
      strokeWidth: 0,
    };

    switch (type) {
      case 'rect':
        shape = new fabric.Rect({ ...commonProps, width: 200, height: 150 });
        break;
      case 'circle':
        shape = new fabric.Circle({ ...commonProps, radius: 100 });
        break;
      case 'triangle':
        shape = new fabric.Triangle({ ...commonProps, width: 200, height: 180 });
        break;
      case 'star':
        shape = this.createStar(commonProps);
        break;
      case 'polygon':
        shape = this.createRegularPolygon(5, 100, commonProps);
        break;
      case 'diamond':
        shape = this.createRegularPolygon(4, 100, commonProps);
        break;
      case 'hexagon':
        shape = this.createRegularPolygon(6, 100, commonProps);
        break;
      case 'arrow':
        shape = this.createArrow(commonProps);
        break;
      case 'line':
        shape = new fabric.Line([0, 0, 200, 0], {
          ...commonProps,
          fill: '',
          stroke: '#4285f4',
          strokeWidth: 4,
        });
        break;
    }

    (shape as any).layerId = layerId;
    this.canvas.add(shape);
    this.canvas.setActiveObject(shape);
    this.canvas.renderAll();

    this.addLayer({
      id: layerId,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type: LayerType.Shape,
      visible: true,
      locked: false,
      opacity: 1,
      order: this._layers().length,
      data: {},
    });
  }

  // ============================
  // Smart snapping guidelines
  // ============================

  private handleObjectMoving(e: any): void {
    const obj = e.target as fabric.FabricObject;
    if (!obj || !this.canvas) return;

    this.clearGuidelines();

    const cw = this._canvasWidth();
    const ch = this._canvasHeight();
    const bound = obj.getBoundingRect();

    const objCenterX = bound.left + bound.width / 2;
    const objCenterY = bound.top + bound.height / 2;
    const objLeft = bound.left;
    const objRight = bound.left + bound.width;
    const objTop = bound.top;
    const objBottom = bound.top + bound.height;

    const canvasCenterX = cw / 2;
    const canvasCenterY = ch / 2;

    // Snap to canvas center horizontal
    if (Math.abs(objCenterX - canvasCenterX) < SNAP_THRESHOLD) {
      const delta = canvasCenterX - objCenterX;
      obj.set('left', (obj.left ?? 0) + delta);
      obj.setCoords();
      this.addGuideline(canvasCenterX, 0, canvasCenterX, ch, true);
    }

    // Snap to canvas center vertical
    if (Math.abs(objCenterY - canvasCenterY) < SNAP_THRESHOLD) {
      const delta = canvasCenterY - objCenterY;
      obj.set('top', (obj.top ?? 0) + delta);
      obj.setCoords();
      this.addGuideline(0, canvasCenterY, cw, canvasCenterY, false);
    }

    // Snap to rule of thirds (4 intersection points + lines)
    if (this._snapToThirds()) {
      const thirdsX = [cw / 3, (cw * 2) / 3];
      const thirdsY = [ch / 3, (ch * 2) / 3];

      for (const tx of thirdsX) {
        if (Math.abs(objCenterX - tx) < SNAP_THRESHOLD) {
          obj.set('left', (obj.left ?? 0) + (tx - objCenterX));
          obj.setCoords();
          this.addGuideline(tx, 0, tx, ch, true);
        }
      }
      for (const ty of thirdsY) {
        if (Math.abs(objCenterY - ty) < SNAP_THRESHOLD) {
          obj.set('top', (obj.top ?? 0) + (ty - objCenterY));
          obj.setCoords();
          this.addGuideline(0, ty, cw, ty, false);
        }
      }
    }

    // Snap to canvas left edge
    if (Math.abs(objLeft) < SNAP_THRESHOLD) {
      obj.set('left', (obj.left ?? 0) - objLeft);
      obj.setCoords();
      this.addGuideline(0, 0, 0, ch, true);
    }

    // Snap to canvas right edge
    if (Math.abs(objRight - cw) < SNAP_THRESHOLD) {
      obj.set('left', (obj.left ?? 0) + (cw - objRight));
      obj.setCoords();
      this.addGuideline(cw, 0, cw, ch, true);
    }

    // Snap to canvas top edge
    if (Math.abs(objTop) < SNAP_THRESHOLD) {
      obj.set('top', (obj.top ?? 0) - objTop);
      obj.setCoords();
      this.addGuideline(0, 0, cw, 0, false);
    }

    // Snap to canvas bottom edge
    if (Math.abs(objBottom - ch) < SNAP_THRESHOLD) {
      obj.set('top', (obj.top ?? 0) + (ch - objBottom));
      obj.setCoords();
      this.addGuideline(0, ch, cw, ch, false);
    }

    // Snap to other objects
    const otherObjects = this.canvas.getObjects().filter(
      o => o !== obj && !(o as any)._isGuideline && !(o as any)._isGrid
    );

    for (const other of otherObjects) {
      const ob = other.getBoundingRect();
      const otherCX = ob.left + ob.width / 2;
      const otherCY = ob.top + ob.height / 2;

      // Center-to-center horizontal
      const refreshedBound = obj.getBoundingRect();
      const curCX = refreshedBound.left + refreshedBound.width / 2;
      const curCY = refreshedBound.top + refreshedBound.height / 2;

      if (Math.abs(curCX - otherCX) < SNAP_THRESHOLD) {
        obj.set('left', (obj.left ?? 0) + (otherCX - curCX));
        obj.setCoords();
        const minY = Math.min(refreshedBound.top, ob.top);
        const maxY = Math.max(refreshedBound.top + refreshedBound.height, ob.top + ob.height);
        this.addGuideline(otherCX, minY, otherCX, maxY, true);
      }

      // Center-to-center vertical
      if (Math.abs(curCY - otherCY) < SNAP_THRESHOLD) {
        obj.set('top', (obj.top ?? 0) + (otherCY - curCY));
        obj.setCoords();
        const minX = Math.min(refreshedBound.left, ob.left);
        const maxX = Math.max(refreshedBound.left + refreshedBound.width, ob.left + ob.width);
        this.addGuideline(minX, otherCY, maxX, otherCY, false);
      }
    }

    // Equal-spacing detection: when at least 2 other objects exist
    if (otherObjects.length >= 2) {
      this.detectEqualSpacing(obj, otherObjects);
    }
  }

  /**
   * Detect equal spacing between this object and pairs of other objects,
   * snap to maintain equal gaps, and draw distance indicators.
   */
  private detectEqualSpacing(obj: fabric.FabricObject, others: fabric.FabricObject[]): void {
    const bound = obj.getBoundingRect();
    const objLeft = bound.left;
    const objRight = bound.left + bound.width;
    const objTop = bound.top;
    const objBottom = bound.top + bound.height;
    const objCX = bound.left + bound.width / 2;
    const objCY = bound.top + bound.height / 2;

    // Sort by x for horizontal scanning
    const horizontal = [...others].sort((a, b) => a.getBoundingRect().left - b.getBoundingRect().left);
    const vertical = [...others].sort((a, b) => a.getBoundingRect().top - b.getBoundingRect().top);

    // Horizontal equal spacing: object between two horizontal neighbors
    for (let i = 0; i < horizontal.length - 1; i++) {
      for (let j = i + 1; j < horizontal.length; j++) {
        const a = horizontal[i].getBoundingRect();
        const b = horizontal[j].getBoundingRect();
        const aRight = a.left + a.width;
        const bLeft = b.left;

        // Object should be between a and b horizontally
        if (objLeft < aRight || objRight > bLeft) continue;

        const gapAObj = objLeft - aRight;
        const gapObjB = bLeft - objRight;

        // If close to equal spacing (within threshold), snap and draw indicator
        if (gapAObj > 0 && gapObjB > 0 && Math.abs(gapAObj - gapObjB) < SNAP_THRESHOLD * 2) {
          const idealLeft = aRight + (bLeft - aRight - bound.width) / 2;
          const delta = idealLeft - objLeft;
          obj.set('left', (obj.left ?? 0) + delta);
          obj.setCoords();

          // Draw spacing indicators
          const midY = (Math.max(a.top, objTop, b.top) + Math.min(a.top + a.height, objBottom, b.top + b.height)) / 2;
          const idealGap = (bLeft - aRight - bound.width) / 2;
          this.addSpacingIndicator(aRight, midY, aRight + idealGap, midY);
          this.addSpacingIndicator(idealLeft + bound.width, midY, bLeft, midY);
          return;
        }
      }
    }

    // Vertical equal spacing
    for (let i = 0; i < vertical.length - 1; i++) {
      for (let j = i + 1; j < vertical.length; j++) {
        const a = vertical[i].getBoundingRect();
        const b = vertical[j].getBoundingRect();
        const aBottom = a.top + a.height;
        const bTop = b.top;

        if (objTop < aBottom || objBottom > bTop) continue;

        const gapAObj = objTop - aBottom;
        const gapObjB = bTop - objBottom;

        if (gapAObj > 0 && gapObjB > 0 && Math.abs(gapAObj - gapObjB) < SNAP_THRESHOLD * 2) {
          const idealTop = aBottom + (bTop - aBottom - bound.height) / 2;
          const delta = idealTop - objTop;
          obj.set('top', (obj.top ?? 0) + delta);
          obj.setCoords();

          const midX = (Math.max(a.left, objLeft, b.left) + Math.min(a.left + a.width, objRight, b.left + b.width)) / 2;
          const idealGap = (bTop - aBottom - bound.height) / 2;
          this.addSpacingIndicator(midX, aBottom, midX, aBottom + idealGap);
          this.addSpacingIndicator(midX, idealTop + bound.height, midX, bTop);
          return;
        }
      }
    }
  }

  private addSpacingIndicator(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.canvas) return;

    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: '#06b6d4',
      strokeWidth: 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (line as any)._isGuideline = true;

    // Add tick marks at endpoints
    const tickSize = 4;
    const isHorizontal = Math.abs(y2 - y1) < 1;
    const tick1 = isHorizontal
      ? new fabric.Line([x1, y1 - tickSize, x1, y1 + tickSize], { stroke: '#06b6d4', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true })
      : new fabric.Line([x1 - tickSize, y1, x1 + tickSize, y1], { stroke: '#06b6d4', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true });
    const tick2 = isHorizontal
      ? new fabric.Line([x2, y2 - tickSize, x2, y2 + tickSize], { stroke: '#06b6d4', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true })
      : new fabric.Line([x2 - tickSize, y2, x2 + tickSize, y2], { stroke: '#06b6d4', strokeWidth: 1, selectable: false, evented: false, excludeFromExport: true });

    (tick1 as any)._isGuideline = true;
    (tick2 as any)._isGuideline = true;

    this.canvas.add(line, tick1, tick2);
    this.guidelines.push(line, tick1, tick2);
  }

  private addGuideline(x1: number, y1: number, x2: number, y2: number, _isVertical: boolean): void {
    if (!this.canvas) return;

    const line = new fabric.Line([x1, y1, x2, y2], {
      stroke: GUIDE_COLOR,
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });

    (line as any)._isGuideline = true;
    this.canvas.add(line);
    this.guidelines.push(line);
  }

  private clearGuidelines(): void {
    if (!this.canvas) return;
    for (const line of this.guidelines) {
      this.canvas.remove(line);
    }
    this.guidelines = [];
  }

  // ============================
  // Grouping
  // ============================

  /**
   * Combine the current multi-selection into a single group layer.
   *
   * @remarks Noop unless the active selection contains ≥ 2 objects.
   */
  groupSelected(): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof fabric.ActiveSelection)) return;

    const objects = (active as fabric.ActiveSelection).getObjects();
    if (objects.length < 2) return;

    this.canvas.discardActiveObject();
    objects.forEach(obj => this.canvas!.remove(obj));

    const group = new fabric.Group(objects);
    const layerId = uuidv4();
    (group as any).layerId = layerId;

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.renderAll();

    this.addLayer({
      id: layerId,
      name: 'Group',
      type: LayerType.Shape,
      visible: true,
      locked: false,
      opacity: 1,
      order: this._layers().length,
      data: {},
    });
  }

  /**
   * Break an active group back into its constituent objects.
   *
   * @remarks Noop unless the active object is a non-selection Group.
   */
  ungroupSelected(): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof fabric.Group) || active instanceof fabric.ActiveSelection) return;

    const items = (active as fabric.Group).getObjects();
    const groupLayerId = (active as any).layerId;

    this.canvas.remove(active);
    items.forEach(item => this.canvas!.add(item));
    this.canvas.renderAll();

    this._layers.update(layers => layers.filter(l => l.id !== groupLayerId));
  }

  // ============================
  // Background
  // ============================

  /**
   * Set a background image on the canvas.
   *
   * @param dataUrl - Image data URL or remote URL.
   * @param fit - `'cover'` | `'contain'` | `'tile'`; default `'cover'`.
   */
  setBackgroundImage(dataUrl: string, fit: 'cover' | 'contain' | 'tile' = 'cover'): void {
    if (!this.canvas) return;

    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      const fabricImg = new fabric.FabricImage(imgEl);
      const cw = this._canvasWidth();
      const ch = this._canvasHeight();

      if (fit === 'cover') {
        const scale = Math.max(cw / (fabricImg.width ?? cw), ch / (fabricImg.height ?? ch));
        fabricImg.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', left: cw / 2, top: ch / 2 });
      } else if (fit === 'contain') {
        const scale = Math.min(cw / (fabricImg.width ?? cw), ch / (fabricImg.height ?? ch));
        fabricImg.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', left: cw / 2, top: ch / 2 });
      } else {
        // tile - will be applied via pattern
        const pattern = new fabric.Pattern({ source: imgEl, repeat: 'repeat' });
        this.canvas!.backgroundColor = pattern as any;
        this.canvas!.renderAll();
        this._backgroundMode.set('custom');
        return;
      }

      this.canvas!.backgroundImage = fabricImg;
      this.canvas!.renderAll();
      this._backgroundMode.set('custom');
    };
    imgEl.src = dataUrl;
  }

  /** Clear the background image set via {@link setBackgroundImage}. */
  removeBackgroundImage(): void {
    if (!this.canvas) return;
    this.canvas.backgroundImage = undefined;
    this.canvas.renderAll();
  }

  /**
   * Apply a canvas background color mode.
   *
   * @param mode - `'white'` | `'transparent'` | `'custom'`.
   * @param color - Hex color used when `mode === 'custom'`.
   */
  setBackgroundMode(mode: BackgroundMode, color?: string): void {
    if (!this.canvas) return;
    this._backgroundMode.set(mode);

    switch (mode) {
      case 'white':
        this._backgroundColor.set('#ffffff');
        this.canvas.backgroundColor = '#ffffff';
        break;
      case 'transparent':
        this._backgroundColor.set('');
        this.canvas.backgroundColor = '' as any;
        break;
      case 'custom':
        const c = color ?? '#ffffff';
        this._backgroundColor.set(c);
        this.canvas.backgroundColor = c;
        break;
    }

    this.canvas.renderAll();
  }

  // ============================
  // Alignment
  // ============================

  /**
   * Align the active object (or every member of a multi-selection) to
   * either the canvas edge/center or the selection's own bounding box.
   *
   * @param alignment - The axis + direction.
   * @param mode - `'canvas'` (default) or `'selection'`.
   */
  alignObjects(
    alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
    mode: 'canvas' | 'selection' = 'canvas',
  ): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active) return;

    // Multi-select align-to-selection: align each object's edge to the bounds
    if (mode === 'selection' && active instanceof fabric.ActiveSelection) {
      this.alignWithinSelection(active as fabric.ActiveSelection, alignment);
      return;
    }

    // Default: align active object to canvas
    const canvasW = this._canvasWidth();
    const canvasH = this._canvasHeight();
    const bound = active.getBoundingRect();

    switch (alignment) {
      case 'left':
        active.set('left', (active.left ?? 0) - bound.left);
        break;
      case 'center-h':
        active.set('left', (active.left ?? 0) + (canvasW / 2 - (bound.left + bound.width / 2)));
        break;
      case 'right':
        active.set('left', (active.left ?? 0) + (canvasW - (bound.left + bound.width)));
        break;
      case 'top':
        active.set('top', (active.top ?? 0) - bound.top);
        break;
      case 'center-v':
        active.set('top', (active.top ?? 0) + (canvasH / 2 - (bound.top + bound.height / 2)));
        break;
      case 'bottom':
        active.set('top', (active.top ?? 0) + (canvasH - (bound.top + bound.height)));
        break;
    }

    active.setCoords();
    this.canvas.renderAll();
  }

  /** Align objects within a multi-selection to the selection's bounding box. */
  private alignWithinSelection(
    selection: fabric.ActiveSelection,
    alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom',
  ): void {
    if (!this.canvas) return;
    const objects = selection.getObjects();
    if (objects.length < 2) return;

    // Calculate selection bounds based on all members
    let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    for (const o of objects) {
      const b = o.getBoundingRect();
      minLeft = Math.min(minLeft, b.left);
      minTop = Math.min(minTop, b.top);
      maxRight = Math.max(maxRight, b.left + b.width);
      maxBottom = Math.max(maxBottom, b.top + b.height);
    }
    const centerX = (minLeft + maxRight) / 2;
    const centerY = (minTop + maxBottom) / 2;

    for (const o of objects) {
      const b = o.getBoundingRect();
      switch (alignment) {
        case 'left':
          o.set('left', (o.left ?? 0) + (minLeft - b.left));
          break;
        case 'center-h':
          o.set('left', (o.left ?? 0) + (centerX - (b.left + b.width / 2)));
          break;
        case 'right':
          o.set('left', (o.left ?? 0) + (maxRight - (b.left + b.width)));
          break;
        case 'top':
          o.set('top', (o.top ?? 0) + (minTop - b.top));
          break;
        case 'center-v':
          o.set('top', (o.top ?? 0) + (centerY - (b.top + b.height / 2)));
          break;
        case 'bottom':
          o.set('top', (o.top ?? 0) + (maxBottom - (b.top + b.height)));
          break;
      }
      o.setCoords();
    }

    selection.setCoords();
    this.canvas.renderAll();
  }

  // ============================
  // Auto-arrange (smart layout)
  // ============================

  /**
   * Auto-arrange selected objects in a clean grid or row.
   * If 1 selected: center on canvas.
   * If 2-3: align horizontally.
   * If 4+: arrange in a grid.
   */
  autoArrangeSelection(): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active) return;

    const canvasW = this._canvasWidth();
    const canvasH = this._canvasHeight();

    if (!(active instanceof fabric.ActiveSelection)) {
      // Single object: center on canvas
      const bound = active.getBoundingRect();
      active.set({
        left: (active.left ?? 0) + (canvasW / 2 - (bound.left + bound.width / 2)),
        top: (active.top ?? 0) + (canvasH / 2 - (bound.top + bound.height / 2)),
      });
      active.setCoords();
      this.canvas.renderAll();
      return;
    }

    const objects = (active as fabric.ActiveSelection).getObjects();
    if (objects.length === 0) return;

    // Compute total bounding box of selection
    const bounds = objects.map(o => o.getBoundingRect());
    const minLeft = Math.min(...bounds.map(b => b.left));
    const minTop = Math.min(...bounds.map(b => b.top));
    const maxRight = Math.max(...bounds.map(b => b.left + b.width));
    const maxBottom = Math.max(...bounds.map(b => b.top + b.height));
    const selW = maxRight - minLeft;
    const selH = maxBottom - minTop;
    const padding = 16;

    if (objects.length <= 3) {
      // Arrange in a row, equal spacing
      const totalWidth = bounds.reduce((sum, b) => sum + b.width, 0);
      const gap = padding;
      const rowWidth = totalWidth + gap * (objects.length - 1);
      const startLeft = canvasW / 2 - rowWidth / 2;
      const centerY = canvasH / 2;

      let cursor = startLeft;
      for (let i = 0; i < objects.length; i++) {
        const o = objects[i];
        const b = bounds[i];
        const targetLeft = cursor;
        const targetTop = centerY - b.height / 2;
        o.set({
          left: (o.left ?? 0) + (targetLeft - b.left),
          top: (o.top ?? 0) + (targetTop - b.top),
        });
        o.setCoords();
        cursor += b.width + gap;
      }
    } else {
      // Grid arrangement
      const cols = Math.ceil(Math.sqrt(objects.length));
      const rows = Math.ceil(objects.length / cols);
      const cellW = Math.max(...bounds.map(b => b.width)) + padding;
      const cellH = Math.max(...bounds.map(b => b.height)) + padding;
      const gridW = cellW * cols;
      const gridH = cellH * rows;
      const startLeft = canvasW / 2 - gridW / 2;
      const startTop = canvasH / 2 - gridH / 2;

      for (let i = 0; i < objects.length; i++) {
        const o = objects[i];
        const b = bounds[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const targetLeft = startLeft + col * cellW + (cellW - b.width) / 2;
        const targetTop = startTop + row * cellH + (cellH - b.height) / 2;
        o.set({
          left: (o.left ?? 0) + (targetLeft - b.left),
          top: (o.top ?? 0) + (targetTop - b.top),
        });
        o.setCoords();
      }
    }

    active.setCoords();
    this.canvas.renderAll();
  }

  /**
   * Smart fix: detect overlapping objects and nudge them apart.
   */
  fixOverlaps(): number {
    if (!this.canvas) return 0;
    const objects = this.canvas.getObjects().filter(
      o => !(o as any)._isGuideline && !(o as any)._isGrid
    );

    let fixedCount = 0;
    const padding = 8;

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i].getBoundingRect();
        const b = objects[j].getBoundingRect();

        // Check overlap
        const overlapX = Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left));
        const overlapY = Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));

        if (overlapX > 5 && overlapY > 5) {
          // Move B to the right or below A, whichever is smaller move
          if (overlapX <= overlapY) {
            const delta = overlapX + padding;
            objects[j].set('left', (objects[j].left ?? 0) + delta);
          } else {
            const delta = overlapY + padding;
            objects[j].set('top', (objects[j].top ?? 0) + delta);
          }
          objects[j].setCoords();
          fixedCount++;
        }
      }
    }

    if (fixedCount > 0) this.canvas.renderAll();
    return fixedCount;
  }

  // ============================
  // Distribute objects
  // ============================

  /**
   * Distribute the objects of a multi-selection evenly along an axis.
   *
   * @param direction - `'horizontal'` or `'vertical'`.
   * @remarks Noop unless the active selection contains ≥ 3 objects.
   */
  distributeObjects(direction: 'horizontal' | 'vertical'): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active || !(active instanceof fabric.ActiveSelection)) return;

    const objects = (active as fabric.ActiveSelection).getObjects();
    if (objects.length < 3) return;

    if (direction === 'horizontal') {
      const sorted = [...objects].sort((a, b) => {
        const aLeft = a.getBoundingRect().left;
        const bLeft = b.getBoundingRect().left;
        return aLeft - bLeft;
      });

      const first = sorted[0].getBoundingRect();
      const last = sorted[sorted.length - 1].getBoundingRect();
      const totalWidth = sorted.reduce((sum, o) => sum + o.getBoundingRect().width, 0);
      const totalSpan = (last.left + last.width) - first.left;
      const gap = (totalSpan - totalWidth) / (sorted.length - 1);

      let currentX = first.left;
      for (const obj of sorted) {
        const bound = obj.getBoundingRect();
        const offsetX = currentX - bound.left;
        obj.set('left', (obj.left ?? 0) + offsetX);
        obj.setCoords();
        currentX += bound.width + gap;
      }
    } else {
      const sorted = [...objects].sort((a, b) => {
        const aTop = a.getBoundingRect().top;
        const bTop = b.getBoundingRect().top;
        return aTop - bTop;
      });

      const first = sorted[0].getBoundingRect();
      const last = sorted[sorted.length - 1].getBoundingRect();
      const totalHeight = sorted.reduce((sum, o) => sum + o.getBoundingRect().height, 0);
      const totalSpan = (last.top + last.height) - first.top;
      const gap = (totalSpan - totalHeight) / (sorted.length - 1);

      let currentY = first.top;
      for (const obj of sorted) {
        const bound = obj.getBoundingRect();
        const offsetY = currentY - bound.top;
        obj.set('top', (obj.top ?? 0) + offsetY);
        obj.setCoords();
        currentY += bound.height + gap;
      }
    }

    this.canvas.renderAll();
  }

  // ============================
  // Basic operations
  // ============================

  /** Delete the currently-selected object and drop its associated layer. */
  removeActiveObject(): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active) return;

    const layerId = (active as any).layerId;
    this.canvas.remove(active);
    this.canvas.renderAll();

    this._layers.update(layers => layers.filter(l => l.id !== layerId));
    this._activeLayerId.set(null);
  }

  /**
   * Apply a Canva-style zoom: both the DOM canvas size and the fabric
   * viewport transform scale together so the page boundary visibly grows
   * or shrinks.
   *
   * @param zoom - Zoom factor (1 = 100%).
   */
  setZoom(zoom: number): void {
    if (!this.canvas) return;

    // Canva-style zoom: the canvas element itself grows/shrinks with the zoom
    // so the user sees the page boundary change size (not just the content).
    // We combine setDimensions (physical DOM size) with setZoom (viewport
    // transform scaling the content to match).
    const designW = this._canvasWidth();
    const designH = this._canvasHeight();
    const displayW = Math.round(designW * zoom);
    const displayH = Math.round(designH * zoom);

    this._zoom.set(zoom);
    this.canvas.setDimensions({ width: displayW, height: displayH });
    this.canvas.setZoom(zoom);
    // Reset any pan so the design is fully visible inside the new canvas size
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    this.canvas.renderAll();
  }

  /**
   * Resize the logical canvas (does not rescale existing content).
   *
   * @param width - New canvas width (design px).
   * @param height - New canvas height (design px).
   */
  setCanvasSize(width: number, height: number): void {
    if (!this.canvas) return;
    this._canvasWidth.set(width);
    this._canvasHeight.set(height);
    // Apply dimensions at the current zoom so the canvas stays visually correct
    const zoom = this._zoom();
    this.canvas.setDimensions({ width: Math.round(width * zoom), height: Math.round(height * zoom) });
    this.canvas.setZoom(zoom);
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    this.canvas.renderAll();
  }

  /**
   * Magic resize: intelligently repositions content for new aspect ratio.
   * Uses uniform scale (smaller of x/y) to preserve readability,
   * then re-centers each element relatively.
   */
  magicResize(newWidth: number, newHeight: number): void {
    if (!this.canvas) return;

    const oldWidth = this._canvasWidth();
    const oldHeight = this._canvasHeight();
    if (oldWidth <= 0 || oldHeight <= 0) {
      this.setCanvasSize(newWidth, newHeight);
      return;
    }

    const scaleX = newWidth / oldWidth;
    const scaleY = newHeight / oldHeight;
    // Use smaller scale to keep things readable
    const uniformScale = Math.min(scaleX, scaleY);

    this.canvas.getObjects().forEach(obj => {
      if ((obj as any)._isGuideline || (obj as any)._isGrid) return;

      // Position: scale relative to canvas center
      const oldCenterX = oldWidth / 2;
      const oldCenterY = oldHeight / 2;
      const newCenterX = newWidth / 2;
      const newCenterY = newHeight / 2;

      const dx = (obj.left ?? 0) - oldCenterX;
      const dy = (obj.top ?? 0) - oldCenterY;

      obj.set({
        left: newCenterX + dx * scaleX,
        top: newCenterY + dy * scaleY,
        scaleX: (obj.scaleX ?? 1) * uniformScale,
        scaleY: (obj.scaleY ?? 1) * uniformScale,
      });
      obj.setCoords();
    });

    this._canvasWidth.set(newWidth);
    this._canvasHeight.set(newHeight);
    const zoom = this._zoom();
    this.canvas.setDimensions({ width: Math.round(newWidth * zoom), height: Math.round(newHeight * zoom) });
    this.canvas.setZoom(zoom);
    this.canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);

    if (this._showGrid()) {
      this.drawGrid();
    }

    this.canvas.renderAll();
  }

  /**
   * Resize the canvas, optionally rescaling the existing content.
   *
   * @param width - New canvas width (design px).
   * @param height - New canvas height (design px).
   * @param scaleContent - When true, every non-guide object is scaled
   * proportionally so the design fills the new canvas.
   */
  resizeCanvasWithScale(width: number, height: number, scaleContent: boolean): void {
    if (!this.canvas) return;

    const oldWidth = this._canvasWidth();
    const oldHeight = this._canvasHeight();

    if (scaleContent && oldWidth > 0 && oldHeight > 0) {
      const scaleX = width / oldWidth;
      const scaleY = height / oldHeight;

      this.canvas.getObjects().forEach(obj => {
        if ((obj as any)._isGuideline || (obj as any)._isGrid) return;

        obj.set({
          left: (obj.left ?? 0) * scaleX,
          top: (obj.top ?? 0) * scaleY,
          scaleX: (obj.scaleX ?? 1) * scaleX,
          scaleY: (obj.scaleY ?? 1) * scaleY,
        });
        obj.setCoords();
      });
    }

    this._canvasWidth.set(width);
    this._canvasHeight.set(height);
    const zoomR = this._zoom();
    this.canvas.setDimensions({ width: Math.round(width * zoomR), height: Math.round(height * zoomR) });
    this.canvas.setZoom(zoomR);
    this.canvas.setViewportTransform([zoomR, 0, 0, zoomR, 0, 0]);

    // Redraw grid if visible
    if (this._showGrid()) {
      this.drawGrid();
    }

    this.canvas.renderAll();
  }

  /** Remove every object + layer and deselect any active object. */
  clearCanvas(): void {
    if (!this.canvas) return;
    this.canvas.clear();
    this._layers.set([]);
    this._activeLayerId.set(null);
  }

  /**
   * Export the current canvas state as a data URL.
   *
   * @param format - `'png'` (default) | `'webp'` | `'jpeg'`.
   * @param quality - 0..1; applies to lossy formats.
   * @param multiplier - Resolution multiplier; `2` doubles the pixel count.
   * @returns A data URL, or `''` if the canvas is uninitialized.
   */
  toDataURL(format: 'png' | 'webp' | 'jpeg' = 'png', quality = 1, multiplier = 1): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL({ format, quality, multiplier });
  }

  /**
   * Serialize the full canvas state to JSON string.
   */
  getCanvasJSON(): string {
    if (!this.canvas) return '{}';
    return JSON.stringify(this.canvas.toJSON());
  }

  /**
   * Generate a small thumbnail of the current canvas.
   */
  getThumbnail(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL({ format: 'png', quality: 0.6, multiplier: 0.25 });
  }

  /**
   * Load canvas state from a previously saved JSON string.
   */
  async loadFromJSON(json: string): Promise<void> {
    if (!this.canvas || !json || json === '{}') return;

    try {
      const parsed = JSON.parse(json);
      await this.canvas.loadFromJSON(parsed);
      this.canvas.renderAll();

      // Rebuild layers from canvas objects
      const layers: Layer[] = [];
      this.canvas.getObjects().forEach((obj, i) => {
        if ((obj as any)._isGuideline) return;

        const layerId = (obj as any).layerId || uuidv4();
        (obj as any).layerId = layerId;

        let type = LayerType.Shape;
        if (obj instanceof fabric.FabricImage) type = LayerType.Image;
        else if (obj instanceof fabric.IText || obj instanceof fabric.FabricText) type = LayerType.Text;

        layers.push({
          id: layerId,
          name: this.getLayerName(obj, type),
          type,
          visible: obj.visible ?? true,
          locked: false,
          opacity: obj.opacity ?? 1,
          order: i,
          data: {},
        });
      });

      this._layers.set(layers);
    } catch (e) {
      console.error('Failed to load canvas state:', e);
    }
  }

  private getLayerName(obj: fabric.FabricObject, type: LayerType): string {
    if (type === LayerType.Text && 'text' in obj) {
      return ((obj as any).text as string)?.substring(0, 20) ?? 'Text';
    }
    if (type === LayerType.Image) return 'Image Layer';
    return 'Shape';
  }

  // ============================
  // Layer visibility & locking
  // ============================

  /**
   * Toggle a layer's visibility flag (affects both canvas + layer panel).
   *
   * @param layerId - Layer identifier.
   */
  toggleLayerVisibility(layerId: string): void {
    if (!this.canvas) return;

    const obj = this.canvas.getObjects().find(o => (o as any).layerId === layerId);
    if (!obj) return;

    const newVisible = !obj.visible;
    obj.visible = newVisible;
    this.canvas.renderAll();

    this._layers.update(layers =>
      layers.map(l => l.id === layerId ? { ...l, visible: newVisible } : l)
    );
  }

  /**
   * Toggle a layer's lock flag. Locked objects become non-selectable +
   * non-evented; the active layer clears if the target was locked.
   *
   * @param layerId - Layer identifier.
   */
  toggleLayerLock(layerId: string): void {
    if (!this.canvas) return;

    const obj = this.canvas.getObjects().find(o => (o as any).layerId === layerId);
    if (!obj) return;

    const layer = this._layers().find(l => l.id === layerId);
    const newLocked = !(layer?.locked ?? false);

    obj.selectable = !newLocked;
    obj.evented = !newLocked;

    if (newLocked && this._activeLayerId() === layerId) {
      this.canvas.discardActiveObject();
      this._activeLayerId.set(null);
    }

    this.canvas.renderAll();

    this._layers.update(layers =>
      layers.map(l => l.id === layerId ? { ...l, locked: newLocked } : l)
    );
  }

  /**
   * Move a layer from one index to another; also reorders the Fabric
   * objects to match (layer[0] is bottom, layer[last] is top).
   *
   * @param previousIndex - Source index.
   * @param currentIndex - Destination index.
   */
  reorderLayers(previousIndex: number, currentIndex: number): void {
    if (!this.canvas || previousIndex === currentIndex) return;

    const layers = [...this._layers()];
    const [moved] = layers.splice(previousIndex, 1);
    layers.splice(currentIndex, 0, moved);

    // Update order field
    layers.forEach((l, i) => l.order = i);
    this._layers.set(layers);

    // Reorder Fabric.js objects to match — layers[0] is bottom, layers[last] is top
    const canvasObjects = this.canvas.getObjects().filter(o => !(o as any)._isGuideline);
    const objMap = new Map<string, fabric.FabricObject>();
    canvasObjects.forEach(o => objMap.set((o as any).layerId, o));

    for (let i = 0; i < layers.length; i++) {
      const obj = objMap.get(layers[i].id);
      if (obj) {
        (this.canvas as any).moveObjectTo(obj, i);
      }
    }

    this.canvas.renderAll();
  }

  /**
   * Set a layer's opacity.
   *
   * @param layerId - Layer identifier.
   * @param opacity - 0..1.
   */
  setLayerOpacity(layerId: string, opacity: number): void {
    if (!this.canvas) return;

    const obj = this.canvas.getObjects().find(o => (o as any).layerId === layerId);
    if (!obj) return;

    obj.set('opacity', opacity);
    this.canvas.renderAll();

    this._layers.update(layers =>
      layers.map(l => l.id === layerId ? { ...l, opacity } : l)
    );
  }

  /**
   * Make a layer the active fabric object (and sync `activeLayerId`).
   *
   * @param layerId - Layer identifier.
   */
  selectLayer(layerId: string): void {
    if (!this.canvas) return;

    const obj = this.canvas.getObjects().find(o => (o as any).layerId === layerId);
    if (!obj || !obj.selectable) return;

    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
    this._activeLayerId.set(layerId);
  }

  // ============================
  // Eyedropper
  // ============================

  private readonly _isEyedropper = signal(false);
  private eyedropperCallback: ((color: string) => void) | null = null;
  private eyedropperHandler: ((e: MouseEvent) => void) | null = null;

  readonly isEyedropper = this._isEyedropper.asReadonly();

  /**
   * Enter eyedropper mode. The next canvas click samples the pixel color
   * under the pointer and invokes {@link callback} with a `#rrggbb` hex.
   *
   * @param callback - Receives the sampled color.
   */
  startEyedropper(callback: (color: string) => void): void {
    if (!this.canvas) return;

    this._isEyedropper.set(true);
    this.eyedropperCallback = callback;
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.hoverCursor = 'crosshair';
    this.canvas.selection = false;
    this.canvas.getObjects().forEach(o => o.set('evented', false));

    const canvasEl = this.canvas.getElement();

    this.eyedropperHandler = (e: MouseEvent) => {
      const rect = canvasEl.getBoundingClientRect();
      const x = Math.floor(e.clientX - rect.left);
      const y = Math.floor(e.clientY - rect.top);

      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]]
        .map(v => v.toString(16).padStart(2, '0')).join('');

      this.eyedropperCallback?.(hex);
      this.stopEyedropper();
    };

    canvasEl.addEventListener('click', this.eyedropperHandler);
  }

  /** Exit eyedropper mode; restores cursors and layer lock state. */
  stopEyedropper(): void {
    if (!this.canvas) return;

    this._isEyedropper.set(false);
    this.canvas.defaultCursor = 'default';
    this.canvas.hoverCursor = 'move';
    this.canvas.selection = true;

    // Restore evented state
    const layers = this._layers();
    this.canvas.getObjects().forEach(o => {
      const lid = (o as any).layerId;
      const layer = layers.find(l => l.id === lid);
      o.set('evented', layer ? !layer.locked : true);
    });

    if (this.eyedropperHandler) {
      this.canvas.getElement().removeEventListener('click', this.eyedropperHandler);
      this.eyedropperHandler = null;
    }
    this.eyedropperCallback = null;
  }

  // ============================
  // Freehand Drawing
  // ============================

  /** Toggle freehand drawing mode (pencil brush). */
  toggleDrawingMode(): void {
    if (!this.canvas) return;

    const newState = !this._isDrawing();
    this._isDrawing.set(newState);
    this.canvas.isDrawingMode = newState;

    if (newState) {
      const brush = new fabric.PencilBrush(this.canvas);
      brush.color = this._brushColor();
      brush.width = this._brushSize();
      this.canvas.freeDrawingBrush = brush;

      // When drawing finishes, create a layer for the path
      this.canvas.on('path:created', this.onPathCreated);
    } else {
      this.canvas.off('path:created', this.onPathCreated);
    }
  }

  /**
   * Set the freehand-brush color. Applies immediately if drawing is active.
   *
   * @param color - CSS color string.
   */
  setBrushColor(color: string): void {
    this._brushColor.set(color);
    if (this.canvas?.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = color;
    }
  }

  /**
   * Set the freehand-brush stroke width.
   *
   * @param size - Stroke width in pixels.
   */
  setBrushSize(size: number): void {
    this._brushSize.set(size);
    if (this.canvas?.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.width = size;
    }
  }

  private onPathCreated = (e: any): void => {
    const path = e.path as fabric.Path;
    if (!path) return;

    const layerId = uuidv4();
    (path as any).layerId = layerId;

    this.addLayer({
      id: layerId,
      name: 'Drawing',
      type: LayerType.Shape,
      visible: true,
      locked: false,
      opacity: 1,
      order: this._layers().length,
      data: {},
    });
  };

  // ============================
  // Focal Blur (radial)
  // ============================

  /**
   * Apply a focal-point blur to the selected image: a circle stays sharp,
   * everything outside is blurred. Implemented by overlaying a blurred
   * copy of the image clipped to a "donut" shape outside the focal circle.
   */
  async applyFocalBlur(centerX: number, centerY: number, radius: number, blurAmount: number): Promise<void> {
    if (!this.canvas) return;
    const obj = this.canvas.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return;

    const baseImg = obj as fabric.FabricImage;
    const layerId = (baseImg as any).layerId;

    // Save original transforms
    const props = {
      left: baseImg.left, top: baseImg.top,
      scaleX: baseImg.scaleX, scaleY: baseImg.scaleY,
      angle: baseImg.angle, opacity: baseImg.opacity,
      originX: baseImg.originX, originY: baseImg.originY,
    };
    const srcEl = baseImg.getElement() as HTMLImageElement | HTMLCanvasElement;
    if (!srcEl) return;

    // Clone the image and apply blur filter
    const blurredCanvas = document.createElement('canvas');
    const w = baseImg.width ?? srcEl.width;
    const h = baseImg.height ?? srcEl.height;
    blurredCanvas.width = w;
    blurredCanvas.height = h;
    const ctx = blurredCanvas.getContext('2d')!;
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.drawImage(srcEl as any, 0, 0, w, h);

    // Mask out the focal circle (in image coords) so the donut only covers the blurred ring
    const imgBound = baseImg.getBoundingRect();
    const imgScaleX = (baseImg.scaleX ?? 1);
    const imgScaleY = (baseImg.scaleY ?? 1);
    const localCx = (centerX - imgBound.left) / imgScaleX;
    const localCy = (centerY - imgBound.top) / imgScaleY;
    const localR = radius / Math.max(imgScaleX, imgScaleY);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(localCx, localCy, localR, 0, Math.PI * 2);
    ctx.fill();

    // Convert result canvas to a Fabric image overlay
    const overlayUrl = blurredCanvas.toDataURL('image/png');
    const overlayEl = new Image();
    await new Promise<void>((resolve, reject) => {
      overlayEl.onload = () => resolve();
      overlayEl.onerror = (e) => reject(e);
      overlayEl.src = overlayUrl;
    });

    const overlay = new fabric.FabricImage(overlayEl);
    overlay.set({
      ...props,
      scaleX: imgScaleX,
      scaleY: imgScaleY,
    } as any);
    (overlay as any)._isFocalBlurOverlay = true;
    (overlay as any).layerId = uuidv4();

    this.canvas.add(overlay);
    // Place overlay directly above the original image
    (this.canvas as any).moveObjectTo(overlay, this.canvas.getObjects().indexOf(baseImg) + 1);

    this.canvas.renderAll();
  }

  // ============================
  // Crop
  // ============================

  private readonly _isCropping = signal(false);
  private readonly _cropAspectRatio = signal<number | null>(null);
  private cropRect: fabric.Rect | null = null;
  private cropTarget: fabric.FabricImage | null = null;

  readonly isCropping = this._isCropping.asReadonly();
  readonly cropAspectRatio = this._cropAspectRatio.asReadonly();

  /**
   * Set (or clear) the aspect-ratio lock for the crop tool.
   *
   * @param ratio - width/height, or null for free crop.
   */
  setCropAspectRatio(ratio: number | null): void {
    this._cropAspectRatio.set(ratio);
    if (this.cropRect && ratio !== null) {
      // Resize crop rect to match new ratio, keeping width
      const w = (this.cropRect.width ?? 100) * (this.cropRect.scaleX ?? 1);
      this.cropRect.set({
        scaleX: 1,
        scaleY: 1,
        width: w,
        height: w / ratio,
      });
      this.cropRect.setCoords();
      this.canvas?.renderAll();
    }
  }

  /**
   * Enter crop mode for the active image.
   *
   * @remarks Noop unless the active object is a `FabricImage`.
   * Overlays a draggable crop rectangle honoring {@link setCropAspectRatio}.
   */
  startCrop(): void {
    if (!this.canvas) return;
    const obj = this.canvas.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return;

    this._isCropping.set(true);
    this.cropTarget = obj;

    const bound = obj.getBoundingRect();
    let cropW = bound.width - 20;
    let cropH = bound.height - 20;

    // Apply current aspect ratio if set
    const ratio = this._cropAspectRatio();
    if (ratio !== null) {
      cropH = cropW / ratio;
      if (cropH > bound.height - 20) {
        cropH = bound.height - 20;
        cropW = cropH * ratio;
      }
    }

    this.cropRect = new fabric.Rect({
      left: bound.left + (bound.width - cropW) / 2,
      top: bound.top + (bound.height - cropH) / 2,
      width: cropW,
      height: cropH,
      fill: 'rgba(0,0,0,0.3)',
      stroke: '#06b6d4',
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      cornerColor: '#06b6d4',
      cornerSize: 10,
      transparentCorners: false,
      hasRotatingPoint: false,
      lockRotation: true,
      // Lock uniform scaling when ratio is set
      lockUniScaling: ratio !== null,
    });

    (this.cropRect as any)._isCropRect = true;

    // Maintain aspect ratio on scaling
    if (ratio !== null) {
      this.cropRect.on('scaling', () => {
        if (!this.cropRect) return;
        const scaleX = this.cropRect.scaleX ?? 1;
        const newW = (this.cropRect.width ?? 0) * scaleX;
        this.cropRect.set({
          scaleY: scaleX,
          height: newW / ratio / scaleX,
        });
      });
    }

    this.canvas.add(this.cropRect);
    this.canvas.setActiveObject(this.cropRect);
    this.canvas.renderAll();
  }

  /** Commit the active crop rectangle as the image's clip path. */
  applyCrop(): void {
    if (!this.canvas || !this.cropRect || !this.cropTarget) return;

    const img = this.cropTarget;
    const rect = this.cropRect;

    // Calculate crop area relative to image
    const imgBound = img.getBoundingRect();
    const scaleX = img.scaleX ?? 1;
    const scaleY = img.scaleY ?? 1;

    const cropLeft = ((rect.left ?? 0) - imgBound.left) / scaleX;
    const cropTop = ((rect.top ?? 0) - imgBound.top) / scaleY;
    const cropWidth = ((rect.width ?? 0) * (rect.scaleX ?? 1)) / scaleX;
    const cropHeight = ((rect.height ?? 0) * (rect.scaleY ?? 1)) / scaleY;

    // Apply clipPath
    const clipRect = new fabric.Rect({
      left: cropLeft,
      top: cropTop,
      width: cropWidth,
      height: cropHeight,
      absolutePositioned: false,
    });

    img.clipPath = clipRect;

    this.canvas.remove(rect);
    this.cropRect = null;
    this.cropTarget = null;
    this._isCropping.set(false);

    this.canvas.setActiveObject(img);
    this.canvas.renderAll();
  }

  /** Cancel crop mode, discarding the overlay rectangle. */
  cancelCrop(): void {
    if (!this.canvas || !this.cropRect) return;

    this.canvas.remove(this.cropRect);
    this.cropRect = null;
    this.cropTarget = null;
    this._isCropping.set(false);
    this.canvas.renderAll();
  }

  // ============================
  // Grid
  // ============================

  /** Toggle the visual pixel grid. */
  toggleGrid(): void {
    this._showGrid.update(v => !v);
    if (this._showGrid()) {
      this.drawGrid();
    } else {
      this.clearGrid();
    }
  }

  /** Toggle snap-to-grid for object movement. */
  toggleSnapToGrid(): void {
    this._snapToGrid.update(v => !v);
  }

  /** Toggle snap-to-rule-of-thirds for object movement. */
  toggleSnapToThirds(): void {
    this._snapToThirds.update(v => !v);
  }

  /**
   * Toggle print mode — shows bleed (3mm outside), trim (canvas edge),
   * and safe zone (3mm inside) guides. Purely visual, non-destructive.
   * Assumes canvas dimensions are in pixels at ~96 DPI; 3mm ≈ 11px.
   */
  togglePrintMode(): void {
    this._printMode.update(v => !v);
    if (this._printMode()) {
      this.drawPrintGuides();
    } else {
      this.clearPrintGuides();
    }
  }

  private drawPrintGuides(): void {
    if (!this.canvas) return;
    this.clearPrintGuides();

    const w = this._canvasWidth();
    const h = this._canvasHeight();
    const bleed = 11;  // ~3mm at 96 DPI
    const safe = 11;   // ~3mm inside

    // Bleed rectangle (outside canvas — drawn relative to canvas with negative offset)
    const bleedRect = new fabric.Rect({
      left: -bleed, top: -bleed,
      width: w + bleed * 2,
      height: h + bleed * 2,
      fill: '',
      stroke: '#ec4899',
      strokeWidth: 1,
      strokeDashArray: [8, 4],
      selectable: false, evented: false, excludeFromExport: true,
    });

    // Trim (canvas edge)
    const trimRect = new fabric.Rect({
      left: 0, top: 0,
      width: w, height: h,
      fill: '',
      stroke: '#10b981',
      strokeWidth: 1.5,
      selectable: false, evented: false, excludeFromExport: true,
    });

    // Safe zone (inside)
    const safeRect = new fabric.Rect({
      left: safe, top: safe,
      width: w - safe * 2,
      height: h - safe * 2,
      fill: '',
      stroke: '#06b6d4',
      strokeWidth: 1,
      strokeDashArray: [4, 4],
      selectable: false, evented: false, excludeFromExport: true,
    });

    for (const r of [bleedRect, trimRect, safeRect]) {
      (r as any)._isGrid = true;
      this.printGuides.push(r);
      this.canvas.add(r);
      this.canvas.bringObjectToFront(r);
    }

    this.canvas.renderAll();
  }

  private clearPrintGuides(): void {
    if (!this.canvas) return;
    for (const g of this.printGuides) this.canvas.remove(g);
    this.printGuides = [];
    this.canvas.renderAll();
  }

  /** Toggle visibility of the rule-of-thirds overlay. */
  toggleShowThirds(): void {
    this._showThirds.update(v => !v);
    if (this._showThirds()) {
      this.drawThirds();
    } else {
      this.clearThirds();
    }
  }

  private drawThirds(): void {
    if (!this.canvas) return;
    this.clearThirds();

    const w = this._canvasWidth();
    const h = this._canvasHeight();
    const color = '#06b6d4';

    const positions = [
      { x1: w / 3, y1: 0, x2: w / 3, y2: h },
      { x1: (w * 2) / 3, y1: 0, x2: (w * 2) / 3, y2: h },
      { x1: 0, y1: h / 3, x2: w, y2: h / 3 },
      { x1: 0, y1: (h * 2) / 3, x2: w, y2: (h * 2) / 3 },
    ];

    for (const p of positions) {
      const line = new fabric.Line([p.x1, p.y1, p.x2, p.y2], {
        stroke: color,
        strokeWidth: 0.8,
        strokeDashArray: [6, 6],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.5,
      });
      (line as any)._isGrid = true; // reuse grid bucket so other code skips it
      this.thirdsLines.push(line);
      this.canvas.add(line);
      this.canvas.sendObjectToBack(line);
    }

    this.canvas.renderAll();
  }

  private clearThirds(): void {
    if (!this.canvas) return;
    for (const line of this.thirdsLines) this.canvas.remove(line);
    this.thirdsLines = [];
    this.canvas.renderAll();
  }

  /**
   * Change the grid cell size.
   *
   * @param size - Cell size in design pixels.
   */
  setGridSize(size: number): void {
    this._gridSize.set(size);
    if (this._showGrid()) {
      this.clearGrid();
      this.drawGrid();
    }
  }

  private drawGrid(): void {
    if (!this.canvas) return;
    this.clearGrid();

    const w = this._canvasWidth();
    const h = this._canvasHeight();
    const step = this._gridSize();

    for (let x = step; x < w; x += step) {
      const line = new fabric.Line([x, 0, x, h], {
        stroke: '#3f3f46',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.4,
      });
      (line as any)._isGrid = true;
      this.gridLines.push(line);
      this.canvas.add(line);
      this.canvas.sendObjectToBack(line);
    }

    for (let y = step; y < h; y += step) {
      const line = new fabric.Line([0, y, w, y], {
        stroke: '#3f3f46',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        opacity: 0.4,
      });
      (line as any)._isGrid = true;
      this.gridLines.push(line);
      this.canvas.add(line);
      this.canvas.sendObjectToBack(line);
    }

    this.canvas.renderAll();
  }

  private clearGrid(): void {
    if (!this.canvas) return;
    for (const line of this.gridLines) {
      this.canvas.remove(line);
    }
    this.gridLines = [];
    this.canvas.renderAll();
  }

  /** Reset the pan component of the viewport transform (keeps current zoom). */
  resetViewport(): void {
    if (!this.canvas) return;
    const vpt = this.canvas.viewportTransform!;
    vpt[4] = 0;
    vpt[5] = 0;
    this.canvas.requestRenderAll();
  }

  private setupTouchGestures(): void {
    if (!this.canvas) return;

    const el = this.canvas.upperCanvasEl;
    let initialDistance = 0;
    let initialZoom = 1;
    let isPinching = false;
    let lastPanPoint: { x: number; y: number } | null = null;

    const getDistance = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getMidpoint = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    el.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialZoom = this.canvas!.getZoom();
        lastPanPoint = getMidpoint(e.touches[0], e.touches[1]);
        this.canvas!.selection = false;
      }
    }, { passive: false });

    el.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2 && isPinching) {
        e.preventDefault();

        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        let newZoom = Math.max(0.1, Math.min(5, initialZoom * scale));

        const midpoint = getMidpoint(e.touches[0], e.touches[1]);
        const rect = el.getBoundingClientRect();
        const zoomPoint = new fabric.Point(midpoint.x - rect.left, midpoint.y - rect.top);

        this.canvas!.zoomToPoint(zoomPoint, newZoom);
        this._zoom.set(newZoom);

        // Two-finger pan
        if (lastPanPoint) {
          const dx = midpoint.x - lastPanPoint.x;
          const dy = midpoint.y - lastPanPoint.y;
          const vpt = this.canvas!.viewportTransform!;
          vpt[4] += dx;
          vpt[5] += dy;
          this.canvas!.requestRenderAll();
          lastPanPoint = midpoint;
        }
      }
    }, { passive: false });

    el.addEventListener('touchend', (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinching = false;
        lastPanPoint = null;
        this.canvas!.selection = true;
      }
    });
  }

  private setupPanKeyListeners(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !this._isPanning()) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        this._isPanning.set(true);
        if (this.canvas) {
          this.canvas.selection = false;
          this.canvas.setCursor('grab');
          this.canvas.getObjects().forEach(o => o.set('evented', false));
          this.canvas.requestRenderAll();
        }
      }
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && this._isPanning()) {
        this._isPanning.set(false);
        this.panStartPoint = null;
        if (this.canvas) {
          this.canvas.selection = true;
          this.canvas.setCursor('default');
          // Restore evented state (respect locked layers)
          const layers = this._layers();
          this.canvas.getObjects().forEach(o => {
            const lid = (o as any).layerId;
            const layer = layers.find(l => l.id === lid);
            o.set('evented', layer ? !layer.locked : true);
          });
          this.canvas.requestRenderAll();
        }
      }
    };

    document.addEventListener('keydown', this.keydownHandler);
    document.addEventListener('keyup', this.keyupHandler);
  }

  /**
   * Tear down the canvas + listeners. Must be called from component
   * `ngOnDestroy` to avoid leaking document-level keyboard listeners.
   */
  dispose(): void {
    this.clearGuidelines();
    if (this.keydownHandler) document.removeEventListener('keydown', this.keydownHandler);
    if (this.keyupHandler) document.removeEventListener('keyup', this.keyupHandler);
    this.canvas?.dispose();
    this.canvas = null;
    this._layers.set([]);
    this._activeLayerId.set(null);
  }

  // ============================
  // Private helpers
  // ============================

  private addLayer(layer: Layer): void {
    this._layers.update(layers => [...layers, layer]);
    this._activeLayerId.set(layer.id);
  }

  private handleObjectSelection(obj?: fabric.FabricObject): void {
    if (obj && (obj as any).layerId) {
      this._activeLayerId.set((obj as any).layerId);
    }
  }

  private createStar(props: Record<string, any>): fabric.Polygon {
    const points: fabric.XY[] = [];
    const outerRadius = 100;
    const innerRadius = 45;
    const spikes = 5;

    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }

    return new fabric.Polygon(points, { ...props });
  }

  private createRegularPolygon(sides: number, radius: number, props: Record<string, any>): fabric.Polygon {
    const points: fabric.XY[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return new fabric.Polygon(points, { ...props });
  }

  private createArrow(props: Record<string, any>): fabric.Polygon {
    const points: fabric.XY[] = [
      { x: 0, y: -40 }, { x: 100, y: -40 }, { x: 100, y: -80 },
      { x: 180, y: 0 }, { x: 100, y: 80 }, { x: 100, y: 40 }, { x: 0, y: 40 },
    ];
    return new fabric.Polygon(points, { ...props });
  }
}
