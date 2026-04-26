/**
 * PX-138 AC-4 — the canvas-page-background "Remove" button under the
 * Background tab → "Background Image" section was easily confused with
 * the image-bg-removal action. The label must now read
 * "Clear page background" with an explanatory tooltip so the two
 * actions can't be mistaken for each other.
 *
 * Rendering the full sidebar-drawer in a unit test would require a
 * deep service tree (canvas, brand-kit, projects, fonts, etc.). Since
 * AC-4 is a copy-only change, asserting against the component source
 * directly is the cheapest honest test: it pins the new label in
 * place so a future edit that flips it back fails CI.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sidebarDrawerSrc = readFileSync(resolve(here, 'sidebar-drawer.ts'), 'utf8');

describe('SidebarDrawerComponent — PX-138 AC-4 canvas-bg button label', () => {
  it('renders "Clear page background" instead of bare "Remove"', () => {
    expect(sidebarDrawerSrc).toContain('Clear page background');
  });

  it('has an explanatory tooltip on the canvas-bg removal button', () => {
    expect(sidebarDrawerSrc).toContain('Remove the page-level background image');
  });

  it('no longer surfaces a stand-alone "<mat-icon>clear</mat-icon> Remove" label', () => {
    expect(sidebarDrawerSrc).not.toMatch(/<mat-icon>clear<\/mat-icon>\s*Remove\s*</);
  });
});
