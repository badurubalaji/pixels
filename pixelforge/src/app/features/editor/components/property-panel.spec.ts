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

  it('AC-3: isImageSelected stays false for a photo-frame FabricImage', () => {
    const frame = new fabric.FabricImage();
    (frame as any).customType = 'photo-frame';
    activeObject = frame;
    (component as any).readProps();
    expect(component.isImageSelected()).toBe(false);
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
});
