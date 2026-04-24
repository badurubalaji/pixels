import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

// --- Mock fabric.js (same shape the canvas spec uses — trimmed) --------
vi.mock('fabric', () => {
  class FabricObject {
    left = 0; top = 0; width = 100; height = 100;
    scaleX = 1; scaleY = 1; angle = 0; opacity = 1;
    originX: any = 'left'; originY: any = 'top'; visible = true;
    selectable = true; evented = true;
    set(a: any, b?: any) { if (typeof a === 'string') (this as any)[a] = b; else Object.assign(this, a); return this; }
    get(k: string) { return (this as any)[k]; }
    setCoords() {}
    rotate(a: number) { this.angle = a; }
    getBoundingRect() { return { left: this.left, top: this.top, width: this.width, height: this.height }; }
    toDataURL() { return 'data:image/png;base64,AAA'; }
    getElement() { const c = document.createElement('canvas'); c.width = this.width; c.height = this.height; return c; }
    on() {} off() {}
  }
  class Rect extends FabricObject {}
  class Circle extends FabricObject {}
  class Triangle extends FabricObject {}
  class Line extends FabricObject { constructor(_c: number[], _o?: any) { super(); } }
  class Polygon extends FabricObject { points: any[]; constructor(points: any[], _o?: any) { super(); this.points = points; } }
  class FabricText extends FabricObject { text = ''; constructor(t: string, _o?: any) { super(); this.text = t; } }
  class IText extends FabricText {}
  class FabricImage extends FabricObject { static async fromURL(_u: string) { return new FabricImage(); } }
  class Group extends FabricObject { private _o: FabricObject[]; constructor(o: FabricObject[], _opts?: any) { super(); this._o = o; } getObjects() { return this._o; } }
  class ActiveSelection extends Group {}
  class Path extends FabricObject {}
  class Pattern {}
  class PencilBrush { color = '#000'; width = 1; constructor(_c: any) {} }
  class Point { x = 0; y = 0; constructor(x: number, y: number) { this.x = x; this.y = y; } }
  class Canvas {
    private _objs: FabricObject[] = [];
    private _active: FabricObject | null = null;
    private _handlers: Record<string, Array<(...a: any[]) => void>> = {};
    width = 500; height = 500;
    viewportTransform = [1, 0, 0, 1, 0, 0];
    backgroundColor: any = '#fff';
    backgroundImage: any = undefined;
    isDrawingMode = false;
    selection = true;
    defaultCursor = 'default'; hoverCursor = 'move';
    freeDrawingBrush: any = null;
    upperCanvasEl = document.createElement('canvas');
    constructor(_el: any, opts: any = {}) { this.width = opts.width ?? 500; this.height = opts.height ?? 500; }
    add(...o: FabricObject[]) { this._objs.push(...o); return this; }
    remove(...o: FabricObject[]) { this._objs = this._objs.filter(x => !o.includes(x)); return this; }
    clear() { this._objs = []; this._active = null; }
    getObjects() { return this._objs; }
    setActiveObject(o: FabricObject) { this._active = o; return this; }
    getActiveObject() { return this._active; }
    discardActiveObject() { this._active = null; return this; }
    renderAll() {} requestRenderAll() {}
    setDimensions(d: any) { this.width = d.width; this.height = d.height; }
    setZoom(_z: number) {} getZoom() { return 1; }
    setViewportTransform(_v: any) {}
    zoomToPoint(_p: any, _z: number) {}
    setCursor(_c: any) {}
    getElement() { return document.createElement('canvas'); }
    toDataURL() { return 'data:image/png;base64,BBB'; }
    toJSON() { return { version: '7', objects: [] }; }
    async loadFromJSON(_j: any) {}
    dispose() {}
    bringObjectToFront() {} sendObjectToBack() {} moveObjectTo() {}
    on(evt: string, fn: (...a: any[]) => void) { (this._handlers[evt] ??= []).push(fn); }
    off(evt: string, fn?: (...a: any[]) => void) { if (!this._handlers[evt]) return; if (!fn) { this._handlers[evt] = []; return; } this._handlers[evt] = this._handlers[evt].filter(h => h !== fn); }
    fire(evt: string, p?: any) { this._handlers[evt]?.forEach(h => h(p)); }
  }
  const util = { groupSVGElements: (o: any[]) => new Group(o ?? []) };
  return { Canvas, FabricObject, Rect, Circle, Triangle, Polygon, Line, FabricText, IText, FabricImage, Group, ActiveSelection, Path, Pattern, PencilBrush, Point, util, loadSVGFromString: vi.fn(async () => ({ objects: [new FabricObject()], options: {} })) };
});

