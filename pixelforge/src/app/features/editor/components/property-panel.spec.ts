/**
 * PX-138 — focused signal-level coverage for the new
 * `Remove Background` quick action gating.
 *
 * The full property-panel template requires a deep tree of providers
 * plus several sibling sub-components, so this spec stays at the
 * signal level. Whether the @if directive renders the button when the
 * gate signal is true is an Angular framework guarantee — the only
 * thing we own here is the *gating logic* in `readProps()`.
 *
 * Acceptance criteria covered:
 *   AC-1 (button visible for plain image selection) ⇒ `isImageSelected()` true
 *   AC-3 (button hidden for text/shape/photo-frame/none) ⇒ `isImageSelected()` false
 *   AC-2 (output emitter exists) ⇒ `removeBackgroundRequested` is an EventEmitter-shaped output
 */

import { TestBed } from '@angular/core/testing';
import { runInInjectionContext, Injector } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('fabric', () => {
  class FabricObject {
    type = 'object';
    set(_a: any, _b?: any) { return this; }
    get(_k: string) { return undefined; }
    on() {} off() {}
  }
  class Rect extends FabricObject {}
  class Circle extends FabricObject {}
  class FabricText extends FabricObject {}
  class IText extends FabricText {}
  class FabricImage extends FabricObject {}
  class Group extends FabricObject {}
  return { FabricObject, Rect, Circle, FabricText, IText, FabricImage, Group };
});

import * as fabric from 'fabric';
import { PropertyPanelComponent } from './property-panel';
import { CanvasService } from '../../../core/services/canvas.service';
import { FontService } from '../../../core/services/font.service';
import { AnimationService } from '../../../core/services/animation.service';
import { AccessibilityService } from '../../../core/services/accessibility.service';

describe('PropertyPanelComponent — PX-138 Remove Background gating', () => {
  let component: PropertyPanelComponent;
  let activeObject: any;

  beforeEach(() => {
    activeObject = null;

    const canvasStub: Partial<CanvasService> = {
      getCanvas: () => ({ getActiveObject: () => activeObject } as any),
      cropMode: (() => false) as any,
      backgroundMode: (() => 'white') as any,
      backgroundColor: (() => '#ffffff') as any,
      backgroundOpacity: (() => 1) as any,
    };

    const fontStub: Partial<FontService> = {
      getAllFontFamilies: () => [],
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: CanvasService, useValue: canvasStub },
        { provide: FontService, useValue: fontStub },
        {
          provide: AnimationService,
          useValue: { getAnimation: () => null },
        },
        {
          provide: AccessibilityService,
          useValue: {
            getEffectiveBackground: () => '#ffffff',
            contrastRatio: () => null,
          },
        },
      ],
    });

    const injector = TestBed.inject(Injector);
    component = runInInjectionContext(injector, () => new PropertyPanelComponent());
  });

  it('AC-1: isImageSelected flips to true when active selection is a plain FabricImage', () => {
    activeObject = new fabric.FabricImage();
    (component as any).readProps();
    expect(component.isImageSelected()).toBe(true);
  });

  it('AC-3: isImageSelected stays false when there is no active selection', () => {
    activeObject = null;
    (component as any).readProps();
    expect(component.isImageSelected()).toBe(false);
  });

  it('PX-156: isImageSelected is TRUE for a photo-frame FabricImage (was false pre-PX-156)', () => {
    // PX-156 dropped the customType='photo-frame' exclusion so users
    // keep access to Remove Background + Magic Eraser AFTER promoting
    // an image to a frame for shape masking. A filled photo-frame is
    // still a FabricImage with bg-removable pixels.
    const frame = new fabric.FabricImage();
    (frame as any).customType = 'photo-frame';
    activeObject = frame;
    (component as any).readProps();
    expect(component.isImageSelected()).toBe(true);
  });

  it('AC-3: isImageSelected stays false for text selections', () => {
    activeObject = new fabric.IText();
    (component as any).readProps();
    expect(component.isImageSelected()).toBe(false);
  });

  it('AC-3: isImageSelected stays false for shape selections', () => {
    activeObject = new fabric.Rect();
    (component as any).readProps();
    expect(component.isImageSelected()).toBe(false);
  });

  it('AC-2: removeBackgroundRequested is exposed as an output', () => {
    expect(component.removeBackgroundRequested).toBeDefined();
    expect(typeof (component.removeBackgroundRequested as any).emit).toBe('function');
  });

  // ---------------------------------------------------------------
  // PX-156 — convert-to-photo-frame promotion
  // ---------------------------------------------------------------
  describe('PX-156: Edit as photo frame', () => {
    it('convertToPhotoFrame delegates to canvasService.convertImageToFrame + commitChange', () => {
      const svc = TestBed.inject(CanvasService) as any;
      const fakeImage = { customType: undefined };
      svc.getCanvas = () => ({ getActiveObject: () => fakeImage });
      svc.convertImageToFrame = vi.fn();
      svc.commitChange = vi.fn();
      component.convertToPhotoFrame();
      expect(svc.convertImageToFrame).toHaveBeenCalledWith(fakeImage);
      expect(svc.commitChange).toHaveBeenCalledWith(fakeImage);
    });

    it('convertToPhotoFrame is a no-op when nothing is selected', () => {
      const svc = TestBed.inject(CanvasService) as any;
      svc.getCanvas = () => ({ getActiveObject: () => null });
      svc.convertImageToFrame = vi.fn();
      component.convertToPhotoFrame();
      expect(svc.convertImageToFrame).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // PX-122 — modal-mode crop wiring
  // ---------------------------------------------------------------
  describe('PX-122: modal-mode crop', () => {
    it('applyCropMode delegates to canvasService.applyCropMode', () => {
      const svc = TestBed.inject(CanvasService) as any;
      svc.applyCropMode = vi.fn();
      component.applyCropMode();
      expect(svc.applyCropMode).toHaveBeenCalled();
    });

    it('cancelCropMode delegates to canvasService.cancelCropMode', () => {
      const svc = TestBed.inject(CanvasService) as any;
      svc.cancelCropMode = vi.fn();
      component.cancelCropMode();
      expect(svc.cancelCropMode).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // PX-123 — Smart Crop wiring (no-op paths only; pixel saliency is
  // exercised at runtime since jsdom doesn't render Canvas2D)
  // ---------------------------------------------------------------
  describe('PX-123: Smart Crop', () => {
    it('smartCrop is a no-op when nothing is selected', () => {
      const svc = TestBed.inject(CanvasService) as any;
      svc.setFrameFit = vi.fn();
      svc.setFrameAspectRatio = vi.fn();
      svc.setFrameView = vi.fn();
      // Default canvas stub returns null active.
      component.smartCrop();
      expect(svc.setFrameFit).not.toHaveBeenCalled();
      expect(svc.setFrameAspectRatio).not.toHaveBeenCalled();
      expect(svc.setFrameView).not.toHaveBeenCalled();
    });

    it('smartCrop is a no-op for non-frame selection', () => {
      const svc = TestBed.inject(CanvasService) as any;
      const fakeRect = { customType: undefined };
      svc.getCanvas = () => ({ getActiveObject: () => fakeRect });
      svc.setFrameFit = vi.fn();
      component.smartCrop();
      expect(svc.setFrameFit).not.toHaveBeenCalled();
    });
  });
});
