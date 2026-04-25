import { Component, inject, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CanvasService } from '../../../core/services/canvas.service';
import { FontService } from '../../../core/services/font.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { AlignmentPanelComponent } from './alignment-panel';
import { GradientPanelComponent } from './gradient-panel';
import { BackgroundPanelComponent } from './background-panel';
import { GOOGLE_FONTS, SYSTEM_FONTS, FontEntry } from '../../../core/services/font.service';
import { AnimationService, ANIMATION_PRESETS, AnimationType } from '../../../core/services/animation.service';
import { AccessibilityService, ContrastResult } from '../../../core/services/accessibility.service';
import { ColorPickerComponent } from '../../../shared/components/color-picker.component';
import * as fabric from 'fabric';

interface ObjectProps {
  left: number;
  top: number;
  width: number;
  height: number;
  angle: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  // Text-specific
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  text?: string;
  underline?: boolean;
  linethrough?: boolean;
  charSpacing?: number;
  lineHeight?: number;
}

@Component({
  selector: 'app-property-panel',
  imports: [
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatTooltipModule,
    AlignmentPanelComponent,
    GradientPanelComponent,
    MatAutocompleteModule,
    MatChipsModule,
    ColorPickerComponent,
    BackgroundPanelComponent,
  ],
  template: `
    <aside class="property-panel">
      <div class="panel-header">
        <h3>Properties</h3>
      </div>

      @if (props(); as p) {
        <div class="panel-content">
          <!-- Position & Size -->
          <mat-expansion-panel expanded>
            <mat-expansion-panel-header>
              <mat-panel-title>Transform</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="prop-grid">
              <mat-form-field appearance="outline" class="prop-field">
                <mat-label>X</mat-label>
                <input matInput type="number" [ngModel]="p.left" (ngModelChange)="updateProp('left', $event)" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="prop-field">
                <mat-label>Y</mat-label>
                <input matInput type="number" [ngModel]="p.top" (ngModelChange)="updateProp('top', $event)" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="prop-field">
                <mat-label>W</mat-label>
                <input matInput type="number" [ngModel]="p.width" (ngModelChange)="updateScaledWidth($event)" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="prop-field">
                <mat-label>H</mat-label>
                <input matInput type="number" [ngModel]="p.height" (ngModelChange)="updateScaledHeight($event)" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Rotation</mat-label>
              <input matInput type="number" [ngModel]="p.angle" (ngModelChange)="updateProp('angle', $event)" />
            </mat-form-field>

            <div class="slider-row">
              <span>Opacity</span>
              <mat-slider min="0" max="1" step="0.01" class="flex-slider">
                <input matSliderThumb [ngModel]="p.opacity" (ngModelChange)="updateProp('opacity', $event)" />
              </mat-slider>
              <span class="slider-value">{{ (p.opacity * 100).toFixed(0) }}%</span>
            </div>
          </mat-expansion-panel>

          @if (isPhotoFrame()) {
            <!-- PX-105: prominent top-row Add/Replace button so the action is
                 visible for ANY frame selection (filled or empty), not buried
                 inside the expansion panel below. -->
            <div class="frame-quick-actions">
              <button
                mat-flat-button
                class="frame-replace-btn frame-replace-btn--prominent"
                data-testid="frame-replace-top"
                (click)="onReplacePhotoClick()"
              >
                <mat-icon>{{ isEmptyPhotoFrame() ? 'add_photo_alternate' : 'swap_horiz' }}</mat-icon>
                {{ isEmptyPhotoFrame() ? 'Add photo' : 'Replace photo' }}
              </button>
            </div>

            <!-- Photo in frame — crop / resize / adjust / rotate (PX-094 + PX-095) -->
            <mat-expansion-panel expanded>
              <mat-expansion-panel-header>
                <mat-panel-title>Photo in frame</mat-panel-title>
              </mat-expansion-panel-header>

              <p class="frame-controls-hint">
                @if (frameFitMode() === 'cover') {
                  <strong>Cover mode.</strong> Drag the sliders to pan and
                  zoom the photo inside the slot. The over-scan crops to
                  the frame's edges.
                } @else if (frameFitMode() === 'contain') {
                  <strong>Contain mode.</strong> Whole photo is visible
                  (may letterbox). Switch to <em>cover</em> on the
                  toolbar above to crop and reposition.
                } @else {
                  <strong>Fill mode.</strong> Photo stretches to fill the
                  frame (aspect ratio not preserved). Switch to
                  <em>cover</em> on the toolbar above to crop instead.
                }
              </p>

              @if (frameFitMode() === 'cover') {
                <div class="slider-row">
                  <span>Horizontal</span>
                  <mat-slider min="-1" max="1" step="0.05" class="flex-slider">
                    <input
                      matSliderThumb
                      [ngModel]="framePanX()"
                      (ngModelChange)="setFrameView('panX', $event)"
                      (change)="commitFrameSlider()"
                      data-testid="frame-pan-x"
                    />
                  </mat-slider>
                  <span class="slider-value">{{ framePanX().toFixed(2) }}</span>
                </div>

                <div class="slider-row">
                  <span>Vertical</span>
                  <mat-slider min="-1" max="1" step="0.05" class="flex-slider">
                    <input
                      matSliderThumb
                      [ngModel]="framePanY()"
                      (ngModelChange)="setFrameView('panY', $event)"
                      (change)="commitFrameSlider()"
                      data-testid="frame-pan-y"
                    />
                  </mat-slider>
                  <span class="slider-value">{{ framePanY().toFixed(2) }}</span>
                </div>

                <div class="slider-row">
                  <span>Resize</span>
                  <mat-slider min="1" max="4" step="0.05" class="flex-slider">
                    <input
                      matSliderThumb
                      [ngModel]="frameZoom()"
                      (ngModelChange)="setFrameView('zoom', $event)"
                      (change)="commitFrameSlider()"
                      data-testid="frame-zoom"
                    />
                  </mat-slider>
                  <span class="slider-value">{{ frameZoom().toFixed(2) }}×</span>
                </div>
              }

              <!-- PX-108 — Canva-style aspect-ratio chips. Resize the slot
                   to a target ratio; "Freeform" leaves the current dims.
                   PX-109: "Original" maps to the photo's natural aspect
                   and is hidden for empty placeholders (no photo yet). -->
              <div class="frame-shape-row">
                <span class="frame-shape-label">Aspect</span>
                <div class="frame-aspect-chips" data-testid="frame-aspect-chips">
                  @for (a of frameAspectOptions; track a.id) {
                    @if (a.id !== 'original' || !isEmptyPhotoFrame()) {
                      <button
                        type="button"
                        class="frame-aspect-chip"
                        [class.active]="frameAspect() === a.id"
                        [attr.data-aspect]="a.id"
                        (click)="setFrameAspect(a.id)"
                      >
                        {{ a.label }}
                      </button>
                    }
                  }
                </div>
              </div>

              <!-- PX-109 — Smart Crop button. Auto-fits the slot to the
                   photo's natural aspect, cover mode, zero pan/zoom.
                   Hidden for empty placeholders since they have no photo
                   to fit to. -->
              @if (!isEmptyPhotoFrame()) {
                <button
                  mat-flat-button
                  class="frame-smart-crop-btn"
                  data-testid="frame-smart-crop"
                  matTooltip="Auto-fit photo to its natural aspect"
                  (click)="smartCrop()"
                >
                  <mat-icon>auto_awesome</mat-icon>
                  Smart Crop
                </button>
              }

              <!-- PX-103 — switch the frame's clip shape after creation. -->
              <div class="frame-shape-row">
                <span class="frame-shape-label">Shape</span>
                <div class="frame-shape-buttons" data-testid="frame-shape-buttons">
                  @for (s of frameShapeOptions; track s.id) {
                    <button
                      type="button"
                      class="frame-shape-btn"
                      [class.active]="frameShape() === s.id"
                      [matTooltip]="s.label"
                      [attr.data-shape]="s.id"
                      (click)="setFrameShape(s.id)"
                    >
                      <mat-icon>{{ s.icon }}</mat-icon>
                    </button>
                  }
                </div>
              </div>

              <!-- Slot rotation (PX-095) — drives frame.angle directly. -->
              <div class="slider-row">
                <span>Rotate</span>
                <mat-slider min="-180" max="180" step="1" class="flex-slider">
                  <input
                    matSliderThumb
                    [ngModel]="p.angle"
                    (ngModelChange)="updateProp('angle', $event)"
                    data-testid="frame-rotate"
                  />
                </mat-slider>
                <span class="slider-value">{{ (p.angle ?? 0).toFixed(0) }}°</span>
              </div>

              <!-- Photo tilt (PX-096) — rotates the photo INSIDE the slot. -->
              @if (frameFitMode() !== 'fill') {
                <div class="slider-row">
                  <span>Photo tilt</span>
                  <mat-slider min="-45" max="45" step="1" class="flex-slider">
                    <input
                      matSliderThumb
                      [ngModel]="framePhotoAngle()"
                      (ngModelChange)="setFramePhotoAngle($event)"
                      (change)="commitFrameSlider()"
                      data-testid="frame-photo-angle"
                    />
                  </mat-slider>
                  <span class="slider-value">{{ framePhotoAngle().toFixed(0) }}°</span>
                </div>
              }

              <button
                mat-button
                class="frame-reset-btn"
                data-testid="frame-reset"
                (click)="resetFrameView()"
                [disabled]="frameFitMode() !== 'cover'"
              >
                <mat-icon>restart_alt</mat-icon>
                Reset crop &amp; zoom
              </button>

              <!-- PX-098: guaranteed "Replace" path independent of the
                   canvas click-to-fill detector. -->
              <button
                mat-flat-button
                class="frame-replace-btn"
                data-testid="frame-replace"
                (click)="onReplacePhotoClick()"
              >
                <mat-icon>swap_horiz</mat-icon>
                Replace photo
              </button>
            </mat-expansion-panel>
          }

          <!-- Fill & Stroke -->
          <mat-expansion-panel expanded>
            <mat-expansion-panel-header>
              <mat-panel-title>Appearance</mat-panel-title>
            </mat-expansion-panel-header>

            <app-gradient-panel />

            <div class="color-row">
              <label>Stroke</label>
              <app-color-picker
                [value]="p.stroke || '#000000'"
                (valueChange)="updateProp('stroke', $event)"
              />
              <mat-form-field appearance="outline" class="color-text">
                <input matInput type="number" [ngModel]="p.strokeWidth" (ngModelChange)="updateProp('strokeWidth', $event)" placeholder="Width" />
              </mat-form-field>
            </div>
          </mat-expansion-panel>

          <!-- Animation -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Animation</mat-panel-title>
            </mat-expansion-panel-header>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Enter Animation</mat-label>
              <mat-select [ngModel]="objectAnimation()" (ngModelChange)="setObjectAnimation($event)">
                @for (preset of animationPresets; track preset.type) {
                  <mat-option [value]="preset.type">{{ preset.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (objectAnimation() !== 'none') {
              <div class="slider-row">
                <span>Duration</span>
                <mat-slider min="200" max="2000" step="100" class="flex-slider">
                  <input matSliderThumb [ngModel]="animationDuration()" (ngModelChange)="setAnimationDuration($event)" />
                </mat-slider>
                <span class="slider-value">{{ animationDuration() }}ms</span>
              </div>

              <div class="slider-row">
                <span>Delay</span>
                <mat-slider min="0" max="2000" step="100" class="flex-slider">
                  <input matSliderThumb [ngModel]="animationDelay()" (ngModelChange)="setAnimationDelay($event)" />
                </mat-slider>
                <span class="slider-value">{{ animationDelay() }}ms</span>
              </div>

              <button mat-stroked-button class="full-width" (click)="previewAnimation()">
                <mat-icon>play_arrow</mat-icon>
                Preview
              </button>
            }
          </mat-expansion-panel>

          <!-- Blend Mode -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Blend Mode</mat-panel-title>
            </mat-expansion-panel-header>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Mode</mat-label>
              <mat-select [ngModel]="blendMode()" (ngModelChange)="setBlendMode($event)">
                @for (mode of blendModes; track mode.value) {
                  <mat-option [value]="mode.value">{{ mode.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </mat-expansion-panel>

          <!-- Text Properties -->
          @if (isTextObject()) {
            <mat-expansion-panel expanded>
              <mat-expansion-panel-header>
                <mat-panel-title>Typography</mat-panel-title>
              </mat-expansion-panel-header>

              <!-- Font category chips -->
              <div class="font-categories">
                @for (cat of fontCategories; track cat.value) {
                  <button
                    class="font-cat-chip"
                    [class.active]="activeFontCategory() === cat.value"
                    (click)="setFontCategory(cat.value)"
                  >{{ cat.label }}</button>
                }
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Font Family</mat-label>
                <input
                  matInput
                  [ngModel]="fontSearchText()"
                  (ngModelChange)="onFontSearchChange($event)"
                  [matAutocomplete]="fontAuto"
                  placeholder="Search fonts..."
                />
                <mat-autocomplete #fontAuto="matAutocomplete" (optionSelected)="onFontSelected($event.option.value)">
                  @for (font of filteredFonts(); track font) {
                    <mat-option [value]="font" [style.fontFamily]="font">{{ font }}</mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Font Size</mat-label>
                <input matInput type="number" [ngModel]="p.fontSize" (ngModelChange)="updateProp('fontSize', $event)" min="1" />
              </mat-form-field>

              <div class="text-style-row">
                <mat-button-toggle-group multiple>
                  <mat-button-toggle
                    [checked]="p.fontWeight === 'bold'"
                    (change)="toggleFontWeight()"
                    matTooltip="Bold"
                  >
                    <mat-icon>format_bold</mat-icon>
                  </mat-button-toggle>
                  <mat-button-toggle
                    [checked]="p.fontStyle === 'italic'"
                    (change)="toggleFontStyle()"
                    matTooltip="Italic"
                  >
                    <mat-icon>format_italic</mat-icon>
                  </mat-button-toggle>
                  <mat-button-toggle
                    [checked]="p.underline"
                    (change)="toggleUnderline()"
                    matTooltip="Underline"
                  >
                    <mat-icon>format_underlined</mat-icon>
                  </mat-button-toggle>
                  <mat-button-toggle
                    [checked]="p.linethrough"
                    (change)="toggleLinethrough()"
                    matTooltip="Strikethrough"
                  >
                    <mat-icon>strikethrough_s</mat-icon>
                  </mat-button-toggle>
                </mat-button-toggle-group>
              </div>

              <div class="text-style-row">
                <mat-button-toggle-group [ngModel]="p.textAlign" (ngModelChange)="updateProp('textAlign', $event)">
                  <mat-button-toggle value="left" matTooltip="Align Left">
                    <mat-icon>format_align_left</mat-icon>
                  </mat-button-toggle>
                  <mat-button-toggle value="center" matTooltip="Align Center">
                    <mat-icon>format_align_center</mat-icon>
                  </mat-button-toggle>
                  <mat-button-toggle value="right" matTooltip="Align Right">
                    <mat-icon>format_align_right</mat-icon>
                  </mat-button-toggle>
                </mat-button-toggle-group>
              </div>

              <div class="slider-row">
                <span>Spacing</span>
                <mat-slider min="0" max="1000" step="10" class="flex-slider">
                  <input matSliderThumb [ngModel]="p.charSpacing ?? 0" (ngModelChange)="updateProp('charSpacing', $event)" />
                </mat-slider>
                <span class="slider-value">{{ p.charSpacing ?? 0 }}</span>
              </div>

              <div class="slider-row">
                <span>Line H.</span>
                <mat-slider min="0.5" max="3" step="0.1" class="flex-slider">
                  <input matSliderThumb [ngModel]="p.lineHeight ?? 1.16" (ngModelChange)="updateProp('lineHeight', $event)" />
                </mat-slider>
                <span class="slider-value">{{ (p.lineHeight ?? 1.16).toFixed(1) }}</span>
              </div>

              <button mat-stroked-button class="full-width" (click)="toggleUppercase()">
                <mat-icon>text_fields</mat-icon>
                UPPERCASE
              </button>

              @if (contrastResult(); as cr) {
                <div class="contrast-badge"
                  [class.pass]="cr.passAA"
                  [class.fail]="!cr.passAA"
                  [matTooltip]="cr.passAAA ? 'WCAG AAA pass' : (cr.passAA ? 'WCAG AA pass' : 'Below WCAG AA — improve readability')">
                  <mat-icon>{{ cr.passAA ? 'check_circle' : 'warning' }}</mat-icon>
                  <span>Contrast {{ cr.ratio }}:1</span>
                  <span class="badge-tag">
                    @if (cr.passAAA) { AAA }
                    @else if (cr.passAA) { AA }
                    @else if (cr.passAALarge) { AA Large }
                    @else { Fail }
                  </span>
                </div>
              }

              <!-- Curve Text -->
              <div class="slider-row" style="margin-top: 8px;">
                <span>Curve</span>
                <mat-slider min="-100" max="100" step="5" class="flex-slider">
                  <input matSliderThumb [ngModel]="textCurve()" (ngModelChange)="textCurve.set($event)" />
                </mat-slider>
                <span class="slider-value">{{ textCurve() }}</span>
              </div>
              <button mat-stroked-button class="full-width" [disabled]="textCurve() === 0" (click)="applyCurveToText()">
                <mat-icon>text_rotation_none</mat-icon>
                Apply Curve
              </button>
            </mat-expansion-panel>

            <!-- Text Outline -->
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>Text Outline</mat-panel-title>
              </mat-expansion-panel-header>

              <div class="color-row">
                <label>Color</label>
                <app-color-picker
                  [value]="textStrokeColor()"
                  (valueChange)="updateTextStroke('color', $event)"
                />
              </div>
              <div class="slider-row">
                <span>Width</span>
                <mat-slider min="0" max="10" step="0.5" class="flex-slider">
                  <input matSliderThumb [ngModel]="textStrokeWidth()" (ngModelChange)="updateTextStroke('width', $event)" />
                </mat-slider>
                <span class="slider-value">{{ textStrokeWidth() }}</span>
              </div>
              <button mat-button (click)="removeTextStroke()">Remove Outline</button>
            </mat-expansion-panel>
          }

          <!-- Alignment -->
          <app-alignment-panel />

          <!-- Shadow -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>Shadow</mat-panel-title>
            </mat-expansion-panel-header>

            <div class="shadow-presets">
              @for (preset of shadowPresets; track preset.name) {
                <button class="shadow-preset-btn" (click)="applyShadowPreset(preset)" [matTooltip]="preset.name">
                  <div class="preset-preview" [style.box-shadow]="preset.css"></div>
                  <span>{{ preset.name }}</span>
                </button>
              }
            </div>

            <div class="slider-row">
              <span>Blur</span>
              <mat-slider min="0" max="50" step="1" class="flex-slider">
                <input matSliderThumb [ngModel]="shadowBlur()" (ngModelChange)="updateShadow('blur', $event)" />
              </mat-slider>
              <span class="slider-value">{{ shadowBlur() }}</span>
            </div>
            <div class="slider-row">
              <span>X</span>
              <mat-slider min="-50" max="50" step="1" class="flex-slider">
                <input matSliderThumb [ngModel]="shadowOffsetX()" (ngModelChange)="updateShadow('offsetX', $event)" />
              </mat-slider>
              <span class="slider-value">{{ shadowOffsetX() }}</span>
            </div>
            <div class="slider-row">
              <span>Y</span>
              <mat-slider min="-50" max="50" step="1" class="flex-slider">
                <input matSliderThumb [ngModel]="shadowOffsetY()" (ngModelChange)="updateShadow('offsetY', $event)" />
              </mat-slider>
              <span class="slider-value">{{ shadowOffsetY() }}</span>
            </div>
            <div class="color-row">
              <label>Color</label>
              <app-color-picker
                [value]="shadowColor()"
                (valueChange)="updateShadow('color', $event)"
              />
            </div>
            <button mat-button (click)="removeShadow()">Remove Shadow</button>
          </mat-expansion-panel>

          <!-- Corner Radius -->
          @if (isRectObject()) {
            <div class="slider-row" style="padding: 8px 12px;">
              <span>Radius</span>
              <mat-slider min="0" max="100" step="1" class="flex-slider">
                <input matSliderThumb [ngModel]="cornerRadius()" (ngModelChange)="updateCornerRadius($event)" />
              </mat-slider>
              <span class="slider-value">{{ cornerRadius() }}</span>
            </div>
          }

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button mat-stroked-button (click)="bringForward()">
              <mat-icon>flip_to_front</mat-icon> Forward
            </button>
            <button mat-stroked-button (click)="sendBackward()">
              <mat-icon>flip_to_back</mat-icon> Back
            </button>
          </div>
          <!-- Rotate & Flip -->
          <div class="quick-actions">
            <button mat-icon-button matTooltip="Rotate 90° CW" (click)="rotateCW()">
              <mat-icon>rotate_right</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Rotate 90° CCW" (click)="rotateCCW()">
              <mat-icon>rotate_left</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Flip Horizontal" (click)="flipH()">
              <mat-icon>swap_horiz</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Flip Vertical" (click)="flipV()">
              <mat-icon>swap_vert</mat-icon>
            </button>
            <button mat-icon-button [matTooltip]="isLocked() ? 'Unlock' : 'Lock'" (click)="toggleLock()">
              <mat-icon>{{ isLocked() ? 'lock' : 'lock_open' }}</mat-icon>
            </button>
          </div>

          <div class="quick-actions">
            <button mat-stroked-button (click)="groupSelected()" matTooltip="Ctrl+G">
              <mat-icon>group_work</mat-icon> Group
            </button>
            <button mat-stroked-button (click)="ungroupSelected()" matTooltip="Ctrl+Shift+G">
              <mat-icon>workspaces</mat-icon> Ungroup
            </button>
          </div>

          <!-- PX-116 — page background reachable even with a selection.
               Collapsed by default so it doesn't dominate the panel; users
               who want to recolor the page can click outside any object or
               just expand this section. -->
          <mat-expansion-panel class="bg-expansion">
            <mat-expansion-panel-header>
              <mat-panel-title>Page background</mat-panel-title>
            </mat-expansion-panel-header>
            <app-background-panel />
            <div class="bg-quick-swatches">
              <span class="bg-quick-label">Quick colors</span>
              <div class="bg-swatch-row">
                @for (c of bgQuickSwatches; track c) {
                  <button
                    type="button"
                    class="bg-swatch"
                    [style.background]="c"
                    [class.active]="canvasService.backgroundColor() === c"
                    (click)="setBackgroundColor(c)"
                  ></button>
                }
              </div>
            </div>
            <div class="bg-opacity-row">
              <span class="bg-opacity-label">Transparency</span>
              <mat-slider min="0" max="1" step="0.05" class="flex-slider">
                <input
                  matSliderThumb
                  [ngModel]="canvasService.backgroundOpacity()"
                  (ngModelChange)="setBackgroundOpacity($event)"
                />
              </mat-slider>
              <span class="bg-opacity-value">{{ (canvasService.backgroundOpacity() * 100).toFixed(0) }}%</span>
            </div>
          </mat-expansion-panel>
        </div>
      } @else {
        <!-- PX-113 — when nothing on the canvas is selected, treat the
             "no-selection" state as "page / background selected" so the
             user can recolor the canvas without hunting through the sidebar.
             Mirrors Canva's pattern (clicking the empty canvas surfaces
             the page-level color tools). -->
        <div class="panel-content">
          <div class="bg-panel-header">
            <mat-icon>crop_landscape</mat-icon>
            <span>Page background</span>
          </div>

          <app-background-panel />

          <div class="bg-quick-swatches">
            <span class="bg-quick-label">Quick colors</span>
            <div class="bg-swatch-row">
              @for (c of bgQuickSwatches; track c) {
                <button
                  type="button"
                  class="bg-swatch"
                  [style.background]="c"
                  [class.active]="canvasService.backgroundColor() === c"
                  [attr.data-color]="c"
                  (click)="setBackgroundColor(c)"
                ></button>
              }
            </div>
          </div>

          <!-- PX-115 — opacity slider for solid-color backgrounds. -->
          <div class="bg-opacity-row">
            <span class="bg-opacity-label">Transparency</span>
            <mat-slider min="0" max="1" step="0.05" class="flex-slider">
              <input
                matSliderThumb
                [ngModel]="canvasService.backgroundOpacity()"
                (ngModelChange)="setBackgroundOpacity($event)"
                data-testid="bg-opacity"
              />
            </mat-slider>
            <span class="bg-opacity-value">{{ (canvasService.backgroundOpacity() * 100).toFixed(0) }}%</span>
          </div>

          <p class="bg-hint">Tip: click any object on the canvas to edit it instead.</p>
        </div>
      }
    </aside>
  `,
  styles: [`
    .property-panel {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .panel-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      h3 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.7;
      }
    }

    .panel-content {
      padding: 8px;
    }

    .prop-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .prop-field {
      width: 100%;
    }

    .full-width {
      width: 100%;
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;

      span:first-child {
        font-size: 0.85rem;
        min-width: 52px;
      }

      .flex-slider {
        flex: 1;
      }

      .slider-value {
        font-size: 0.8rem;
        min-width: 36px;
        text-align: right;
        opacity: 0.7;
      }
    }

    .color-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      label {
        font-size: 0.85rem;
        min-width: 40px;
      }

      .color-input {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        padding: 0;
        background: none;
      }

      .color-text {
        flex: 1;
      }
    }

    .font-categories {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .font-cat-chip {
      padding: 3px 10px;
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: none;
      color: inherit;
      font-size: 0.72rem;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: var(--mat-sys-primary);
      }

      &.active {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        border-color: var(--mat-sys-primary);
      }
    }

    .text-style-row {
      margin-bottom: 12px;

      mat-button-toggle-group {
        width: 100%;
      }
    }

    .contrast-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-top: 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      border: 1px solid var(--mat-sys-outline-variant);

      mat-icon { font-size: 18px; height: 18px; width: 18px; }
      .badge-tag {
        margin-left: auto;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--mat-sys-surface-container-highest);
      }

      &.pass {
        background: rgba(16, 185, 129, 0.12);
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.3);
      }
      &.fail {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.3);
      }
    }

    .shadow-presets {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }

    .shadow-preset-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      color: inherit;
      transition: all 0.15s;

      .preset-preview {
        width: 28px;
        height: 28px;
        background: var(--mat-sys-on-surface);
        border-radius: 4px;
      }

      span {
        font-size: 0.68rem;
        opacity: 0.6;
      }

      &:hover {
        border-color: var(--mat-sys-primary);
      }
    }

    .quick-actions {
      display: flex;
      gap: 8px;
      padding: 12px 0;

      button {
        flex: 1;
        font-size: 0.8rem;
      }
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      opacity: 0.4;
      text-align: center;

      mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        margin-bottom: 12px;
      }

      p {
        font-size: 0.85rem;
      }
    }

    ::ng-deep .property-panel {
      .mat-expansion-panel {
        margin-bottom: 4px;
        box-shadow: none !important;
      }

      .mat-expansion-panel-header {
        padding: 0 12px;
        height: 40px;
      }

      .mat-expansion-panel-body {
        padding: 8px 12px;
      }

      .mat-mdc-form-field {
        font-size: 0.85rem;
      }
    }

    /* PX-094 + PX-095 — photo-frame controls panel */
    .frame-controls-hint {
      margin: 0 0 12px;
      padding: 10px 12px;
      background: rgba(124, 58, 237, 0.06);
      border: 1px solid rgba(124, 58, 237, 0.18);
      border-radius: 8px;
      font-size: 0.78rem;
      line-height: 1.5;
      color: var(--px-ink-soft, #334155);
    }
    .frame-controls-hint strong { color: var(--px-ink, #0f172a); }
    .frame-controls-hint em {
      font-style: normal;
      font-weight: 600;
      color: var(--px-violet, #7c3aed);
    }

    .frame-reset-btn {
      width: 100%;
      margin-top: 6px;
    }
    .frame-reset-btn[disabled] {
      opacity: 0.4;
    }
    .frame-replace-btn {
      width: 100%;
      margin-top: 8px;
      background: linear-gradient(135deg, var(--px-violet, #7c3aed) 0%, #a855f7 100%) !important;
      color: #ffffff !important;
      border-radius: 10px !important;
    }
    /* PX-105 — top-row variant; same gradient, no top margin since it sits
       at the top of the photo-frame section. */
    .frame-quick-actions {
      padding: 0 4px 8px;
    }
    .frame-replace-btn--prominent {
      margin-top: 0 !important;
      height: 40px !important;
      font-weight: 600 !important;
    }

    /* PX-103 — frame shape selector */
    .frame-shape-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    .frame-shape-label {
      font-size: 0.78rem;
      color: var(--px-ink-soft, #334155);
      flex-shrink: 0;
      min-width: 60px;
    }
    .frame-shape-buttons {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 4px;
      flex: 1;
    }
    .frame-shape-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      background: var(--px-surface, #ffffff);
      border: 1px solid var(--px-line, #e2e8f0);
      border-radius: 8px;
      color: var(--px-ink-soft, #334155);
      cursor: pointer;
      transition: border-color 160ms ease, background 160ms ease,
        color 160ms ease;
    }
    .frame-shape-btn:hover {
      border-color: rgba(124, 58, 237, 0.4);
      color: var(--px-violet, #7c3aed);
    }
    .frame-shape-btn.active {
      background: linear-gradient(135deg, var(--px-violet, #7c3aed) 0%, #a855f7 100%);
      border-color: transparent;
      color: #ffffff;
    }
    .frame-shape-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* PX-108 — aspect-ratio chips */
    .frame-aspect-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      flex: 1;
    }
    .frame-aspect-chip {
      padding: 4px 10px;
      font-size: 0.72rem;
      font-weight: 500;
      background: var(--px-surface, #ffffff);
      border: 1px solid var(--px-line, #e2e8f0);
      border-radius: 14px;
      color: var(--px-ink-soft, #334155);
      cursor: pointer;
      transition: border-color 160ms ease, background 160ms ease,
        color 160ms ease;
    }
    .frame-aspect-chip:hover {
      border-color: rgba(124, 58, 237, 0.4);
      color: var(--px-violet, #7c3aed);
    }
    .frame-aspect-chip.active {
      background: linear-gradient(135deg, var(--px-violet, #7c3aed) 0%, #a855f7 100%);
      border-color: transparent;
      color: #ffffff;
    }

    /* PX-109 — Smart Crop primary action */
    .frame-smart-crop-btn {
      width: 100%;
      margin-top: 8px;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%) !important;
      color: #ffffff !important;
      border-radius: 10px !important;
      font-weight: 600 !important;
    }

    /* PX-113 — Background editing affordance in the empty-selection state */
    .bg-panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 12px 6px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--px-ink-soft, #334155);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--px-violet, #7c3aed);
      }
    }
    .bg-quick-swatches {
      padding: 0 12px 12px;
    }
    .bg-quick-label {
      display: block;
      font-size: 0.72rem;
      color: var(--px-ink-soft, #334155);
      margin: 8px 0 6px;
      opacity: 0.7;
    }
    .bg-swatch-row {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 4px;
    }
    .bg-swatch {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 6px;
      border: 1px solid rgba(15, 23, 42, 0.08);
      cursor: pointer;
      padding: 0;
      transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
    }
    .bg-swatch:hover {
      transform: scale(1.1);
      border-color: var(--px-violet, #7c3aed);
    }
    .bg-swatch.active {
      border: 2px solid var(--px-violet, #7c3aed);
      box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
    }
    .bg-hint {
      padding: 0 12px 12px;
      font-size: 0.72rem;
      color: var(--px-ink-soft, #334155);
      opacity: 0.6;
      margin: 0;
    }
    .bg-opacity-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
    }
    .bg-opacity-label {
      font-size: 0.72rem;
      color: var(--px-ink-soft, #334155);
      flex-shrink: 0;
      min-width: 78px;
    }
    .bg-opacity-row .flex-slider {
      flex: 1;
    }
    .bg-opacity-value {
      font-size: 0.72rem;
      color: var(--px-ink-soft, #334155);
      min-width: 38px;
      text-align: right;
    }
  `],
})
export class PropertyPanelComponent implements OnInit, OnDestroy {
  readonly canvasService = inject(CanvasService);

