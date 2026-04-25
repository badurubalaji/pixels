import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';

/**
 * Lightweight color picker with an alpha (transparency) channel (PX-081).
 *
 * @remarks
 * Replaces every bare ``<input type="color">`` across the editor toolbars
 * and property panels. The native input has no alpha support; this
 * component layers a hue picker, a 0–100 alpha slider, and a hex text
 * field inside a MatMenu popover, and emits a CSS-valid color string:
 *
 *   * Alpha = 100 → ``#RRGGBB`` (back-compat with consumers that only
 *     handle 6-digit hex).
 *   * Alpha < 100 → ``#RRGGBBAA`` (8-digit hex; accepted by fabric.js
 *     and modern CSS without a separate `opacity` knob).
 *
 * Visually the trigger swatch sits over a checkered backdrop so the
 * user can SEE the transparency at a glance — same convention Figma /
 * Sketch / Photoshop use.
 *
 * Self-contained — no new runtime deps. Material menu + ripple only.
 *
 * @example
 * ```html
 * <app-color-picker
 *   [value]="textColor()"
 *   (valueChange)="setColor($event)"
 *   label="Text"
 * />
 * ```
 *
 * @see Story PX-081
 */
@Component({
  selector: 'app-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, MatMenuModule, MatRippleModule],
  template: `
    <button
      type="button"
      class="cp-trigger"
      matRipple
      [matMenuTriggerFor]="picker"
      [attr.aria-label]="label ? 'Pick color for ' + label : 'Pick color'"
    >
      <span class="cp-swatch" aria-hidden="true">
        <span class="cp-swatch-fill" [style.background]="cssColor()"></span>
      </span>
      @if (label) {
        <span class="cp-label">{{ label }}</span>
      }
    </button>

    <mat-menu #picker="matMenu" class="cp-menu" xPosition="after">
      <div class="cp-panel" (click)="$event.stopPropagation()">
        <div class="cp-row">
          <label class="cp-row-label">Color</label>
          <input
            type="color"
            class="cp-native"
            [ngModel]="hex()"
            (ngModelChange)="onHexChange($event)"
            data-testid="cp-native"
          />
          <input
            type="text"
            class="cp-hex-input"
            spellcheck="false"
            maxlength="9"
            [ngModel]="hexInput()"
            (ngModelChange)="onHexInputChange($event)"
            (blur)="commitHexInput()"
            (keydown.enter)="commitHexInput()"
            data-testid="cp-hex"
          />
        </div>

        <div class="cp-row">
          <label class="cp-row-label" for="cp-alpha-{{ inputId }}">
            Opacity
          </label>
          <input
            id="cp-alpha-{{ inputId }}"
            type="range"
            class="cp-alpha"
            min="0"
            max="100"
            step="1"
            [ngModel]="alphaPct()"
            (ngModelChange)="onAlphaChange($event)"
            data-testid="cp-alpha"
          />
          <span class="cp-alpha-value">{{ alphaPct() }}%</span>
        </div>

        <div class="cp-preview" aria-hidden="true">
          <span class="cp-preview-fill" [style.background]="cssColor()"></span>
        </div>
      </div>
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      /* Checkered backdrop so transparency is visible on the swatch */
      .cp-swatch,
      .cp-preview {
        background-image:
          linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
          linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
          linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0;
        background-color: #ffffff;
      }

      .cp-trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px;
        background: transparent;
        border: 1px solid var(--px-line, #e2e8f0);
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 160ms ease, background 160ms ease;
      }
      .cp-trigger:hover {
        border-color: rgba(124, 58, 237, 0.45);
        background: rgba(124, 58, 237, 0.06);
      }
      .cp-trigger:focus-visible {
        outline: 3px solid rgba(124, 58, 237, 0.45);
        outline-offset: 3px;
      }

      .cp-swatch {
        position: relative;
        display: inline-block;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.1);
        flex-shrink: 0;
      }
      .cp-swatch-fill {
        position: absolute;
        inset: 0;
      }

      .cp-label {
        font-size: 0.78rem;
        color: var(--px-ink-soft, #334155);
        font-weight: 500;
      }

      :host ::ng-deep .cp-menu.mat-mdc-menu-panel {
        min-width: 240px;
        border-radius: 12px !important;
        padding: 0;
        box-shadow: 0 16px 36px -12px rgba(15, 23, 42, 0.22),
          0 0 0 1px rgba(15, 23, 42, 0.05);
      }

      .cp-panel {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .cp-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .cp-row-label {
        font-size: 0.74rem;
        color: var(--px-muted, #64748b);
        font-weight: 500;
        width: 56px;
        flex-shrink: 0;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .cp-native {
        width: 32px;
        height: 32px;
        padding: 0;
        border: 1px solid var(--px-line, #e2e8f0);
        border-radius: 6px;
        background: transparent;
        cursor: pointer;
      }
      /* Strip native swatch chrome */
      .cp-native::-webkit-color-swatch-wrapper { padding: 0; }
      .cp-native::-webkit-color-swatch { border: none; border-radius: 5px; }
      .cp-native::-moz-color-swatch { border: none; border-radius: 5px; }

      .cp-hex-input {
        flex: 1 1 auto;
        height: 32px;
        padding: 0 10px;
        font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
        font-size: 0.85rem;
        color: var(--px-ink, #0f172a);
        background: var(--px-page, #f8fafc);
        border: 1px solid var(--px-line, #e2e8f0);
        border-radius: 6px;
        outline: none;
      }
      .cp-hex-input:focus {
        border-color: var(--px-violet, #7c3aed);
        background: #ffffff;
      }

      .cp-alpha {
        flex: 1 1 auto;
        accent-color: var(--px-violet, #7c3aed);
      }
      .cp-alpha-value {
        width: 40px;
        text-align: right;
        font-size: 0.78rem;
        color: var(--px-ink, #0f172a);
        font-feature-settings: 'tnum' 1;
      }

      .cp-preview {
        position: relative;
        height: 36px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
      }
      .cp-preview-fill {
        position: absolute;
        inset: 0;
      }
    `,
  ],
})
export class ColorPickerComponent {
  /** Stable id used to associate the alpha range input with its label. */
  readonly inputId = Math.random().toString(36).slice(2, 8);