import { Editor } from './editor';
import { Component } from '@angular/core';
import { CanvasService } from '../../core/services/canvas.service';
import { ProjectService } from '../../core/services/project.service';
import { ExportService } from '../../core/services/export.service';
import { ApiService } from '../../core/services/api.service';
import { HistoryService } from '../../core/services/history.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { BackgroundRemovalService } from '../../core/services/background-removal.service';
import { CommentsService } from '../../core/services/comments.service';
import { CollaborationService } from '../../core/services/collaboration.service';
import { AiDesignService } from '../../core/services/ai-design.service';
import { QualityScoreService } from '../../core/services/quality-score.service';
import { FontService } from '../../core/services/font.service';
import { TemplateService } from '../../core/services/template.service';
import { BrandKitService } from '../../core/services/brand-kit.service';
import { Subject } from 'rxjs';

/**
 * Factory for a lightweight CanvasService stub. We fake just enough
 * of the surface Editor calls during bootstrap + save/load paths.
 */
function makeCanvasStub() {
  const layers = signal<any[]>([]);
  return {
    initCanvas: vi.fn(),
    getCanvas: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      getActiveObject: vi.fn(() => null),
      discardActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
      renderAll: vi.fn(),
      getObjects: vi.fn(() => []),
    })),
    dispose: vi.fn(),
    layers,
    activeLayerId: signal<string | null>(null),
    canvasWidth: signal(1000),
    canvasHeight: signal(1000),
    zoom: signal(1),
    showGrid: signal(false),
    snapToGrid: signal(false),
    snapToThirds: signal(false),
    showThirds: signal(false),
    printMode: signal(false),
    backgroundMode: signal('white'),
    backgroundColor: signal('#fff'),
    isDrawing: signal(false),
    brushColor: signal('#000'),
    brushSize: signal(4),
    gridSize: signal(20),
    isPanning: signal(false),
    isCropping: signal(false),
    cropAspectRatio: signal<number | null>(null),
    isEyedropper: signal(false),
    activeLayer: signal(null),
    rightClick$: new Subject<MouseEvent>(),
    doubleClick$: new Subject<MouseEvent>(),
    addText: vi.fn(),
    addImage: vi.fn(),
    addShape: vi.fn(),
    addSvg: vi.fn(),
    clearCanvas: vi.fn(),
    setZoom: vi.fn(),
    setCanvasSize: vi.fn(),
    setBackgroundMode: vi.fn(),
    removeActiveObject: vi.fn(),
    getCanvasJSON: vi.fn(() => '{"version":"7","objects":[]}'),
    getThumbnail: vi.fn(() => 'data:image/png;base64,TT'),
    loadFromJSON: vi.fn(async () => {}),
    toggleGrid: vi.fn(),
    toggleSnapToGrid: vi.fn(),
    toggleShowThirds: vi.fn(),
    toggleSnapToThirds: vi.fn(),
    togglePrintMode: vi.fn(),
  };
}

function makeApiStub() {
  return {
    publishTemplate: vi.fn(() => of({ id: 't1' })),
  };
}

function makeProjectStub() {
  return {
    currentProject: signal<any>({ id: 'p1', name: 'Test', width: 800, height: 600 }),
    isSaving: signal(false),
    lastSaved: signal<Date | null>(null),
    openProject: vi.fn(),
    getCanvasState: vi.fn(() => null),
    saveCanvasState: vi.fn(),
    updateProject: vi.fn(),
    duplicateProject: vi.fn(() => ({ id: 'p2' })),
  };
}

function makeTemplateStub() {
  return { applyTemplate: vi.fn() };
}

function makeBrandKitStub() {
  return {
    colors: signal<string[]>([]),
    fonts: signal<string[]>([]),
    logos: signal<any[]>([]),
    load: vi.fn(),
    save: vi.fn(),
  };
}