  /** PX-113 — quick palette shown in the empty-state Background panel. */
  readonly bgQuickSwatches = [
    '#ffffff', '#f8fafc', '#fef3c7', '#fee2e2', '#fce7f3',
    '#dbeafe', '#dcfce7', '#1e293b', '#0f172a', '#7c3aed',
  ];

  /** PX-113 — set the canvas background color from a quick-swatch click. */
  setBackgroundColor(color: string): void {
    this.canvasService.setBackgroundMode('custom', color);
  }

  /** PX-114 — fire commitChange after a frame slider is released so undo/redo
   *  captures a single state per gesture instead of one per slider tick. */
  commitFrameSlider(): void {
    const obj = this.canvasService.getCanvas()?.getActiveObject();
    if (obj) this.canvasService.commitChange(obj);
  }

  /** PX-115 — drive the canvas-background opacity slider in the empty state. */
  setBackgroundOpacity(alpha: number): void {
    this.canvasService.setBackgroundOpacity(alpha);
  }

  readonly props = signal<ObjectProps | null>(null);
  private readonly _isText = signal(false);
  private readonly _isRect = signal(false);
  private readonly _isLocked = signal(false);

  /** PX-094: photo-frame state mirror for the pan/zoom controls. */
  readonly isPhotoFrame = signal<boolean>(false);
  /** True for an empty placeholder frame (no photo loaded yet) — drives the
   *  "Add photo" vs "Replace photo" button label in PX-105. */
  readonly isEmptyPhotoFrame = signal<boolean>(false);
  readonly frameFitMode = signal<'cover' | 'contain' | 'fill'>('cover');
  readonly framePanX = signal<number>(0);
  readonly framePanY = signal<number>(0);
  readonly frameZoom = signal<number>(1);
  /** PX-103: current shape of the active photo-frame (for the shape selector). */
  readonly frameShape = signal<'rect' | 'rounded' | 'circle' | 'hexagon' | 'star' | 'heart'>('rect');
  /** PX-096: photo's rotation inside the slot (in degrees). */
  readonly framePhotoAngle = signal<number>(0);
  /** PX-103: shape options bound to the selector buttons. */
  readonly frameShapeOptions = [
    { id: 'rect' as const, label: 'Rectangle', icon: 'crop_landscape' },
    { id: 'rounded' as const, label: 'Rounded', icon: 'crop_5_4' },
    { id: 'circle' as const, label: 'Circle', icon: 'circle' },
    { id: 'hexagon' as const, label: 'Hexagon', icon: 'hexagon' },
    { id: 'star' as const, label: 'Star', icon: 'star' },
    { id: 'heart' as const, label: 'Heart', icon: 'favorite' },
  ];