  /**
   * Current color value in `#RRGGBB`, `#RRGGBBAA`, or `rgba(...)` form.
   * Hex strings are normalized internally to `#RRGGBBAA`; emitted values
   * follow the alpha-aware emit policy (see {@link emitChange}).
   */
  @Input()
  set value(v: string | null | undefined) {
    if (!v) return;
    const parsed = this.parseColor(v);
    this.hex.set(parsed.hex6);
    this.alphaPct.set(parsed.alphaPct);
    this.hexInput.set(this.composeHex(parsed.hex6, parsed.alphaPct));
  }

  /** Optional inline label shown next to the swatch (e.g. "Text", "Fill"). */
  @Input() label = '';

  /**
   * Emits the new color whenever the user picks a hue, drags the alpha
   * slider, or commits a hex text-field edit.
   *
   * @remarks
   * Emission policy:
   *   - Alpha 100 → `#RRGGBB` (6-digit hex; back-compat with consumers
   *     that only handle the original native-input format).
   *   - Alpha < 100 → `#RRGGBBAA` (8-digit hex; accepted by fabric.js
   *     and modern CSS).
   */
  @Output() valueChange = new EventEmitter<string>();

  /** 6-digit hex of the picked hue (no alpha). */
  readonly hex = signal<string>('#000000');
  /** Alpha as an integer percentage 0..100 — easier to reason about than 0..1. */
  readonly alphaPct = signal<number>(100);
  /** Live text-field draft (may temporarily be invalid while typing). */
  readonly hexInput = signal<string>('#000000');

  /**
   * Composed CSS color string for visual swatches and previews.
   *
   * @returns ``#RRGGBB`` or ``#RRGGBBAA`` matching the emit policy.
   */
  readonly cssColor = computed<string>(() =>
    this.composeHex(this.hex(), this.alphaPct()),
  );

