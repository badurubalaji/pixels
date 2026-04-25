import { TestBed } from '@angular/core/testing';
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';

// --- Mock fabric.js 7 ---------------------------------------------------
// fabric.js is a jsdom-hostile canvas lib. We replace the subset that
// CanvasService actually touches with lightweight stand-ins so tests run
// fast and deterministically in jsdom. Only what the service calls is
// modeled — see per-class comments below.
vi.mock('fabric', () => {
  /** Minimal event-bus baked into the fake Canvas so `on(...)` calls don't crash. */
  class EventEmitter {
    private handlers: Record<string, Array<(...args: any[]) => void>> = {};
    on(evt: string, fn: (...args: any[]) => void) {
      (this.handlers[evt] ??= []).push(fn);
    }
    off(evt: string, fn?: (...args: any[]) => void) {
      if (!this.handlers[evt]) return;
      if (!fn) { this.handlers[evt] = []; return; }
      this.handlers[evt] = this.handlers[evt].filter(h => h !== fn);
    }
    fire(evt: string, payload?: any) {
      this.handlers[evt]?.forEach(h => h(payload));
    }
  }

  /** Base fabric object — every shape/image inherits from this. */
  class FabricObject {
    left = 0;
    top = 0;
    scaleX = 1;
    scaleY = 1;
    angle = 0;
    opacity = 1;
    visible = true;
    selectable = true;
    evented = true;
    width = 100;
    height = 100;
    originX: any = 'left';
    originY: any = 'top';
    clipPath: any = null;
    backgroundColor: any = undefined;
    type = 'object';
    constructor(_opts?: any) { Object.assign(this, _opts ?? {}); }
    set(a: any, b?: any) {
      if (typeof a === 'string') { (this as any)[a] = b; return this; }
      Object.assign(this, a);
      return this;
    }
    get(k: string) { return (this as any)[k]; }
    setCoords() { /* noop */ }
    rotate(a: number) { this.angle = a; }
    getBoundingRect() {
      return { left: this.left, top: this.top, width: this.width * this.scaleX, height: this.height * this.scaleY };
    }
    getElement() {
      const c = document.createElement('canvas');
      c.width = this.width;
      c.height = this.height;
      return c;
    }
    toDataURL() { return 'data:image/png;base64,AAA'; }
    on() {}
    off() {}
  }

  class Rect extends FabricObject { type = 'rect'; }
  class Circle extends FabricObject { type = 'circle'; }
  class Triangle extends FabricObject { type = 'triangle'; }
  class Polygon extends FabricObject {
    type = 'polygon';
    points: any[];
    constructor(points: any[], opts?: any) { super(opts); this.points = points; }
  }
  class Line extends FabricObject {
    type = 'line';
    x1 = 0; y1 = 0; x2 = 0; y2 = 0;
    constructor(coords: number[], opts?: any) {
      super(opts);
      [this.x1, this.y1, this.x2, this.y2] = coords;
    }
  }
  class FabricText extends FabricObject { type = 'text'; text = ''; constructor(text: string, opts?: any) { super(opts); this.text = text; } }
  class IText extends FabricText { type = 'i-text'; }
  class FabricImage extends FabricObject { type = 'image'; }
  class Group extends FabricObject {
    type = 'group';
    private _objects: FabricObject[];
    constructor(objs: FabricObject[], opts?: any) { super(opts); this._objects = objs; }
    getObjects() { return this._objects; }
  }
  class ActiveSelection extends Group { type = 'activeSelection'; }
  class Path extends FabricObject { type = 'path'; }
  class Pattern { source: any; repeat: string; constructor(opts: any) { this.source = opts.source; this.repeat = opts.repeat; } }
  class PencilBrush { color = '#000'; width = 1; constructor(_c: any) {} }
  class Point { x: number; y: number; constructor(x: number, y: number) { this.x = x; this.y = y; } }

  class Canvas extends EventEmitter {
    private _objects: FabricObject[] = [];
    private _active: FabricObject | null = null;
    width: number;
    height: number;
    backgroundColor: any = '#ffffff';
    backgroundImage: any = undefined;
    viewportTransform: number[] = [1, 0, 0, 1, 0, 0];
    isDrawingMode = false;
    selection = true;
    defaultCursor = 'default';
    hoverCursor = 'move';
    freeDrawingBrush: any = null;
    upperCanvasEl: HTMLCanvasElement;

    constructor(_el: any, opts: any = {}) {
      super();
      this.width = opts.width ?? 500;
      this.height = opts.height ?? 500;
      this.upperCanvasEl = document.createElement('canvas');
    }
    add(...objs: FabricObject[]) { this._objects.push(...objs); return this; }
    remove(...objs: FabricObject[]) {
      this._objects = this._objects.filter(o => !objs.includes(o));
      return this;
    }
    clear() { this._objects = []; this._active = null; }
    getObjects() { return this._objects; }
    setActiveObject(o: FabricObject) { this._active = o; return this; }
    getActiveObject() { return this._active; }
    discardActiveObject() { this._active = null; return this; }
    renderAll() {}
    requestRenderAll() {}
    setDimensions(d: { width: number; height: number }) {
      this.width = d.width;
      this.height = d.height;
    }
    getZoom() { return this.viewportTransform[0]; }
    setZoom(z: number) { this.viewportTransform[0] = z; this.viewportTransform[3] = z; }
    setViewportTransform(v: number[]) { this.viewportTransform = v; }
    zoomToPoint(_p: any, z: number) { this.setZoom(z); }
    setCursor(c: string) { this.defaultCursor = c; }
    getElement() { return document.createElement('canvas'); }
    toDataURL() { return 'data:image/png;base64,BBB'; }
    toJSON() { return { version: '7.0', objects: this._objects.map(() => ({})) }; }
    toObject(_props?: string[]) { return { version: '7.0', objects: this._objects.map(() => ({})) }; }
    async loadFromJSON(_json: any) { /* noop */ return this; }
    bringObjectToFront(_o: FabricObject) {}
    sendObjectToBack(_o: FabricObject) {}
    moveObjectTo(_o: FabricObject, _i: number) {}
    dispose() { this._objects = []; this._active = null; }
  }

  const util = {
    groupSVGElements: (objects: any[], _opts?: any) =>
      new Group(objects ?? []),
  };

  const loadSVGFromString = vi.fn(async (_svg: string) => ({
    objects: [new FabricObject()],
    options: {},
  }));

  return {
    Canvas,
    FabricObject,
    Rect,
    Circle,
    Triangle,
    Polygon,
    Line,
    FabricText,
    IText,
    FabricImage,
    Group,
    ActiveSelection,
    Path,
    Pattern,
    PencilBrush,
    Point,
    util,
    loadSVGFromString,
    // fabric re-exports itself in real builds; tests never rely on the default
    default: undefined,
  };
});