  /** PX-108 / PX-109: which aspect-ratio chip is "active" — purely a UI hint. */
  readonly frameAspect = signal<
    'free' | 'original' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16'
  >('free');
  /** PX-108: aspect-ratio chips. `ratio` is width / height; `original` and
   *  `free` are sentinel values resolved at click time. */
  readonly frameAspectOptions = [
    { id: 'free' as const, label: 'Freeform', ratio: null },
    { id: 'original' as const, label: 'Original', ratio: 'photo' as const },
    { id: '1:1' as const, label: '1:1', ratio: 1 },
    { id: '4:3' as const, label: '4:3', ratio: 4 / 3 },
    { id: '16:9' as const, label: '16:9', ratio: 16 / 9 },
    { id: '3:4' as const, label: '3:4', ratio: 3 / 4 },
    { id: '9:16' as const, label: '9:16', ratio: 9 / 16 },
  ];

  readonly shadowBlur = signal(0);
  readonly shadowOffsetX = signal(5);
  readonly shadowOffsetY = signal(5);
  readonly shadowColor = signal('#000000');
  readonly cornerRadius = signal(0);
  readonly textStrokeColor = signal('#000000');
  readonly textStrokeWidth = signal(0);
  readonly textCurve = signal(0);
  readonly objectAnimation = signal<AnimationType>('none');
  readonly animationDuration = signal(600);
  readonly animationDelay = signal(0);
  readonly animationPresets = ANIMATION_PRESETS;

