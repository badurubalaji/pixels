import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { ColorPickerComponent } from './color-picker.component';

/**
 * Vitest suite for {@link ColorPickerComponent} (PX-081).
 *
 * Covers parse → normalize → emit semantics across the supported input
 * forms (3/4/6/8-digit hex, rgb / rgba) and the alpha-aware emit policy.
 */
describe('ColorPickerComponent — PX-081', () => {
  let fixture: ComponentFixture<ColorPickerComponent>;
  let component: ColorPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPickerComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(ColorPickerComponent);
    component = fixture.componentInstance;
  });

  describe('value parsing', () => {
    it('parses 6-digit hex (alpha defaults to 100)', () => {
      component.value = '#7C3AED';
      expect(component.hex()).toBe('#7c3aed');
      expect(component.alphaPct()).toBe(100);
    });

    it('parses 8-digit hex with alpha', () => {
      component.value = '#7C3AED80';
      expect(component.hex()).toBe('#7c3aed');
      expect(component.alphaPct()).toBe(50); // 0x80 / 255 ≈ 0.502
    });

    it('parses 3-digit short hex', () => {
      component.value = '#abc';
      expect(component.hex()).toBe('#aabbcc');
      expect(component.alphaPct()).toBe(100);
    });

    it('parses 4-digit short hex with alpha', () => {
      component.value = '#abcf';
      expect(component.hex()).toBe('#aabbcc');
      expect(component.alphaPct()).toBe(100);
    });

    it('parses rgb()', () => {
      component.value = 'rgb(124, 58, 237)';
      expect(component.hex()).toBe('#7c3aed');
      expect(component.alphaPct()).toBe(100);
    });

    it('parses rgba() with fractional alpha', () => {
      component.value = 'rgba(124, 58, 237, 0.5)';
      expect(component.hex()).toBe('#7c3aed');
      expect(component.alphaPct()).toBe(50);
    });
  });

  describe('emit policy', () => {
    it('emits 6-digit hex when alpha is 100', () => {
      component.value = '#7c3aed';
      const emissions: string[] = [];
      component.valueChange.subscribe(v => emissions.push(v));
      component.onHexChange('#06b6d4');
      expect(emissions).toEqual(['#06b6d4']);
    });

    it('emits 8-digit hex when alpha < 100', () => {
      component.value = '#7c3aed';
      const emissions: string[] = [];
      component.valueChange.subscribe(v => emissions.push(v));
      component.onAlphaChange(50);
      // 50% of 255 ≈ 128 = 0x80
      expect(emissions[0]).toMatch(/^#7c3aed[0-9a-f]{2}$/);
      expect(emissions[0].slice(7)).toBe('80');
    });

    it('drops alpha suffix when alpha returns to 100', () => {
      component.value = '#7c3aed80';
      const emissions: string[] = [];
      component.valueChange.subscribe(v => emissions.push(v));
      component.onAlphaChange(100);
      expect(emissions[0]).toBe('#7c3aed');
    });
  });

  describe('hex text-field', () => {
    it('does not emit until commitHexInput()', () => {
      component.value = '#000000';
      const emissions: string[] = [];
      component.valueChange.subscribe(v => emissions.push(v));
      component.onHexInputChange('#7c3aed');
      expect(emissions).toEqual([]);
      component.commitHexInput();
      expect(emissions).toEqual(['#7c3aed']);
    });

    it('reverts to the previous valid value when the draft is malformed', () => {
      component.value = '#06b6d4';
      const emissions: string[] = [];
      component.valueChange.subscribe(v => emissions.push(v));
      component.onHexInputChange('not-a-hex');
      component.commitHexInput();
      expect(emissions).toEqual([]);
      expect(component.hex()).toBe('#06b6d4');
      expect(component.hexInput()).toBe('#06b6d4');
    });

    it('accepts an 8-digit hex commit and updates alpha accordingly', () => {
      component.value = '#000000';
      const emissions: string[] = [];
      component.valueChange.subscribe(v => emissions.push(v));
      component.onHexInputChange('#7c3aed40');
      component.commitHexInput();
      expect(emissions[0]).toBe('#7c3aed40');
      expect(component.alphaPct()).toBe(25); // 0x40 / 255 ≈ 0.251
    });
  });

  describe('cssColor()', () => {
    it('matches the emit form for the active state', () => {
      component.value = '#7c3aed';
      expect(component.cssColor()).toBe('#7c3aed');
      component.onAlphaChange(50);
      expect(component.cssColor()).toMatch(/^#7c3aed[0-9a-f]{2}$/);
    });
  });

  describe('alpha clamping', () => {
    it('clamps slider input to [0, 100]', () => {
      component.value = '#7c3aed';
      component.onAlphaChange(150);
      expect(component.alphaPct()).toBe(100);
      component.onAlphaChange(-30);
      expect(component.alphaPct()).toBe(0);
    });
  });

  describe('rendering', () => {
    it('renders the trigger button + swatch', () => {
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector<HTMLButtonElement>(
        'button.cp-trigger',
      );
      expect(trigger).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.cp-swatch')).toBeTruthy();
    });

    it('renders the optional inline label when set', () => {
      component.label = 'Fill';
      fixture.detectChanges();
      const labelEl = fixture.nativeElement.querySelector('.cp-label');
      expect(labelEl?.textContent?.trim()).toBe('Fill');
    });
  });
});