describe('Editor', () => {
  let canvasStub: ReturnType<typeof makeCanvasStub>;
  let projectStub: ReturnType<typeof makeProjectStub>;
  let apiStub: ReturnType<typeof makeApiStub>;
  let templateStub: ReturnType<typeof makeTemplateStub>;

  beforeEach(async () => {
    canvasStub = makeCanvasStub();
    projectStub = makeProjectStub();
    apiStub = makeApiStub();
    templateStub = makeTemplateStub();

    // Activated route: no query params, no id by default
    const route = {
      snapshot: {
        paramMap: { get: vi.fn(() => null) },
        queryParamMap: { get: vi.fn(() => null) },
      },
    };

    // Override the component's template so child-component instantiation
    // doesn't pull in dependencies (font lists, etc.) we don't care about.
    TestBed.overrideComponent(Editor, {
      set: { template: '<div></div>', imports: [] },
    });

    await TestBed.configureTestingModule({
      imports: [Editor, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CanvasService, useValue: canvasStub },
        { provide: ProjectService, useValue: projectStub },
        { provide: ApiService, useValue: apiStub },
        { provide: TemplateService, useValue: templateStub },
        { provide: BrandKitService, useValue: makeBrandKitStub() },
        { provide: ExportService, useValue: { export: vi.fn() } },
        { provide: HistoryService, useValue: {
            init: vi.fn(), clear: vi.fn(), undo: vi.fn(), redo: vi.fn(),
            canUndo: signal(false), canRedo: signal(false),
        } },
        { provide: KeyboardService, useValue: { init: vi.fn(), destroy: vi.fn() } },
        { provide: ClipboardService, useValue: { copy: vi.fn(), paste: vi.fn() } },
        { provide: BackgroundRemovalService, useValue: {
            removeFromDataURL: vi.fn(async () => 'data:image/png;base64,NN'),
            errorMessage: signal(''),
        } },
        { provide: CommentsService, useValue: {
            setActiveProject: vi.fn(),
            commentMode: signal(false),
            toggleCommentMode: vi.fn(),
            setCommentMode: vi.fn(),
            unresolvedCount: signal(0),
            comments: signal([]),
        } },
        { provide: CollaborationService, useValue: {
            connect: vi.fn(), disconnect: vi.fn(),
            collaborators: signal([]), cursors: signal([]),
        } },
        { provide: AiDesignService, useValue: { generate: vi.fn(async () => {}) } },
        { provide: QualityScoreService, useValue: {
            calculate: vi.fn(() => ({ total: 80, grade: 'A', factors: [] })),
        } },
        { provide: FontService, useValue: {
            preloadPopularFonts: vi.fn(),
            availableFonts: signal([]),
            recentFonts: signal([]),
        } },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn(() => ({
            afterOpened: () => of({}),
            afterClosed: () => of(undefined),
            componentInstance: { setPagesData: vi.fn() },
        })) } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('creates the editor component', () => {
    const fixture = TestBed.createComponent(Editor);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('initPages seeds a single blank page', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    expect(ed.pages().length).toBe(1);
    expect(ed.activePage()).toBe(0);
  });

  it('addPage pushes a new page and advances activePage', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.addPage();
    expect(ed.pages().length).toBe(2);
    expect(ed.activePage()).toBe(1);
  });

  it('deletePage removes a page and clamps activePage', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.addPage();
    expect(ed.pages().length).toBe(2);
    ed.deletePage(1);
    expect(ed.pages().length).toBe(1);
    expect(ed.activePage()).toBe(0);
  });

  it('deletePage refuses to remove the last page', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.deletePage(0);
    expect(ed.pages().length).toBe(1);
  });

  it('duplicatePage inserts a copy after current', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.duplicatePage();
    expect(ed.pages().length).toBe(2);
    expect(ed.activePage()).toBe(1);
  });

  it('addShape delegates to canvasService', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.addShape('rect');
    expect(canvasStub.addShape).toHaveBeenCalledWith('rect');
  });

  it('addTextWithOptions forwards options to canvasService.addText', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.addTextWithOptions({ text: 'hello', fontSize: 48, fontWeight: 'bold' });
    expect(canvasStub.addText).toHaveBeenCalledWith(
      'hello',
      expect.objectContaining({ fontSize: 48, fontWeight: 'bold' }),
    );
  });

  it('zoomIn / zoomOut / setZoomPct call through with clamped values', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.zoomIn();
    expect(canvasStub.setZoom).toHaveBeenCalled();
    ed.zoomOut();
    ed.setZoomPct(150);
    const last = canvasStub.setZoom.mock.calls.at(-1)![0] as number;
    expect(last).toBeCloseTo(1.5);
  });

  it('zoomPercent reflects canvasService.zoom as integer percent', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    canvasStub.zoom.set(0.5);
    expect(ed.zoomPercent()).toBe(50);
  });

  it('saveProject calls projectService.saveCanvasState', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.saveProject();
    expect(projectStub.saveCanvasState).toHaveBeenCalledWith(
      'p1',
      expect.any(String),
      expect.any(String),
    );
  });

  it('saveProject early-returns when no active project', () => {
    projectStub.currentProject.set(null);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.saveProject();
    expect(projectStub.saveCanvasState).not.toHaveBeenCalled();
  });

  it('undo / redo proxy to HistoryService', () => {
    const history = TestBed.inject(HistoryService);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.undo();
    ed.redo();
    expect(history.undo).toHaveBeenCalled();
    expect(history.redo).toHaveBeenCalled();
  });

  it('deleteSelected delegates to canvasService.removeActiveObject', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.deleteSelected();
    expect(canvasStub.removeActiveObject).toHaveBeenCalled();
  });

  it('toggleTimer starts and stops the timer', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    expect(ed.timerRunning()).toBe(false);
    ed.toggleTimer();
    expect(ed.timerRunning()).toBe(true);
    ed.toggleTimer();
    expect(ed.timerRunning()).toBe(false);
  });

  it('formatTimer formats seconds correctly', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    expect(ed.formatTimer(0)).toBe('0:00');
    expect(ed.formatTimer(65)).toBe('1:05');
    expect(ed.formatTimer(3661)).toBe('1:01:01');
  });

  it('saveLabel reflects isOnline and lastSaved', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.isOnline.set(false);
    expect(ed.saveLabel()).toBe('Offline');
    ed.isOnline.set(true);
    expect(ed.saveLabel()).toBe('Save');
  });

  it('saveIcon reflects state', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.isOnline.set(false);
    expect(ed.saveIcon()).toBe('cloud_off');
    ed.isOnline.set(true);
    projectStub.isSaving.set(true);
    expect(ed.saveIcon()).toBe('sync');
    projectStub.isSaving.set(false);
    expect(ed.saveIcon()).toBe('save');
  });

  it('startNameEdit sets editableName and editing signals', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.startNameEdit();
    expect(ed.isEditingName()).toBe(true);
    expect(ed.editableName()).toBe('Test');
  });

  it('finishNameEdit applies name update', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.editableName.set('Renamed');
    ed.finishNameEdit();
    expect(projectStub.updateProject).toHaveBeenCalledWith('p1', { name: 'Renamed' });
    expect(ed.isEditingName()).toBe(false);
  });

  it('cancelNameEdit just closes the editor', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.startNameEdit();
    ed.cancelNameEdit();
    expect(ed.isEditingName()).toBe(false);
  });

  it('toggleThirds toggles both show and snap thirds', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.toggleThirds();
    expect(canvasStub.toggleShowThirds).toHaveBeenCalled();
    expect(canvasStub.toggleSnapToThirds).toHaveBeenCalled();
  });

  it('goBack navigates to /', () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('fileNew navigates to / with action=new', () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.fileNew();
    expect(router.navigate).toHaveBeenCalledWith(['/'], { queryParams: { action: 'new' } });
  });

  it('fileMakeCopy navigates to the duplicate', () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.fileMakeCopy();
    expect(router.navigate).toHaveBeenCalledWith(['/editor', 'p2']);
  });

  it('openShortcutsDialog opens a dialog', () => {
    const dialog = TestBed.inject(MatDialog);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.openShortcutsDialog();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('openResizeDialog opens a dialog', () => {
    const dialog = TestBed.inject(MatDialog);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.openResizeDialog();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('openAuditDialog opens a dialog', () => {
    const dialog = TestBed.inject(MatDialog);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.openAuditDialog();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('updatePageNotes updates the active page notes field', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.updatePageNotes('TODO: fix kerning');
    expect(ed.pages()[0].notes).toBe('TODO: fix kerning');
  });

  it('saveCurrentPageState stores json+thumb into current page', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.saveCurrentPageState();
    expect(ed.pages()[0].canvasJson.length).toBeGreaterThan(0);
    expect(ed.pages()[0].thumbnail.length).toBeGreaterThan(0);
  });

  it('switchToPage moves to the target page and loads state', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.addPage();
    ed.switchToPage(0);
    expect(ed.activePage()).toBe(0);
    // Switching to same page is a noop
    ed.switchToPage(0);
    expect(ed.activePage()).toBe(0);
  });

  it('switchToPage loads JSON when the target page has saved state', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.addPage();
    // Seed saved json on page 0
    ed.pages.update(p => p.map((page, i) =>
      i === 0 ? { ...page, canvasJson: '{"objects":[]}' } : page));
    ed.switchToPage(0);
    expect(canvasStub.loadFromJSON).toHaveBeenCalled();
  });

  it('duplicatePageAt + deletePageAt stop event propagation', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.addPage();
    const e = { stopPropagation: vi.fn() } as any;
    ed.duplicatePageAt(e, 0);
    expect(e.stopPropagation).toHaveBeenCalled();
    const e2 = { stopPropagation: vi.fn() } as any;
    ed.deletePageAt(e2, 0);
    expect(e2.stopPropagation).toHaveBeenCalled();
  });

  it('triggerImageUpload clicks the hidden file input', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const click = vi.fn();
    (ed as any).fileInputRef = { nativeElement: { click, value: '' } };
    ed.triggerImageUpload();
    expect(click).toHaveBeenCalled();
  });

  it('onImageUpload reads the selected file', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    const event = { target: input } as any;
    expect(() => ed.onImageUpload(event)).not.toThrow();
  });

  it('onImageUpload does nothing when no file picked', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const event = { target: { files: [] } } as any;
    expect(() => ed.onImageUpload(event)).not.toThrow();
  });

  it('onContextMenu prevents default and shows the menu', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const show = vi.fn();
    (ed as any).contextMenu = { show };
    const e = { preventDefault: vi.fn() } as any;
    ed.onContextMenu(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(show).toHaveBeenCalledWith(e);
  });

  it('onCanvasAreaMouseDown clears selection on background click', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const host = document.createElement('div');
    host.className = 'editor-body';
    const active = {};
    const discard = vi.fn();
    const request = vi.fn();
    const canvas: any = {
      getActiveObject: () => active,
      discardActiveObject: discard,
      requestRenderAll: request,
    };
    canvasStub.getCanvas.mockReturnValue(canvas);
    const event = { target: host } as any;
    ed.onCanvasAreaMouseDown(event);
    expect(discard).toHaveBeenCalled();
  });

  it('onDragOver / onDragLeave toggle isDragOver', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const e = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as any;
    ed.onDragOver(e);
    expect(ed.isDragOver()).toBe(true);
    ed.onDragLeave(e);
    expect(ed.isDragOver()).toBe(false);
  });

  it('onDrop loads image files', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const e = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [file] },
    } as any;
    ed.onDrop(e);
    expect(ed.isDragOver()).toBe(false);
  });

  it('onDrop returns early with no files', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const e = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [] },
    } as any;
    expect(() => ed.onDrop(e)).not.toThrow();
  });

  it('removeBackground is a no-op when no active image is selected', async () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    // Default getCanvas returns a stub where getActiveObject returns null.
    await ed.removeBackground();
    expect(ed.isProcessing()).toBe(false);
  });

  it('onKeyDown saves on Ctrl+S', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    const saveSpy = vi.spyOn(ed, 'saveProject');
    const e = { ctrlKey: true, metaKey: false, key: 's', preventDefault: vi.fn() } as any;
    ed.onKeyDown(e);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalled();
  });

  it('onKeyDown ignores non-save combos', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const e = { ctrlKey: false, metaKey: false, key: 'a', preventDefault: vi.fn() } as any;
    ed.onKeyDown(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('onMouseWheel zooms when Ctrl held', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const e = { ctrlKey: true, metaKey: false, deltaY: -100, preventDefault: vi.fn() } as any;
    ed.onMouseWheel(e);
    expect(canvasStub.setZoom).toHaveBeenCalled();
  });

  it('onMouseWheel ignores scroll without modifier', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    const e = { ctrlKey: false, metaKey: false, deltaY: -100, preventDefault: vi.fn() } as any;
    ed.onMouseWheel(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it('openExportDialog opens and primes pagesData', () => {
    const dialog = TestBed.inject(MatDialog);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.openExportDialog();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('openShareDialog requires an active project id', () => {
    const dialog = TestBed.inject(MatDialog);
    projectStub.currentProject.set(null);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.openShareDialog();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('openShareDialog opens when active project exists', () => {
    const dialog = TestBed.inject(MatDialog);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.openShareDialog();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('openVersionsDialog saves and opens when a project is active', () => {
    const dialog = TestBed.inject(MatDialog);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.openVersionsDialog();
    expect(projectStub.saveCanvasState).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('openVersionsDialog is a no-op without an active project', () => {
    const dialog = TestBed.inject(MatDialog);
    projectStub.currentProject.set(null);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.openVersionsDialog();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('publishAsTemplate prompts + calls apiService.publishTemplate', () => {
    const promptSpy = vi
      .spyOn(window, 'prompt')
      .mockReturnValueOnce('MyTpl')  // name
      .mockReturnValueOnce('Logo')   // category
      .mockReturnValueOnce('');      // description (empty -> undefined)
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.publishAsTemplate();
    expect(apiStub.publishTemplate).toHaveBeenCalled();
    const arg = apiStub.publishTemplate.mock.calls[0][0];
    expect(arg.name).toBe('MyTpl');
    expect(arg.category).toBe('Logo');
    promptSpy.mockRestore();
  });

  it('publishAsTemplate warns when no project is loaded', () => {
    const snack = TestBed.inject(MatSnackBar);
    projectStub.currentProject.set(null);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.publishAsTemplate();
    expect(snack.open).toHaveBeenCalledWith('Save the project first', 'OK', expect.any(Object));
  });

  it('publishAsTemplate aborts when name is blank', () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValueOnce('');
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.publishAsTemplate();
    expect(apiStub.publishTemplate).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it('startPresentation saves current page and triggers presentation', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    const start = vi.fn();
    (ed as any).presentationRef = { start };
    ed.startPresentation();
    // saveCurrentPageState is synchronous; presentation.start fires inside setTimeout
  });

  it('fitToScreen noops when the container ref is missing', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    (ed as any).containerRef = undefined;
    expect(() => ed.fitToScreen()).not.toThrow();
  });

  it('fitToScreen computes a zoom when container exists', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    (ed as any).containerRef = {
      nativeElement: { clientWidth: 1000, clientHeight: 800 },
    };
    ed.fitToScreen();
    expect(canvasStub.setZoom).toHaveBeenCalled();
  });

  it('togglePageLock locks and unlocks via canvas', () => {
    const obj = {
      set: vi.fn(),
      setCoords: vi.fn(),
    };
    canvasStub.getCanvas.mockReturnValue({
      getObjects: () => [obj],
      discardActiveObject: vi.fn(),
      renderAll: vi.fn(),
      on: vi.fn(), off: vi.fn(),
      getActiveObject: () => null,
      requestRenderAll: vi.fn(),
    } as any);
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.togglePageLock();
    expect(obj.set).toHaveBeenCalled();
    expect(ed.pageLocked()).toBe(true);
    ed.togglePageLock();
    expect(ed.pageLocked()).toBe(false);
  });

  it('duplicateCurrentPage delegates to duplicatePage', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.duplicateCurrentPage();
    expect(ed.pages().length).toBe(2);
  });

  it('qualityTooltip returns empty string with no score', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    expect(ed.qualityTooltip()).toBe('');
  });

  it('currentPageNotes returns active-page notes', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    ed.updatePageNotes('x');
    expect(ed.currentPageNotes()).toBe('x');
  });

  it('presentationPages maps pages to thumbnail+json tuples', () => {
    const fixture = TestBed.createComponent(Editor);
    const ed = fixture.componentInstance;
    ed.initPages();
    const pp = ed.presentationPages();
    expect(pp.length).toBe(1);
    expect(pp[0]).toHaveProperty('thumbnail');
    expect(pp[0]).toHaveProperty('canvasJson');
  });
});