  private readonly animationService = inject(AnimationService);
  private readonly a11yService = inject(AccessibilityService);
  readonly contrastResult = signal<ContrastResult | null>(null);
  readonly blendMode = signal('source-over');

  readonly blendModes = [
    { value: 'source-over', label: 'Normal' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'screen', label: 'Screen' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'darken', label: 'Darken' },
    { value: 'lighten', label: 'Lighten' },
    { value: 'color-dodge', label: 'Color Dodge' },
    { value: 'color-burn', label: 'Color Burn' },
    { value: 'hard-light', label: 'Hard Light' },
    { value: 'soft-light', label: 'Soft Light' },
    { value: 'difference', label: 'Difference' },
    { value: 'exclusion', label: 'Exclusion' },
  ];

  readonly fontSearchText = signal('');
  readonly activeFontCategory = signal<string>('all');

  readonly fontCategories = [
    { value: 'all', label: 'All' },
    { value: 'sans-serif', label: 'Sans' },
    { value: 'serif', label: 'Serif' },
    { value: 'display', label: 'Display' },
    { value: 'handwriting', label: 'Script' },
    { value: 'monospace', label: 'Mono' },
  ];

  readonly filteredFonts = computed(() => {
    const search = this.fontSearchText().toLowerCase();
    const cat = this.activeFontCategory();

    let fonts: string[];
    if (cat === 'all') {
      fonts = [...SYSTEM_FONTS, ...GOOGLE_FONTS.map(f => f.family)];
    } else {
      fonts = [
        ...SYSTEM_FONTS.filter(() => cat === 'sans-serif'),
        ...GOOGLE_FONTS.filter(f => f.category === cat).map(f => f.family),
      ];
    }

    if (search) {
      fonts = fonts.filter(f => f.toLowerCase().includes(search));
    }
    return fonts;
  });