  /**
   * Handle the native color-input's change. Updates the hue, leaves
   * alpha alone, and re-emits.
   *
   * @param next - 6-digit hex from the native picker.
   */
  onHexChange(next: string): void {
    if (!/^#[0-9a-fA-F]{6}$/.test(next)) return;
    this.hex.set(next.toLowerCase());
    this.hexInput.set(this.composeHex(this.hex(), this.alphaPct()));
    this.emitChange();
  }

  /**
   * Handle alpha-slider input.
   *
   * @param next - 0..100 percentage (slider's reported value).
   */
  onAlphaChange(next: number): void {
    const v = Math.max(0, Math.min(100, Math.round(Number(next) || 0)));
    this.alphaPct.set(v);
    this.hexInput.set(this.composeHex(this.hex(), this.alphaPct()));
    this.emitChange();
  }

  /**
   * Mirror typing into the hex text field — does NOT emit until commit
   * (`Enter` or `blur`) so partial values don't fire the (valueChange).
   */
  onHexInputChange(next: string): void {
    this.hexInput.set(next);
  }

  /**
   * Commit the hex text-field draft if it parses cleanly. Invalid
   * drafts revert to the previous value silently.
   */
  commitHexInput(): void {
    const draft = this.hexInput().trim();
    const parsed = this.parseColor(draft);
    if (!parsed.valid) {
      this.hexInput.set(this.composeHex(this.hex(), this.alphaPct()));
      return;
    }
    this.hex.set(parsed.hex6);
    this.alphaPct.set(parsed.alphaPct);
    this.hexInput.set(this.composeHex(parsed.hex6, parsed.alphaPct));
    this.emitChange();
  }

  /**
   * Parse any of the supported input forms into our normalized
   * `(hex6, alphaPct)` pair.
   *
   * @param input - `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`, or
   *   `rgb(...)` / `rgba(...)`. Whitespace is trimmed.
   * @returns Normalized 6-digit hex (lowercased) + alpha 0..100 pct.
   *   `valid: false` if nothing parsed.
   */
  private parseColor(input: string): {
    hex6: string;
    alphaPct: number;
    valid: boolean;
  } {
    const s = input.trim();
    // Short hex: #RGB or #RGBA
    let m = /^#([0-9a-f]{3})([0-9a-f])?$/i.exec(s);
    if (m) {
      const r = m[1][0],
        g = m[1][1],
        b = m[1][2];
      const a = m[2];
      const hex6 = `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
      const alpha = a ? parseInt(a + a, 16) / 255 : 1;
      return { hex6, alphaPct: Math.round(alpha * 100), valid: true };
    }
    // Long hex: #RRGGBB or #RRGGBBAA
    m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
    if (m) {
      const hex6 = `#${m[1]}`.toLowerCase();
      const alpha = m[2] ? parseInt(m[2], 16) / 255 : 1;
      return { hex6, alphaPct: Math.round(alpha * 100), valid: true };
    }
    // rgb(r,g,b) / rgba(r,g,b,a)
    m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i.exec(s);
    if (m) {
      const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
      const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
      const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
      const a = m[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1;
      const hex6 = `#${r.toString(16).padStart(2, '0')}${g
        .toString(16)
        .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toLowerCase();
      return { hex6, alphaPct: Math.round(a * 100), valid: true };
    }
    return { hex6: '#000000', alphaPct: 100, valid: false };
  }

  /**
   * Compose the canonical emit string from `(hex6, alphaPct)`.
   *
   * @param hex6 - 6-digit lowercased hex with leading `#`.
   * @param alphaPct - Alpha as 0..100 integer percentage.
   * @returns `#RRGGBB` when alpha is 100, otherwise `#RRGGBBAA`.
   */
  private composeHex(hex6: string, alphaPct: number): string {
    if (alphaPct >= 100) return hex6;
    const a = Math.round((Math.max(0, Math.min(100, alphaPct)) / 100) * 255);
    return `${hex6}${a.toString(16).padStart(2, '0')}`;
  }

  /**
   * Emit the current `(hex, alpha)` pair as a single canonical string.
   *
   * @remarks
   * Tested via the public method on the spec — kept private here so
   * consumers can only drive emission through the input-handler trio.
   */
  private emitChange(): void {
    this.valueChange.emit(this.composeHex(this.hex(), this.alphaPct()));
  }
}