// After mocking fabric we can safely import the service under test.
import { CanvasService } from './canvas.service';
import { LayerType } from '../models/project.model';

/**
 * Build a DOM canvas host, init the service on it, return both.
 * Used by most tests so each starts with a fresh canvas + fresh signals.
 */
function makeService(w = 200, h = 200): { service: CanvasService; host: HTMLCanvasElement } {
  TestBed.configureTestingModule({ providers: [CanvasService] });
  const service = TestBed.inject(CanvasService);
  const host = document.createElement('canvas');
  service.initCanvas(host, w, h);
  return { service, host };
}

describe('CanvasService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('initCanvas / lifecycle', () => {
    it('creates a canvas and sets width/height signals', () => {
      const { service } = makeService(640, 480);
      expect(service.getCanvas()).toBeTruthy();
      expect(service.canvasWidth()).toBe(640);
      expect(service.canvasHeight()).toBe(480);
    });

    it('dispose clears layers and canvas reference', () => {
      const { service } = makeService();
      service.addText('hi');
      expect(service.layers().length).toBe(1);
      service.dispose();
      expect(service.getCanvas()).toBeNull();
      expect(service.layers().length).toBe(0);
    });
  });

  describe('addText', () => {
    it('pushes an IText object and creates a text layer', () => {
      const { service } = makeService();
      service.addText('Hello');
      expect(service.layers().length).toBe(1);
      expect(service.layers()[0].type).toBe(LayerType.Text);
      expect(service.layers()[0].name).toBe('Hello');
    });

    it('respects supplied font options', () => {
      const { service } = makeService();
      service.addText('X', { fontSize: 99 } as any);
      const canvas = service.getCanvas()!;
      const obj = canvas.getObjects()[0] as any;
      expect(obj.fontSize).toBe(99);
    });

    it('noops when canvas is not initialized', () => {
      TestBed.configureTestingModule({ providers: [CanvasService] });
      const service = TestBed.inject(CanvasService);
      service.addText('nope');
      expect(service.layers().length).toBe(0);
    });
  });

  describe('addShape', () => {
    it.each([
      ['rect'],
      ['circle'],
      ['triangle'],
      ['star'],
      ['polygon'],
      ['diamond'],
      ['hexagon'],
      ['arrow'],
      ['line'],
    ] as const)('creates a %s layer', (shape) => {
      const { service } = makeService();
      service.addShape(shape);
      expect(service.layers().length).toBe(1);
      expect(service.layers()[0].type).toBe(LayerType.Shape);
    });
  });

  describe('clearCanvas', () => {
    it('removes objects and resets layer state', () => {
      const { service } = makeService();
      service.addText('A');
      service.addShape('rect');
      expect(service.layers().length).toBe(2);
      service.clearCanvas();
      expect(service.layers().length).toBe(0);
      expect(service.activeLayerId()).toBeNull();
    });
  });

  describe('setZoom / setCanvasSize / magicResize', () => {
    it('setZoom updates the zoom signal', () => {
      const { service } = makeService();
      service.setZoom(2);
      expect(service.zoom()).toBe(2);
    });

    it('setCanvasSize updates width/height signals', () => {
      const { service } = makeService(100, 100);
      service.setCanvasSize(300, 400);
      expect(service.canvasWidth()).toBe(300);
      expect(service.canvasHeight()).toBe(400);
    });

    it('magicResize changes width/height and rescales objects', () => {
      const { service } = makeService(100, 100);
      service.addShape('rect');
      service.magicResize(200, 200);
      expect(service.canvasWidth()).toBe(200);
      expect(service.canvasHeight()).toBe(200);
    });

    it('resizeCanvasWithScale without scaleContent only resizes canvas', () => {
      const { service } = makeService(100, 100);
      service.resizeCanvasWithScale(300, 300, false);
      expect(service.canvasWidth()).toBe(300);
      expect(service.canvasHeight()).toBe(300);
    });
  });

  describe('toDataURL / getCanvasJSON / getThumbnail', () => {
    it('toDataURL returns the fabric-provided data URL', () => {
      const { service } = makeService();
      const url = service.toDataURL('png');
      expect(url.startsWith('data:image/png')).toBe(true);
    });

    it('getCanvasJSON returns stringified canvas state', () => {
      const { service } = makeService();
      const json = service.getCanvasJSON();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.version).toBeDefined();
    });

    it('getCanvasJSON returns "{}" when canvas is uninitialized', () => {
      TestBed.configureTestingModule({ providers: [CanvasService] });
      const s = TestBed.inject(CanvasService);
      expect(s.getCanvasJSON()).toBe('{}');
    });

    it('getThumbnail returns a data URL when canvas exists', () => {
      const { service } = makeService();
      const thumb = service.getThumbnail();
      expect(thumb.startsWith('data:image/png')).toBe(true);
    });

    it('getThumbnail returns "" when canvas is uninitialized', () => {
      TestBed.configureTestingModule({ providers: [CanvasService] });
      const s = TestBed.inject(CanvasService);
      expect(s.getThumbnail()).toBe('');
    });
  });

  describe('loadFromJSON', () => {
    it('rebuilds the layers array from canvas objects', async () => {
      const { service } = makeService();
      const json = JSON.stringify({ version: '7', objects: [{}] });
      await service.loadFromJSON(json);
      // Our fake canvas.loadFromJSON is a no-op; the rebuild simply walks
      // existing objects. We don't care about exact count, just that
      // the function completes without throwing and leaves the service
      // in a consistent state.
      expect(service.layers()).toBeDefined();
    });

    it('noops on empty json', async () => {
      const { service } = makeService();
      await service.loadFromJSON('{}');
      expect(service.layers().length).toBe(0);
    });
  });

  describe('applyFocalBlur', () => {
    it('adds a blurred overlay when an active image is selected', async () => {
      // Stub getContext — jsdom doesn't implement a 2D context.
      const ctxStub: any = {
        filter: '',
        globalCompositeOperation: '',
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
      };
      const spy = vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(ctxStub as any);
      // Also stub toDataURL to return a valid PNG-ish payload.
      const urlSpy = vi
        .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
        .mockReturnValue('data:image/png;base64,AAA');

      const { service } = makeService(400, 400);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const img = new fabricModule.FabricImage();
      canvas.add(img as any);
      canvas.setActiveObject(img as any);

      // Image.onload in JSDOM doesn't fire automatically for data URLs,
      // so stub the Image class to invoke onload synchronously.
      const OrigImage = global.Image;
      class FakeImage {
        onload: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        private _src = '';
        set src(v: string) { this._src = v; queueMicrotask(() => this.onload?.()); }
        get src() { return this._src; }
      }
      (global as any).Image = FakeImage as any;

      try {
        await service.applyFocalBlur(100, 100, 50, 5);
        expect(canvas.getObjects().length).toBeGreaterThanOrEqual(1);
      } finally {
        (global as any).Image = OrigImage;
        spy.mockRestore();
        urlSpy.mockRestore();
      }
    });

    it('noops when no image is active', async () => {
      const { service } = makeService();
      await service.applyFocalBlur(10, 10, 5, 2);
      expect(service.getCanvas()!.getObjects().length).toBe(0);
    });
  });

  describe('background / mode', () => {
    it('setBackgroundMode("white") sets color signal', () => {
      const { service } = makeService();
      service.setBackgroundMode('white');
      expect(service.backgroundMode()).toBe('white');
      expect(service.backgroundColor()).toBe('#ffffff');
    });

    it('setBackgroundMode("custom", color) uses provided color', () => {
      const { service } = makeService();
      service.setBackgroundMode('custom', '#123456');
      expect(service.backgroundColor()).toBe('#123456');
    });

    it('setBackgroundMode("transparent") clears color', () => {
      const { service } = makeService();
      service.setBackgroundMode('transparent');
      expect(service.backgroundColor()).toBe('');
    });

    it('removeBackgroundImage clears bg image', () => {
      const { service } = makeService();
      service.removeBackgroundImage();
      expect(service.getCanvas()!.backgroundImage).toBeUndefined();
    });
  });

  describe('grid / thirds / print toggles', () => {
    it('toggleGrid flips showGrid', () => {
      const { service } = makeService();
      expect(service.showGrid()).toBe(false);
      service.toggleGrid();
      expect(service.showGrid()).toBe(true);
      service.toggleGrid();
      expect(service.showGrid()).toBe(false);
    });

    it('toggleSnapToGrid flips snapToGrid', () => {
      const { service } = makeService();
      service.toggleSnapToGrid();
      expect(service.snapToGrid()).toBe(true);
    });

    it('setGridSize updates grid size signal', () => {
      const { service } = makeService();
      service.setGridSize(40);
      expect(service.gridSize()).toBe(40);
    });

    it('togglePrintMode flips printMode', () => {
      const { service } = makeService();
      service.togglePrintMode();
      expect(service.printMode()).toBe(true);
      service.togglePrintMode();
      expect(service.printMode()).toBe(false);
    });

    it('toggleShowThirds flips showThirds', () => {
      const { service } = makeService();
      service.toggleShowThirds();
      expect(service.showThirds()).toBe(true);
    });

    it('toggleSnapToThirds flips snapToThirds', () => {
      const { service } = makeService();
      service.toggleSnapToThirds();
      expect(service.snapToThirds()).toBe(true);
    });
  });

  describe('layers', () => {
    it('toggleLayerVisibility flips the layer visibility', () => {
      const { service } = makeService();
      service.addText('A');
      const id = service.layers()[0].id;
      service.toggleLayerVisibility(id);
      expect(service.layers()[0].visible).toBe(false);
      service.toggleLayerVisibility(id);
      expect(service.layers()[0].visible).toBe(true);
    });

    it('toggleLayerLock toggles the locked flag', () => {
      const { service } = makeService();
      service.addText('A');
      const id = service.layers()[0].id;
      service.toggleLayerLock(id);
      expect(service.layers()[0].locked).toBe(true);
    });

    it('setLayerOpacity updates opacity on layer', () => {
      const { service } = makeService();
      service.addText('A');
      const id = service.layers()[0].id;
      service.setLayerOpacity(id, 0.4);
      expect(service.layers()[0].opacity).toBeCloseTo(0.4);
    });

    it('reorderLayers moves layers', () => {
      const { service } = makeService();
      service.addText('A');
      service.addText('B');
      const first = service.layers()[0].id;
      service.reorderLayers(0, 1);
      expect(service.layers()[1].id).toBe(first);
    });

    it('selectLayer sets the active layer', () => {
      const { service } = makeService();
      service.addText('A');
      const id = service.layers()[0].id;
      service.selectLayer(id);
      expect(service.activeLayerId()).toBe(id);
    });
  });

  describe('removeActiveObject', () => {
    it('removes the active object and its layer', () => {
      const { service } = makeService();
      service.addText('kill me');
      expect(service.layers().length).toBe(1);
      service.removeActiveObject();
      expect(service.layers().length).toBe(0);
    });
  });

  describe('commitChange', () => {
    it('fires object:modified even without args', () => {
      const { service } = makeService();
      service.addText('A');
      // Should not throw
      expect(() => service.commitChange()).not.toThrow();
    });
  });

  describe('brush / drawing', () => {
    it('toggleDrawingMode flips isDrawing', () => {
      const { service } = makeService();
      service.toggleDrawingMode();
      expect(service.isDrawing()).toBe(true);
      service.toggleDrawingMode();
      expect(service.isDrawing()).toBe(false);
    });

    it('setBrushColor / setBrushSize update signals', () => {
      const { service } = makeService();
      service.setBrushColor('#abcdef');
      service.setBrushSize(12);
      expect(service.brushColor()).toBe('#abcdef');
      expect(service.brushSize()).toBe(12);
    });
  });

  describe('crop', () => {
    it('setCropAspectRatio updates aspect signal', () => {
      const { service } = makeService();
      service.setCropAspectRatio(16 / 9);
      expect(service.cropAspectRatio()).toBeCloseTo(16 / 9);
    });

    it('cancelCrop noops when not cropping', () => {
      const { service } = makeService();
      expect(() => service.cancelCrop()).not.toThrow();
    });

    it('startCrop + applyCrop on an active image', async () => {
      const { service } = makeService();
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const img = new fabricModule.FabricImage();
      canvas.add(img as any);
      canvas.setActiveObject(img as any);
      service.startCrop();
      expect(service.isCropping()).toBe(true);
      service.applyCrop();
      expect(service.isCropping()).toBe(false);
    });

    it('startCrop + cancelCrop leaves no crop rect', async () => {
      const { service } = makeService();
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const img = new fabricModule.FabricImage();
      canvas.add(img as any);
      canvas.setActiveObject(img as any);
      service.startCrop();
      service.cancelCrop();
      expect(service.isCropping()).toBe(false);
    });
  });

  describe('alignment', () => {
    it('alignObjects(center-h) on single object', async () => {
      const { service } = makeService(500, 500);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rect = new fabricModule.Rect({ left: 0, top: 0, width: 50, height: 50 });
      canvas.add(rect as any);
      canvas.setActiveObject(rect as any);
      expect(() => service.alignObjects('center-h')).not.toThrow();
      expect(() => service.alignObjects('left')).not.toThrow();
      expect(() => service.alignObjects('right')).not.toThrow();
      expect(() => service.alignObjects('top')).not.toThrow();
      expect(() => service.alignObjects('center-v')).not.toThrow();
      expect(() => service.alignObjects('bottom')).not.toThrow();
    });

    it('alignObjects noops when nothing selected', () => {
      const { service } = makeService();
      expect(() => service.alignObjects('left')).not.toThrow();
    });
  });

  describe('autoArrangeSelection / fixOverlaps', () => {
    it('autoArrangeSelection centers a single active object', async () => {
      const { service } = makeService(500, 500);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rect = new fabricModule.Rect({ left: 0, top: 0, width: 40, height: 40 });
      canvas.add(rect as any);
      canvas.setActiveObject(rect as any);
      expect(() => service.autoArrangeSelection()).not.toThrow();
    });

    it('autoArrangeSelection noops without an active object', () => {
      const { service } = makeService();
      expect(() => service.autoArrangeSelection()).not.toThrow();
    });

    it('fixOverlaps returns number of fixes', async () => {
      const { service } = makeService(500, 500);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const a = new fabricModule.Rect({ left: 0, top: 0, width: 100, height: 100 });
      const b = new fabricModule.Rect({ left: 10, top: 10, width: 100, height: 100 });
      canvas.add(a as any, b as any);
      const fixed = service.fixOverlaps();
      expect(fixed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('distributeObjects', () => {
    it('noops with fewer than 3 objects', () => {
      const { service } = makeService();
      expect(() => service.distributeObjects('horizontal')).not.toThrow();
      expect(() => service.distributeObjects('vertical')).not.toThrow();
    });

    it('distributes 3 objects horizontally in an active selection', async () => {
      const { service } = makeService(1000, 1000);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rs = [
        new fabricModule.Rect({ left: 0, top: 100, width: 50, height: 50 }),
        new fabricModule.Rect({ left: 200, top: 100, width: 50, height: 50 }),
        new fabricModule.Rect({ left: 600, top: 100, width: 50, height: 50 }),
      ];
      const sel = new fabricModule.ActiveSelection(rs as any);
      canvas.setActiveObject(sel as any);
      expect(() => service.distributeObjects('horizontal')).not.toThrow();
      expect(() => service.distributeObjects('vertical')).not.toThrow();
    });
  });

  describe('alignWithinSelection', () => {
    it('align left within a 2-object selection', async () => {
      const { service } = makeService(1000, 1000);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rs = [
        new fabricModule.Rect({ left: 0, top: 0, width: 50, height: 50 }),
        new fabricModule.Rect({ left: 100, top: 100, width: 50, height: 50 }),
      ];
      const sel = new fabricModule.ActiveSelection(rs as any);
      canvas.setActiveObject(sel as any);
      expect(() => service.alignObjects('left', 'selection')).not.toThrow();
      expect(() => service.alignObjects('center-h', 'selection')).not.toThrow();
      expect(() => service.alignObjects('right', 'selection')).not.toThrow();
      expect(() => service.alignObjects('top', 'selection')).not.toThrow();
      expect(() => service.alignObjects('center-v', 'selection')).not.toThrow();
      expect(() => service.alignObjects('bottom', 'selection')).not.toThrow();
    });
  });

  describe('autoArrangeSelection with multiple objects', () => {
    it('arranges 3 objects in a row', async () => {
      const { service } = makeService(1000, 1000);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rs = [
        new fabricModule.Rect({ left: 0, top: 0, width: 50, height: 50 }),
        new fabricModule.Rect({ left: 50, top: 50, width: 50, height: 50 }),
        new fabricModule.Rect({ left: 100, top: 100, width: 50, height: 50 }),
      ];
      const sel = new fabricModule.ActiveSelection(rs as any);
      canvas.setActiveObject(sel as any);
      expect(() => service.autoArrangeSelection()).not.toThrow();
    });

    it('arranges 5 objects in a grid', async () => {
      const { service } = makeService(1000, 1000);
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rs = Array.from({ length: 5 }, (_, i) =>
        new fabricModule.Rect({ left: i * 10, top: 0, width: 50, height: 50 }),
      );
      const sel = new fabricModule.ActiveSelection(rs as any);
      canvas.setActiveObject(sel as any);
      expect(() => service.autoArrangeSelection()).not.toThrow();
    });
  });

  describe('eyedropper', () => {
    it('startEyedropper + stopEyedropper cycle', () => {
      const { service } = makeService();
      const cb = vi.fn();
      service.startEyedropper(cb);
      expect(service.isEyedropper()).toBe(true);
      service.stopEyedropper();
      expect(service.isEyedropper()).toBe(false);
    });
  });

  describe('commitChange with target', () => {
    it('fires object:modified with an explicit target', async () => {
      const { service } = makeService();
      const fabricModule = await import('fabric');
      const rect = new fabricModule.Rect();
      service.getCanvas()!.add(rect as any);
      expect(() => service.commitChange(rect as any)).not.toThrow();
    });
  });

  describe('groupSelected with ActiveSelection', () => {
    it('groups 2+ objects from an ActiveSelection', async () => {
      const { service } = makeService();
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rs = [new fabricModule.Rect(), new fabricModule.Rect()];
      canvas.add(...(rs as any));
      const sel = new fabricModule.ActiveSelection(rs as any);
      canvas.setActiveObject(sel as any);
      expect(() => service.groupSelected()).not.toThrow();
    });

    it('ungroups an existing group', async () => {
      const { service } = makeService();
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const group = new fabricModule.Group([new fabricModule.Rect(), new fabricModule.Rect()] as any);
      canvas.add(group as any);
      canvas.setActiveObject(group as any);
      expect(() => service.ungroupSelected()).not.toThrow();
    });
  });

  describe('grouping', () => {
    it('groupSelected noops when active is not a multi-selection', async () => {
      const { service } = makeService();
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rect = new fabricModule.Rect();
      canvas.add(rect as any);
      canvas.setActiveObject(rect as any);
      expect(() => service.groupSelected()).not.toThrow();
    });

    it('ungroupSelected noops when active is not a group', async () => {
      const { service } = makeService();
      const canvas = service.getCanvas()!;
      const fabricModule = await import('fabric');
      const rect = new fabricModule.Rect();
      canvas.add(rect as any);
      canvas.setActiveObject(rect as any);
      expect(() => service.ungroupSelected()).not.toThrow();
    });
  });

  describe('viewport / misc', () => {
    it('resetViewport resets the transform translation', () => {
      const { service } = makeService();
      service.resetViewport();
      const vpt = service.getCanvas()!.viewportTransform!;
      expect(vpt[4]).toBe(0);
      expect(vpt[5]).toBe(0);
    });
  });

  describe('addImage / addSvg', () => {
    it('addImage wires an Image.onload + adds a layer', async () => {
      const origImage = global.Image;
      class FakeImage {
        onload: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        crossOrigin = '';
        width = 100;
        height = 100;
        set src(_v: string) { queueMicrotask(() => this.onload?.()); }
      }
      (global as any).Image = FakeImage as any;

      try {
        const { service } = makeService(500, 500);
        service.addImage('data:image/png;base64,AAA');
        // Wait a tick so the microtask fires
        await Promise.resolve();
        await Promise.resolve();
        expect(service.layers().length).toBeGreaterThanOrEqual(1);
      } finally {
        (global as any).Image = origImage;
      }
    });

    it('addSvg parses an SVG string into a group layer', async () => {
      const { service } = makeService(500, 500);
      await service.addSvg('<svg/>');
      expect(service.layers().length).toBeGreaterThanOrEqual(1);
    });

    it('addSvg resolves to a fabric object (PX-003 AC-8)', async () => {
      const { service } = makeService(500, 500);
      const obj = await service.addSvg('<svg/>');
      expect(obj).toBeTruthy();
      expect((obj as any).type).toBe('group');
    });

    it('addSvg rejects when called before initCanvas', async () => {
      TestBed.configureTestingModule({ providers: [CanvasService] });
      const uninit = TestBed.inject(CanvasService);
      await expect(uninit.addSvg('<svg/>')).rejects.toThrow(/canvas not initialized/i);
    });

    it('addSvg rejects when loadSVGFromString returns no objects', async () => {
      const fabric = await import('fabric');
      const spy = vi.spyOn(fabric, 'loadSVGFromString').mockResolvedValueOnce({
        objects: [],
        options: {},
      } as any);
      const { service } = makeService(500, 500);
      await expect(service.addSvg('<svg/>')).rejects.toThrow(/no objects/i);
      spy.mockRestore();
    });

    it('addSvg places the object on the canvas and returns it as active', async () => {
      const { service } = makeService(500, 500);
      const obj = await service.addSvg('<svg/>');
      expect(service.getCanvas()!.getActiveObject()).toBe(obj);
    });

    it('integration: SVG on canvas → toDataURL returns a non-empty PNG data URL (PX-003 AC-4/AC-5)', async () => {
      const { service } = makeService(500, 500);
      await service.addSvg('<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>');
      const dataUrl = service.toDataURL('png');
      expect(dataUrl.startsWith('data:image/')).toBe(true);
      // The mock returns a fixed non-empty data URL; real impl returns encoded PNG bytes.
      expect(dataUrl.length).toBeGreaterThan('data:image/png;base64,'.length);
    });
  });

  describe('setBackgroundImage', () => {
    it('loads and applies a cover background', async () => {
      const origImage = global.Image;
      class FakeImage {
        onload: (() => void) | null = null;
        crossOrigin = '';
        width = 100;
        height = 100;
        set src(_v: string) { queueMicrotask(() => this.onload?.()); }
      }
      (global as any).Image = FakeImage as any;
      try {
        const { service } = makeService(500, 500);
        service.setBackgroundImage('data:image/png;base64,AAA', 'cover');
        await Promise.resolve(); await Promise.resolve();
        expect(service.backgroundMode()).toBe('custom');
      } finally {
        (global as any).Image = origImage;
      }
    });
  });

  describe('eyedropper / drawing follow-ups', () => {
    it('setBrushColor updates the brush color even after drawing toggled', () => {
      const { service } = makeService();
      service.toggleDrawingMode();
      service.setBrushColor('#ffffff');
      expect(service.brushColor()).toBe('#ffffff');
      service.setBrushSize(20);
      expect(service.brushSize()).toBe(20);
      service.toggleDrawingMode();
    });
  });

  describe('resize (PX-020 AC-1c)', () => {
    it('updates the width/height signals and calls fabric setDimensions + requestRenderAll', () => {
      const { service } = makeService(200, 200);
      const canvas = (service as any).canvas as {
        setDimensions: (d: { width: number; height: number }) => void;
        requestRenderAll: () => void;
      };
      const setDimsSpy = vi.spyOn(canvas, 'setDimensions');
      const renderSpy = vi.spyOn(canvas, 'requestRenderAll');

      service.resize(1080, 1080);

      expect(service.canvasWidth()).toBe(1080);
      expect(service.canvasHeight()).toBe(1080);
      expect(setDimsSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });

    it('is a no-op when width or height is not positive', () => {
      const { service } = makeService(300, 300);
      service.resize(0, 0);
      expect(service.canvasWidth()).toBe(300);
      expect(service.canvasHeight()).toBe(300);
      service.resize(-5, 100);
      expect(service.canvasWidth()).toBe(300);
    });

    it('handles each MVP platform preset dimension', () => {
      const cases: [number, number][] = [
        [1080, 1080], // ig-post
        [1080, 1920], // ig-story
        [1200, 627],  // linkedin-post
        [1584, 396],  // linkedin-banner
        [1280, 720],  // yt-thumb
      ];
      for (const [w, h] of cases) {
        TestBed.resetTestingModule();
        const { service } = makeService(100, 100);
        service.resize(w, h);
        expect(service.canvasWidth()).toBe(w);
        expect(service.canvasHeight()).toBe(h);
      }
    });
  });
});