  readonly shadowPresets = [
    { name: 'None', blur: 0, offsetX: 0, offsetY: 0, color: '#000000', css: 'none' },
    { name: 'Soft', blur: 15, offsetX: 0, offsetY: 4, color: 'rgba(0,0,0,0.2)', css: '0 4px 15px rgba(0,0,0,0.2)' },
    { name: 'Medium', blur: 10, offsetX: 3, offsetY: 6, color: 'rgba(0,0,0,0.35)', css: '3px 6px 10px rgba(0,0,0,0.35)' },
    { name: 'Hard', blur: 2, offsetX: 4, offsetY: 4, color: 'rgba(0,0,0,0.6)', css: '4px 4px 2px rgba(0,0,0,0.6)' },
    { name: 'Glow', blur: 20, offsetX: 0, offsetY: 0, color: 'rgba(124,58,237,0.5)', css: '0 0 20px rgba(124,58,237,0.5)' },
    { name: 'Drop', blur: 8, offsetX: 6, offsetY: 8, color: 'rgba(0,0,0,0.4)', css: '6px 8px 8px rgba(0,0,0,0.4)' },
  ];

  private readonly fontService = inject(FontService);

  readonly fonts = this.fontService.getAllFontFamilies();

  private canvasListeners: (() => void)[] = [];

  ngOnInit(): void {
    this.attachWhenReady();
  }

