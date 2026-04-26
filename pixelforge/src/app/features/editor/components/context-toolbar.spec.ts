/**
 * PX-141 — coverage for the floating context toolbar.
 *
 * The component is presentation-only: a `context` input drives a
 * @switch in the template, and each verb fires a discrete output.
 *
 * Two test layers:
 *   1. Source-level guarantees — the template wires the right
 *      `data-testid` per context, and the component declares the
 *      expected output emitters. These pin the contract in place
 *      without dragging the full Material/CDK provider tree into
 *      a render-level test.
 *   2. Output-emission spot-checks — created via
 *      `runInInjectionContext` so the OutputEmitterRefs are usable
 *      without rendering.
 */

import { TestBed } from '@angular/core/testing';
import { runInInjectionContext, Injector } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ContextToolbarComponent } from './context-toolbar';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, 'context-toolbar.ts'), 'utf8');

describe('ContextToolbarComponent — PX-141 source-level contract', () => {
  it('hides the toolbar with @if (context() !== \'none\')', () => {
    expect(src).toMatch(/@if \(context\(\) !== 'none'\)/);
  });

  it('routes to four context cases: image / text / shape / group', () => {
    expect(src).toContain("@case ('image')");
    expect(src).toContain("@case ('text')");
    expect(src).toContain("@case ('shape')");
    expect(src).toContain("@case ('group')");
  });

  it('image context exposes Remove Background, Front, Back, Delete', () => {
    const imageBlock = src
      .split("@case ('image')")[1]!
      .split("@case ('text')")[0]!;
    expect(imageBlock).toContain('data-testid="ctx-remove-bg"');
    expect(imageBlock).toContain('data-testid="ctx-front"');
    expect(imageBlock).toContain('data-testid="ctx-back"');
    expect(imageBlock).toContain('data-testid="ctx-delete"');
    expect(imageBlock).not.toContain('data-testid="ctx-bold"');
    expect(imageBlock).not.toContain('data-testid="ctx-group"');
  });

  it('text context exposes Bold, Italic, Underline, Front, Delete (no Remove BG / Group)', () => {
    const textBlock = src
      .split("@case ('text')")[1]!
      .split("@case ('shape')")[0]!;
    expect(textBlock).toContain('data-testid="ctx-bold"');
    expect(textBlock).toContain('data-testid="ctx-italic"');
    expect(textBlock).toContain('data-testid="ctx-underline"');
    expect(textBlock).toContain('data-testid="ctx-front"');
    expect(textBlock).toContain('data-testid="ctx-delete"');
    expect(textBlock).not.toContain('data-testid="ctx-remove-bg"');
    expect(textBlock).not.toContain('data-testid="ctx-group"');
  });

  it('shape context exposes Front, Back, Delete only', () => {
    const shapeBlock = src
      .split("@case ('shape')")[1]!
      .split("@case ('group')")[0]!;
    expect(shapeBlock).toContain('data-testid="ctx-front"');
    expect(shapeBlock).toContain('data-testid="ctx-back"');
    expect(shapeBlock).toContain('data-testid="ctx-delete"');
    expect(shapeBlock).not.toContain('data-testid="ctx-remove-bg"');
    expect(shapeBlock).not.toContain('data-testid="ctx-bold"');
    expect(shapeBlock).not.toContain('data-testid="ctx-group"');
  });

  it('group context exposes Group, Ungroup, Front, Back, Delete', () => {
    const groupBlock = src.split("@case ('group')")[1]!;
    expect(groupBlock).toContain('data-testid="ctx-group"');
    expect(groupBlock).toContain('data-testid="ctx-ungroup"');
    expect(groupBlock).toContain('data-testid="ctx-front"');
    expect(groupBlock).toContain('data-testid="ctx-back"');
    expect(groupBlock).toContain('data-testid="ctx-delete"');
    expect(groupBlock).not.toContain('data-testid="ctx-remove-bg"');
    expect(groupBlock).not.toContain('data-testid="ctx-bold"');
  });
});

describe('ContextToolbarComponent — PX-141 output emitters', () => {
  let component: ContextToolbarComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    const injector = TestBed.inject(Injector);
    component = runInInjectionContext(
      injector,
      () => new ContextToolbarComponent(),
    );
  });

  it('declares all expected outputs', () => {
    // image
    expect(component.removeBackground).toBeDefined();
    // text
    expect(component.toggleBold).toBeDefined();
    expect(component.toggleItalic).toBeDefined();
    expect(component.toggleUnderline).toBeDefined();
    // group
    expect(component.groupSelected).toBeDefined();
    expect(component.ungroupSelected).toBeDefined();
    // shared
    expect(component.bringToFront).toBeDefined();
    expect(component.sendToBack).toBeDefined();
    expect(component.deleteSelected).toBeDefined();
  });

  it('emits via .subscribe() exactly once per .emit() call', () => {
    let fired = 0;
    component.deleteSelected.subscribe(() => fired++);
    component.deleteSelected.emit();
    expect(fired).toBe(1);
  });

  it('outputs are independent — emitting one does not fire another', () => {
    let bold = 0;
    let italic = 0;
    component.toggleBold.subscribe(() => bold++);
    component.toggleItalic.subscribe(() => italic++);
    component.toggleBold.emit();
    expect(bold).toBe(1);
    expect(italic).toBe(0);
  });
});