  private attachWhenReady(attempts = 0): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      if (attempts > 50) return;
      setTimeout(() => this.attachWhenReady(attempts + 1), 100);
      return;
    }

    const onSelect = () => this.readProps();
    const onModified = () => this.readProps();
    const onDeselect = () => {
      this.props.set(null);
      this._isText.set(false);
    };

    canvas.on('selection:created', onSelect);
    canvas.on('selection:updated', onSelect);
    canvas.on('selection:cleared', onDeselect);
    canvas.on('object:modified', onModified);
    canvas.on('object:scaling', onModified);
    canvas.on('object:moving', onModified);
    canvas.on('object:rotating', onModified);

    this.canvasListeners = [
      () => canvas.off('selection:created', onSelect),
      () => canvas.off('selection:updated', onSelect),
      () => canvas.off('selection:cleared', onDeselect),
      () => canvas.off('object:modified', onModified),
      () => canvas.off('object:scaling', onModified),
      () => canvas.off('object:moving', onModified),
      () => canvas.off('object:rotating', onModified),
    ];

    // Handle existing selection
    onSelect();
  }

  ngOnDestroy(): void {
    this.canvasListeners.forEach(unsub => unsub());
  }

  isTextObject(): boolean {
    return this._isText();
  }

  setFontCategory(cat: string): void {
    this.activeFontCategory.set(cat);
  }

  onFontSearchChange(text: string): void {
    this.fontSearchText.set(text);
  }

  onFontSelected(font: string): void {
    this.fontSearchText.set(font);
    this.updateProp('fontFamily', font);
  }

  updateProp(key: string, value: any): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    // Load Google Font if needed
    if (key === 'fontFamily') {
      this.fontService.loadFont(value).then(() => {
        obj.set(key as keyof fabric.FabricObject, value);
        this.canvasService.commitChange(obj);
        this.readProps();
      });
      return;
    }

    obj.set(key as keyof fabric.FabricObject, value);
    this.canvasService.commitChange(obj);
    this.readProps();
  }

  updateScaledWidth(newWidth: number): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !newWidth) return;

    const currentWidth = (obj.width ?? 1) * (obj.scaleX ?? 1);
    const scale = newWidth / (obj.width ?? 1);
    obj.set('scaleX', scale);
    this.canvasService.commitChange(obj);
    this.readProps();
  }

  updateScaledHeight(newHeight: number): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !newHeight) return;

    const scale = newHeight / (obj.height ?? 1);
    obj.set('scaleY', scale);
    this.canvasService.commitChange(obj);
    this.readProps();
  }

  toggleFontWeight(): void {
    const current = this.props()?.fontWeight;
    this.updateProp('fontWeight', current === 'bold' ? 'normal' : 'bold');
  }

  toggleFontStyle(): void {
    const current = this.props()?.fontStyle;
    this.updateProp('fontStyle', current === 'italic' ? 'normal' : 'italic');
  }

  toggleUnderline(): void {
    this.updateProp('underline', !this.props()?.underline);
  }

  toggleLinethrough(): void {
    this.updateProp('linethrough', !this.props()?.linethrough);
  }

  toggleUppercase(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.IText)) return;

    const currentText = obj.text ?? '';
    const isUpper = currentText === currentText.toUpperCase();
    obj.set('text', isUpper ? currentText.toLowerCase() : currentText.toUpperCase());
    this.canvasService.commitChange(obj);
    this.readProps();
  }

  bringForward(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    canvas!.bringObjectForward(obj);
    this.canvasService.commitChange(obj);
  }

  sendBackward(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    canvas!.sendObjectBackwards(obj);
    this.canvasService.commitChange(obj);
  }

  groupSelected(): void {
    this.canvasService.groupSelected();
  }

  ungroupSelected(): void {
    this.canvasService.ungroupSelected();
  }

  rotateCW(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.rotate((obj.angle ?? 0) + 90);
    obj.setCoords();
    this.canvasService.commitChange(obj);
    this.readProps();
  }

  rotateCCW(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.rotate((obj.angle ?? 0) - 90);
    obj.setCoords();
    this.canvasService.commitChange(obj);
    this.readProps();
  }

  flipH(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.set('flipX', !obj.flipX);
    this.canvasService.commitChange(obj);
  }

  flipV(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.set('flipY', !obj.flipY);
    this.canvasService.commitChange(obj);
  }

  isLocked(): boolean {
    return this._isLocked();
  }

  toggleLock(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    const locked = !(obj as any)._locked;
    (obj as any)._locked = locked;
    this._isLocked.set(locked);

    obj.set({
      selectable: true,
      evented: true,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockSkewingX: locked,
      lockSkewingY: locked,
      hasControls: !locked,
      hoverCursor: locked ? 'not-allowed' : 'move',
    });

    this.canvasService.commitChange(obj);
  }

  isRectObject(): boolean {
    return this._isRect();
  }

  applyShadowPreset(preset: typeof this.shadowPresets[0]): void {
    if (preset.name === 'None') {
      this.removeShadow();
      return;
    }
    this.shadowBlur.set(preset.blur);
    this.shadowOffsetX.set(preset.offsetX);
    this.shadowOffsetY.set(preset.offsetY);
    this.shadowColor.set(preset.color);

    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    obj.shadow = new fabric.Shadow({
      color: preset.color,
      blur: preset.blur,
      offsetX: preset.offsetX,
      offsetY: preset.offsetY,
    });
    this.canvasService.commitChange(obj);
  }

  updateShadow(prop: string, value: any): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    if (prop === 'blur') this.shadowBlur.set(value);
    if (prop === 'offsetX') this.shadowOffsetX.set(value);
    if (prop === 'offsetY') this.shadowOffsetY.set(value);
    if (prop === 'color') this.shadowColor.set(value);

    obj.shadow = new fabric.Shadow({
      color: this.shadowColor(),
      blur: this.shadowBlur(),
      offsetX: this.shadowOffsetX(),
      offsetY: this.shadowOffsetY(),
    });
    this.canvasService.commitChange(obj);
  }

  removeShadow(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    obj.shadow = null;
    this.shadowBlur.set(0);
    this.shadowOffsetX.set(5);
    this.shadowOffsetY.set(5);
    this.shadowColor.set('#000000');
    this.canvasService.commitChange(obj);
  }

  setObjectAnimation(type: AnimationType): void {
    this.objectAnimation.set(type);
    this.persistAnimation();
  }

  setAnimationDuration(d: number): void {
    this.animationDuration.set(d);
    this.persistAnimation();
  }

  setAnimationDelay(d: number): void {
    this.animationDelay.set(d);
    this.persistAnimation();
  }

  private persistAnimation(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    this.animationService.setAnimation(obj, {
      type: this.objectAnimation(),
      duration: this.animationDuration(),
      delay: this.animationDelay(),
    });
  }

  async previewAnimation(): Promise<void> {
    await this.animationService.playAll();
  }

  setBlendMode(mode: string): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    this.blendMode.set(mode);
    (obj as any).globalCompositeOperation = mode;
    this.canvasService.commitChange(obj);
  }

  applyCurveToText(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.IText || obj instanceof fabric.FabricText)) return;

    const t = obj as fabric.IText;
    const text = t.text ?? '';
    if (!text) return;

    const curve = this.textCurve(); // -100 to 100
    const fontSize = t.fontSize ?? 48;
    const fontFamily = t.fontFamily ?? 'Arial';
    const fill = (typeof t.fill === 'string' ? t.fill : '#000000') ?? '#000000';
    const fontWeight = t.fontWeight ?? 'normal';
    const fontStyle = t.fontStyle ?? 'normal';

    // Estimate text width
    const charWidth = fontSize * 0.6;
    const textWidth = text.length * charWidth;

    // Build arc path
    // curve direction: positive = curve up (concave), negative = curve down (convex)
    const radius = Math.max(80, 300 - Math.abs(curve) * 2);
    const pathWidth = textWidth + fontSize * 2;
    const svgHeight = radius + fontSize + 20;

    let pathD: string;
    if (curve > 0) {
      pathD = `M 0,${svgHeight - 10} A ${radius},${radius} 0 0,1 ${pathWidth},${svgHeight - 10}`;
    } else if (curve < 0) {
      pathD = `M 0,20 A ${radius},${radius} 0 0,0 ${pathWidth},20`;
    } else {
      return;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pathWidth} ${svgHeight}" width="${pathWidth}" height="${svgHeight}">
      <defs>
        <path id="curvePath" d="${pathD}" fill="none" />
      </defs>
      <text font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${fill}">
        <textPath href="#curvePath" startOffset="50%" text-anchor="middle">${this.escapeXml(text)}</textPath>
      </text>
    </svg>`;

    // Preserve position
    const left = t.left ?? 0;
    const top = t.top ?? 0;

    canvas!.remove(obj);
    this.canvasService.addSvg(svg).then(() => {
      const newObj = canvas!.getObjects().slice(-1)[0];
      if (newObj) {
        newObj.set({ left, top, originX: 'center', originY: 'center' });
        canvas!.setActiveObject(newObj);
        this.canvasService.commitChange(obj);
      }
    });
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  updateTextStroke(prop: string, value: any): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.IText || obj instanceof fabric.FabricText)) return;

    if (prop === 'color') {
      this.textStrokeColor.set(value);
      obj.set('stroke', value);
      if (this.textStrokeWidth() === 0) {
        this.textStrokeWidth.set(1);
        obj.set('strokeWidth', 1);
      }
    } else if (prop === 'width') {
      this.textStrokeWidth.set(value);
      obj.set('strokeWidth', value);
    }

    this.canvasService.commitChange(obj);
  }

  removeTextStroke(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    obj.set({ stroke: '', strokeWidth: 0 });
    this.textStrokeColor.set('#000000');
    this.textStrokeWidth.set(0);
    this.canvasService.commitChange(obj);
  }

  updateCornerRadius(value: number): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.Rect)) return;

    this.cornerRadius.set(value);
    obj.set({ rx: value, ry: value });
    this.canvasService.commitChange(obj);
  }

  private readProps(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) {
      this.props.set(null);
      this._isText.set(false);
      return;
    }

    const isText = obj instanceof fabric.IText || obj instanceof fabric.FabricText;
    this._isText.set(isText);
    this._isRect.set(obj instanceof fabric.Rect);
    this._isLocked.set(!!(obj as any)._locked);

    // Read shadow
    if (obj.shadow && obj.shadow instanceof fabric.Shadow) {
      this.shadowBlur.set(obj.shadow.blur ?? 0);
      this.shadowOffsetX.set(obj.shadow.offsetX ?? 5);
      this.shadowOffsetY.set(obj.shadow.offsetY ?? 5);
      this.shadowColor.set(obj.shadow.color ?? '#000000');
    }

    // Read corner radius
    if (obj instanceof fabric.Rect) {
      this.cornerRadius.set(obj.rx ?? 0);
    }

    // Read blend mode
    this.blendMode.set((obj as any).globalCompositeOperation ?? 'source-over');

    // Read animation
    const anim = this.animationService.getAnimation(obj);
    this.objectAnimation.set(anim?.type ?? 'none');
    this.animationDuration.set(anim?.duration ?? 600);
    this.animationDelay.set(anim?.delay ?? 0);

    // Read text stroke + contrast
    if (isText) {
      this.textStrokeColor.set(typeof obj.stroke === 'string' && obj.stroke ? obj.stroke : '#000000');
      this.textStrokeWidth.set(obj.strokeWidth ?? 0);

      // Contrast against background
      if (typeof obj.fill === 'string' && obj.fill) {
        const bg = this.a11yService.getEffectiveBackground(obj);
        this.contrastResult.set(this.a11yService.contrastRatio(obj.fill, bg));
      } else {
        this.contrastResult.set(null);
      }
    } else {
      this.contrastResult.set(null);
    }

    const p: ObjectProps = {
      left: Math.round(obj.left ?? 0),
      top: Math.round(obj.top ?? 0),
      width: Math.round((obj.width ?? 0) * (obj.scaleX ?? 1)),
      height: Math.round((obj.height ?? 0) * (obj.scaleY ?? 1)),
      angle: Math.round(obj.angle ?? 0),
      opacity: obj.opacity ?? 1,
      fill: (typeof obj.fill === 'string' ? obj.fill : '#000000'),
      stroke: (typeof obj.stroke === 'string' ? obj.stroke : ''),
      strokeWidth: obj.strokeWidth ?? 0,
    };

    if (isText) {
      const textObj = obj as fabric.IText;
      p.fontSize = textObj.fontSize ?? 48;
      p.fontFamily = textObj.fontFamily ?? 'Roboto';
      this.fontSearchText.set(p.fontFamily);
      p.fontWeight = (textObj.fontWeight ?? 'normal') as string;
      p.fontStyle = (textObj.fontStyle ?? 'normal') as string;
      p.textAlign = textObj.textAlign ?? 'left';
      p.text = textObj.text ?? '';
      p.underline = textObj.underline ?? false;
      p.linethrough = textObj.linethrough ?? false;
      p.charSpacing = textObj.charSpacing ?? 0;
      p.lineHeight = textObj.lineHeight ?? 1.16;
    }

    // PX-094 — sync photo-frame pan/zoom signals with the active object.
    const customType = (obj as any).customType;
    this.isPhotoFrame.set(customType === 'photo-frame');
    // PX-105: filled frames are FabricImage; empty placeholders are Group.
    this.isEmptyPhotoFrame.set(customType === 'photo-frame' && obj instanceof fabric.Group);
    if (customType === 'photo-frame') {
      this.frameFitMode.set((obj as any).fitMode ?? 'cover');
      this.framePanX.set((obj as any).framePanX ?? 0);
      this.framePanY.set((obj as any).framePanY ?? 0);
      this.frameZoom.set((obj as any).frameZoom ?? 1);
      this.frameShape.set((obj as any).frameShape ?? 'rect');
      this.framePhotoAngle.set((obj as any).photoAngle ?? 0);
      // PX-108: aspect chip is a transient UI hint, not a persisted prop.
      // Reset on selection change so it doesn't carry between frames.
      this.frameAspect.set('free');
    }

    this.props.set(p);
  }

  /**
   * Apply a single-axis change from the photo-frame pan/zoom sliders
   * (PX-094). Pulls the other two axes from the local signals so all
   * three stay in lock-step with the canvas.
   *
   * @param axis - Which slider fired the change.
   * @param value - New slider value.
   */
  setFrameView(axis: 'panX' | 'panY' | 'zoom', value: number): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || (obj as any).customType !== 'photo-frame') return;

    if (axis === 'panX') this.framePanX.set(value);
    if (axis === 'panY') this.framePanY.set(value);
    if (axis === 'zoom') this.frameZoom.set(value);

    this.canvasService.setFrameView(
      obj,
      this.framePanX(),
      this.framePanY(),
      this.frameZoom(),
    );
  }

  /**
   * Reset photo-frame pan/zoom to the centered cover-mode default.
   */
  resetFrameView(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || (obj as any).customType !== 'photo-frame') return;
    this.framePanX.set(0);
    this.framePanY.set(0);
    this.frameZoom.set(1);
    this.canvasService.setFrameView(obj, 0, 0, 1);
  }

  /**
   * Apply an aspect-ratio chip to the active photo-frame (PX-108).
   *
   * @param id - One of the chip ids from `frameAspectOptions`.
   *
   * @remarks
   * `'free'` is a no-op on the canvas — it only updates the chip
   * highlight so the user can "release" the constraint visually.
   * Numeric ratios call `CanvasService.setFrameAspectRatio`, which
   * resizes the slot keeping the geometric center fixed and refits
   * the photo to the new bounds.
   */
  setFrameAspect(
    id: 'free' | 'original' | '1:1' | '4:3' | '16:9' | '3:4' | '9:16',
  ): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || (obj as any).customType !== 'photo-frame') return;
    this.frameAspect.set(id);
    if (id === 'free') return;

    // PX-109: 'original' resolves to the photo's natural aspect.
    // Only valid for filled FabricImage frames.
    let ratio: number | null = null;
    if (id === 'original') {
      if (!(obj instanceof fabric.FabricImage)) return;
      const el = (obj as any).getElement?.() as HTMLImageElement | undefined;
      const iw = el?.naturalWidth || el?.width || 0;
      const ih = el?.naturalHeight || el?.height || 0;
      if (!iw || !ih) return;
      ratio = iw / ih;
    } else {
      const opt = this.frameAspectOptions.find(o => o.id === id);
      if (!opt || typeof opt.ratio !== 'number') return;
      ratio = opt.ratio;
    }
    if (ratio == null) return;

    this.canvasService.setFrameAspectRatio(obj, ratio);
    // Empty placeholders rebuild as a new Group — re-sync local frame
    // state from the new active object so other controls stay correct.
    const newActive = canvas?.getActiveObject();
    if (newActive) {
      this.frameShape.set((newActive as any).frameShape ?? this.frameShape());
    }
  }

  /**
   * "Smart Crop" — one-click auto-fit + saliency-biased pan (PX-109 / PX-123).
   *
   * @remarks
   * Two-step:
   *
   * 1. Resize the slot to match the photo's natural aspect ratio in cover
   *    mode (PX-109 behavior — no over-scan crop, no letterboxing).
   * 2. Sample a 64×64 grayscale grid from the photo, compute a Sobel-like
   *    edge-magnitude map, and pick the weighted center-of-mass of
   *    high-magnitude pixels as the "interesting" region. Convert that
   *    centroid to normalized `[-1, 1]` pan offsets and apply via
   *    {@link CanvasService.setFrameView}. The crop window is biased
   *    toward whatever's structurally busy in the photo — typically the
   *    subject (faces have edges around eyes/mouth; text has dense edges;
   *    background sky is smooth).
   *
   * No external ML deps. The trade-off vs. proper face-detection: misses
   * "interesting" regions that are smooth (low contrast portraits, soft
   * focus). Catches: anything with structural detail. For the median
   * photo a designer drops into a frame, the saliency centroid is a
   * meaningful improvement over the "always center" baseline.
   */
  smartCrop(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || (obj as any).customType !== 'photo-frame') return;
    if (!(obj instanceof fabric.FabricImage)) return;

    const el = (obj as any).getElement?.() as HTMLImageElement | undefined;
    const iw = el?.naturalWidth || el?.width || 0;
    const ih = el?.naturalHeight || el?.height || 0;
    if (!iw || !ih) return;

    this.canvasService.setFrameFit(obj, 'cover');
    this.frameFitMode.set('cover');
    this.canvasService.setFrameAspectRatio(obj, iw / ih);

    // PX-123 — try to bias the pan toward the saliency centroid.
    let panX = 0;
    let panY = 0;
    try {
      const centroid = this.computeSaliencyCentroid(el!, iw, ih);
      if (centroid) {
        // centroid.x / .y are in [0, 1]; convert to [-1, 1] pan space
        // (where 0 = centered, ±1 = full edge).
        panX = (centroid.x - 0.5) * 2;
        panY = (centroid.y - 0.5) * 2;
        // Soften the pull so the crop centers ~70% toward the salient
        // region rather than slamming the edge.
        panX = Math.max(-1, Math.min(1, panX * 0.7));
        panY = Math.max(-1, Math.min(1, panY * 0.7));
      }
    } catch {
      /* fall through with pan=0,0 — Smart Crop still does the aspect-fit */
    }

    this.canvasService.setFrameView(obj, panX, panY, 1);
    this.framePanX.set(panX);
    this.framePanY.set(panY);
    this.frameZoom.set(1);
    this.frameAspect.set('original');
  }

  /**
   * Edge-density saliency centroid in normalized [0,1] image coords (PX-123).
   *
   * Algorithm:
   *  - Downsample the photo to GRID×GRID grayscale via a hidden canvas.
   *  - Compute |∂I/∂x| + |∂I/∂y| (cheap Sobel) per cell.
   *  - Take a weighted center of mass of cells whose magnitude is in the
   *    top quartile.
   *
   * Returns null if the image is too low-detail to produce a meaningful
   * centroid (or if the canvas read fails for any reason — e.g. tainted
   * canvas due to crossOrigin mismatch).
   */
  private computeSaliencyCentroid(
    el: HTMLImageElement,
    iw: number,
    ih: number,
  ): { x: number; y: number } | null {
    const GRID = 64;
    const tmp = document.createElement('canvas');
    tmp.width = GRID;
    tmp.height = GRID;
    const ctx = tmp.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(el, 0, 0, GRID, GRID);

    let pixels: Uint8ClampedArray;
    try {
      pixels = ctx.getImageData(0, 0, GRID, GRID).data;
    } catch {
      // CORS-tainted canvas — read blocked. Bail.
      return null;
    }

    // Convert to grayscale luminance in a flat GRID*GRID Float32 buffer.
    const lum = new Float32Array(GRID * GRID);
    for (let i = 0; i < GRID * GRID; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Edge magnitude: |I[x+1,y] - I[x-1,y]| + |I[x,y+1] - I[x,y-1]|.
    // 1-pixel border has zero magnitude — fine for a rough centroid.
    const mag = new Float32Array(GRID * GRID);
    let maxMag = 0;
    for (let y = 1; y < GRID - 1; y++) {
      for (let x = 1; x < GRID - 1; x++) {
        const i = y * GRID + x;
        const dx = Math.abs(lum[i + 1] - lum[i - 1]);
        const dy = Math.abs(lum[i + GRID] - lum[i - GRID]);
        mag[i] = dx + dy;
        if (mag[i] > maxMag) maxMag = mag[i];
      }
    }
    if (maxMag <= 1) return null; // image is essentially flat; no signal.

    // Top-quartile threshold so we don't get pulled by noise floors.
    const threshold = maxMag * 0.5;
    let sumW = 0;
    let sumX = 0;
    let sumY = 0;
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const i = y * GRID + x;
        if (mag[i] >= threshold) {
          const w = mag[i];
          sumW += w;
          sumX += w * x;
          sumY += w * y;
        }
      }
    }
    if (sumW <= 0) return null;

    return {
      x: sumX / sumW / (GRID - 1),
      y: sumY / sumW / (GRID - 1),
    };
  }

  /**
   * Change the active photo-frame's clip shape (PX-103).
   *
   * @param shape - The new shape variant.
   */
  setFrameShape(
    shape: 'rect' | 'rounded' | 'circle' | 'hexagon' | 'star' | 'heart',
  ): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || (obj as any).customType !== 'photo-frame') return;
    this.canvasService.setFrameShape(obj, shape);
    // Empty placeholders rebuild as a NEW Group, so the active object
    // reference may have changed — re-read from canvas.
    const newActive = canvas?.getActiveObject();
    if (newActive && (newActive as any).customType === 'photo-frame') {
      this.frameShape.set((newActive as any).frameShape ?? shape);
    } else {
      this.frameShape.set(shape);
    }
  }

  /**
   * Rotate the photo inside the active frame independent of the slot
   * (PX-096).
   *
   * @param angle - Photo rotation in degrees, clamped to [-180, 180]
   *   client-side.
   */
  setFramePhotoAngle(angle: number): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || (obj as any).customType !== 'photo-frame') return;
    const clamped = Math.max(-180, Math.min(180, Number(angle) || 0));
    this.framePhotoAngle.set(clamped);
    this.canvasService.setFramePhotoAngle(obj, clamped);
  }

  /**
   * Trigger a global custom event so the editor host can open its
   * hidden frame-image file input for the active photo-frame (PX-098).
   *
   * @remarks
   * The event-driven path keeps the property-panel decoupled from the
   * editor's `<input #frameImageInput>` element. The editor listens
   * once on the document; the active object is whatever is currently
   * selected so no payload is needed.
   */
  onReplacePhotoClick(): void {
    document.dispatchEvent(new CustomEvent('pf:request-frame-replace'));
  }
}
