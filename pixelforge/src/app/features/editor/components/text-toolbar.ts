import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { ColorPickerComponent } from '../../../shared/components/color-picker.component';
import { CanvasService } from '../../../core/services/canvas.service';
import { FontService } from '../../../core/services/font.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { BrandKitService } from '../../../core/services/brand-kit.service';
import { MagicWriteService, TRANSFORMATIONS, Transformation } from '../../../core/services/magic-write.service';
import { AnimationService, ANIMATION_PRESETS, AnimationType } from '../../../core/services/animation.service';
import { ApiService } from '../../../core/services/api.service';
import * as fabric from 'fabric';

type SelectionType = 'none' | 'text' | 'image' | 'shape' | 'group' | 'multiple';

@Component({
  selector: 'app-text-toolbar',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatButtonToggleModule,
    MatMenuModule,
    MatSliderModule,
    ColorPickerComponent,
  ],
  template: `
    @if (selectionType() !== 'none') {
      <div
        class="ctx-toolbar"
        [class.dragging]="isDragging()"
        [style.top.px]="toolbarTop()"
        [style.left.px]="toolbarLeft()"
      >
        <!-- Drag handle: lets the user move the toolbar out of the way -->
        <span
          class="tb-drag-handle"
          matTooltip="Drag to move toolbar"
          (mousedown)="onDragHandleDown($event)"
        >
          <mat-icon>drag_indicator</mat-icon>
        </span>

        <!-- TEXT CONTROLS -->
        @if (selectionType() === 'text') {
          <mat-form-field appearance="outline" class="font-select">
            <mat-select [ngModel]="fontFamily()" (ngModelChange)="setFont($event)" panelClass="font-dropdown">
              @for (font of fonts; track font) {
                <mat-option [value]="font" [style.fontFamily]="font">{{ font }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <span class="tb-sep"></span>

          <button mat-icon-button class="size-btn" (click)="decreaseFontSize()" matTooltip="Decrease size">
            <mat-icon>remove</mat-icon>
          </button>
          <input type="number" class="size-input" [ngModel]="fontSize()" (ngModelChange)="setFontSize($event)" min="1" max="800" />
          <button mat-icon-button class="size-btn" (click)="increaseFontSize()" matTooltip="Increase size">
            <mat-icon>add</mat-icon>
          </button>

          <span class="tb-sep"></span>

          <app-color-picker
            [value]="textColor()"
            (valueChange)="setColor($event)"
            label=""
          />
          <span class="tb-label">Text</span>

          <span class="tb-sep"></span>

          <button mat-icon-button [class.active]="isBold()" (click)="toggleBold()" matTooltip="Bold">
            <mat-icon>format_bold</mat-icon>
          </button>
          <button mat-icon-button [class.active]="isItalic()" (click)="toggleItalic()" matTooltip="Italic">
            <mat-icon>format_italic</mat-icon>
          </button>
          <button mat-icon-button [class.active]="isUnderline()" (click)="toggleUnderline()" matTooltip="Underline">
            <mat-icon>format_underlined</mat-icon>
          </button>
          <button mat-icon-button [class.active]="isStrikethrough()" (click)="toggleStrikethrough()" matTooltip="Strikethrough">
            <mat-icon>strikethrough_s</mat-icon>
          </button>

          <span class="tb-sep"></span>

          <button mat-icon-button (click)="cycleAlign()" [matTooltip]="'Align: ' + textAlign()">
            <mat-icon>{{ alignIcon() }}</mat-icon>
          </button>
          <button mat-icon-button [class.active]="isUppercase()" (click)="toggleUppercase()" matTooltip="Uppercase">
            <mat-icon>text_fields</mat-icon>
          </button>

          <span class="tb-sep"></span>

          <button mat-icon-button [matMenuTriggerFor]="spacingMenu" matTooltip="Letter Spacing">
            <mat-icon>space_bar</mat-icon>
          </button>
          <mat-menu #spacingMenu="matMenu" class="slider-menu">
            <div class="menu-slider" (click)="$event.stopPropagation()">
              <label>Letter Spacing</label>
              <mat-slider min="0" max="1000" step="10">
                <input matSliderThumb [ngModel]="charSpacing()" (ngModelChange)="setCharSpacing($event)" />
              </mat-slider>
              <span class="menu-val">{{ charSpacing() }}</span>
            </div>
            <div class="menu-slider" (click)="$event.stopPropagation()">
              <label>Line Height</label>
              <mat-slider min="0.5" max="3" step="0.1">
                <input matSliderThumb [ngModel]="lineHeight()" (ngModelChange)="setLineHeight($event)" />
              </mat-slider>
              <span class="menu-val">{{ lineHeight().toFixed(1) }}</span>
            </div>
          </mat-menu>

          <button mat-icon-button [matMenuTriggerFor]="curveMenu" matTooltip="Curve Text">
            <mat-icon>text_rotation_angledown</mat-icon>
          </button>
          <mat-menu #curveMenu="matMenu" class="slider-menu">
            <div class="menu-slider" (click)="$event.stopPropagation()">
              <label>Curve Amount</label>
              <mat-slider min="-100" max="100" step="5">
                <input matSliderThumb [ngModel]="curveAmount()" (ngModelChange)="curveAmount.set($event)" />
              </mat-slider>
              <span class="menu-val">{{ curveAmount() }}</span>
            </div>
            <button mat-menu-item (click)="applyCurve()" [disabled]="curveAmount() === 0">
              <mat-icon>check</mat-icon> Apply Curve
            </button>
          </mat-menu>

          <button mat-icon-button [matMenuTriggerFor]="magicMenu" matTooltip="Magic Write — transform text">
            <mat-icon>auto_fix_high</mat-icon>
          </button>
          <mat-menu #magicMenu="matMenu">
            <div class="magic-header" (click)="$event.stopPropagation()">
              <mat-icon>auto_awesome</mat-icon>
              <span>Transform Text</span>
            </div>
            @for (t of transformations; track t.type) {
              <button mat-menu-item (click)="applyMagicTransform(t.type)">
                <mat-icon>{{ t.icon }}</mat-icon>
                {{ t.label }}
              </button>
            }
          </mat-menu>
        }

        <!-- IMAGE CONTROLS -->
        @if (selectionType() === 'image') {
          <button mat-stroked-button class="tb-btn" (click)="triggerReplace()">
            <mat-icon>swap_horiz</mat-icon> Replace
          </button>
          <input type="file" #replaceInput accept="image/*" hidden (change)="onReplaceFile($event)" />

          <span class="tb-sep"></span>

          @if (canvasService.isCropping()) {
            <button mat-flat-button class="tb-btn primary" (click)="canvasService.applyCrop()">
              <mat-icon>check</mat-icon> Apply Crop
            </button>
            <button mat-stroked-button class="tb-btn" (click)="canvasService.cancelCrop()">
              Cancel
            </button>
          } @else {
            <button mat-stroked-button class="tb-btn" (click)="canvasService.startCrop()">
              <mat-icon>crop</mat-icon> Crop
            </button>
          }

          <span class="tb-sep"></span>

          <button mat-icon-button [matMenuTriggerFor]="filtersMenu" matTooltip="Quick Filters">
            <mat-icon>auto_fix_high</mat-icon>
          </button>
          <mat-menu #filtersMenu="matMenu">
            @for (preset of filterPresets; track preset.name) {
              <button mat-menu-item (click)="applyFilterPreset(preset)">{{ preset.name }}</button>
            }
          </mat-menu>

          <button mat-icon-button (click)="flipH()" matTooltip="Flip Horizontal">
            <mat-icon>flip</mat-icon>
          </button>
          <button mat-icon-button (click)="flipV()" matTooltip="Flip Vertical">
            <mat-icon style="transform: rotate(90deg)">flip</mat-icon>
          </button>

          @if (isPhotoFrame()) {
            <span class="tb-sep"></span>
            <span class="tb-label">Fit</span>
            <mat-button-toggle-group
              class="tb-fit-toggle"
              [value]="frameFit()"
              (change)="onFrameFitChange($event.value)"
              data-testid="frame-fit"
            >
              <mat-button-toggle value="cover" matTooltip="Fill the frame, crop overflow">
                <mat-icon>fit_screen</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="contain" matTooltip="Show whole photo, may letterbox">
                <mat-icon>aspect_ratio</mat-icon>
              </mat-button-toggle>
              <mat-button-toggle value="fill" matTooltip="Stretch to fill (may distort)">
                <mat-icon>crop_free</mat-icon>
              </mat-button-toggle>
            </mat-button-toggle-group>

            <!-- PX-122 — modal-mode Crop button. Enters cropMode and the
                 right property panel switches to a focused Crop UI with
                 chips + sliders + Smart Crop + Apply/Cancel. -->
            <span class="tb-sep"></span>
            <button
              mat-flat-button
              class="tb-btn primary"
              data-testid="frame-crop-mode"
              (click)="onEnterCropMode()"
            >
              <mat-icon>crop</mat-icon> Crop
            </button>
          }
        }

        <!-- SHAPE CONTROLS -->
        @if (selectionType() === 'shape') {
          <app-color-picker
            [value]="fillColor()"
            (valueChange)="setFill($event)"
            label="Fill"
          />

          <span class="tb-sep"></span>

          <app-color-picker
            [value]="strokeColor()"
            (valueChange)="setStroke($event)"
            label="Stroke"
          />

          <button mat-icon-button [matMenuTriggerFor]="strokeMenu" matTooltip="Stroke Width">
            <mat-icon>line_weight</mat-icon>
          </button>
          <mat-menu #strokeMenu="matMenu" class="slider-menu">
            <div class="menu-slider" (click)="$event.stopPropagation()">
              <label>Stroke Width</label>
              <mat-slider min="0" max="40" step="1">
                <input matSliderThumb [ngModel]="strokeWidth()" (ngModelChange)="setStrokeWidth($event)" />
              </mat-slider>
              <span class="menu-val">{{ strokeWidth() }}</span>
            </div>
          </mat-menu>
        }

        <!-- COMMON CONTROLS (always shown for any selection) -->
        <span class="tb-sep"></span>

        <!-- Effects dropdown (Canva-style) -->
        <button mat-button class="grp-btn" [matMenuTriggerFor]="effectsMenu">
          <mat-icon>auto_fix_high</mat-icon> Effects
        </button>
        <mat-menu #effectsMenu="matMenu" class="grp-menu">
          <div class="grp-section-title" (click)="$event.stopPropagation()">Shadow</div>
          <div class="menu-slider" (click)="$event.stopPropagation()">
            <label>Blur</label>
            <mat-slider min="0" max="50" step="1">
              <input matSliderThumb [ngModel]="effectShadow()" (ngModelChange)="setEffectShadow($event)" />
            </mat-slider>
            <span class="menu-val">{{ effectShadow() }}</span>
          </div>
          <button mat-menu-item (click)="clearEffects()">
            <mat-icon>block</mat-icon> No effects
          </button>
        </mat-menu>

        <!-- Animate dropdown -->
        <button mat-button class="grp-btn" [matMenuTriggerFor]="animateMenu">
          <mat-icon>animation</mat-icon> Animate
        </button>
        <mat-menu #animateMenu="matMenu" class="grp-menu">
          <div class="grp-section-title" (click)="$event.stopPropagation()">Enter animation</div>
          @for (preset of animationPresets; track preset.type) {
            <button mat-menu-item (click)="setAnimationType(preset.type)"
              [class.grp-active]="currentAnimation() === preset.type">
              <mat-icon>{{ preset.icon }}</mat-icon>
              {{ preset.label }}
            </button>
          }
        </mat-menu>

        <!-- Position dropdown -->
        <button mat-button class="grp-btn" [matMenuTriggerFor]="positionMenu">
          <mat-icon>open_with</mat-icon> Position
        </button>
        <mat-menu #positionMenu="matMenu" class="grp-menu">
          <div class="grp-section-title" (click)="$event.stopPropagation()">Layers</div>
          <button mat-menu-item (click)="bringForward()">
            <mat-icon>flip_to_front</mat-icon> Bring forward
          </button>
          <button mat-menu-item (click)="sendBackward()">
            <mat-icon>flip_to_back</mat-icon> Send backward
          </button>
          <mat-divider />
          <div class="grp-section-title" (click)="$event.stopPropagation()">Opacity</div>
          <div class="menu-slider" (click)="$event.stopPropagation()">
            <label>Opacity</label>
            <mat-slider min="0" max="1" step="0.01">
              <input matSliderThumb [ngModel]="opacity()" (ngModelChange)="setOpacity($event)" />
            </mat-slider>
            <span class="menu-val">{{ (opacity() * 100).toFixed(0) }}%</span>
          </div>
        </mat-menu>

        <span class="tb-sep"></span>

        <!-- PX-104: align/group/lock absorbed from the old quick-action-bar
             so the user only ever sees ONE floating toolbar per selection. -->
        <button mat-icon-button [matMenuTriggerFor]="alignMenu" matTooltip="Align to page">
          <mat-icon>format_align_center</mat-icon>
        </button>
        <mat-menu #alignMenu="matMenu">
          <button mat-menu-item (click)="alignTo('left')"><mat-icon>align_horizontal_left</mat-icon>Left</button>
          <button mat-menu-item (click)="alignTo('center-h')"><mat-icon>align_horizontal_center</mat-icon>Center horizontally</button>
          <button mat-menu-item (click)="alignTo('right')"><mat-icon>align_horizontal_right</mat-icon>Right</button>
          <button mat-menu-item (click)="alignTo('top')"><mat-icon>align_vertical_top</mat-icon>Top</button>
          <button mat-menu-item (click)="alignTo('center-v')"><mat-icon>align_vertical_center</mat-icon>Center vertically</button>
          <button mat-menu-item (click)="alignTo('bottom')"><mat-icon>align_vertical_bottom</mat-icon>Bottom</button>
        </mat-menu>

        @if (isMultiSelection()) {
          <button mat-icon-button matTooltip="Group (Ctrl+G)" (click)="groupSelection()">
            <mat-icon>group_work</mat-icon>
          </button>
        } @else if (isGroup()) {
          <button mat-icon-button matTooltip="Ungroup (Ctrl+Shift+G)" (click)="ungroupSelection()">
            <mat-icon>workspaces</mat-icon>
          </button>
        }

        <button
          mat-icon-button
          [matTooltip]="isLocked() ? 'Unlock' : 'Lock (Alt+Shift+L)'"
          (click)="toggleLock()"
        >
          <mat-icon>{{ isLocked() ? 'lock' : 'lock_open' }}</mat-icon>
        </button>

        <button mat-icon-button (click)="duplicate()" matTooltip="Duplicate (Ctrl+D)">
          <mat-icon>content_copy</mat-icon>
        </button>

        <button mat-icon-button class="tb-delete" (click)="deleteSelected()" matTooltip="Delete">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    }
  `,
  styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 50;
    }

    .ctx-toolbar {
      position: fixed;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 6px 10px;
      background: var(--px-surface, #ffffff);
      border: 1px solid var(--px-line, #e2e8f0);
      border-radius: 10px;
      height: 48px;
      max-width: 92vw;
      overflow-x: auto;
      flex-shrink: 0;
      box-shadow: 0 12px 32px -10px rgba(15, 23, 42, 0.22),
        0 0 0 1px rgba(15, 23, 42, 0.04);
      pointer-events: auto;
      transform: translateX(-50%);
      transition: top 0.1s ease-out, left 0.1s ease-out;
      color: var(--px-ink, #0f172a);
    }

    /* Disable smooth transition while user is actively dragging */
    .ctx-toolbar.dragging {
      transition: none;
      cursor: grabbing;
      user-select: none;
    }

    .tb-drag-handle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 32px;
      margin-right: 4px;
      color: #71717a;
      cursor: grab;
      border-radius: 4px;
      flex-shrink: 0;

      &:hover {
        color: #a1a1aa;
        background: var(--px-line, #e2e8f0);
      }

      &:active {
        cursor: grabbing;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .font-select {
      width: 160px;

      ::ng-deep {
        .mat-mdc-form-field-infix {
          padding-top: 6px !important;
          padding-bottom: 6px !important;
          min-height: 32px !important;
        }
        .mat-mdc-text-field-wrapper {
          padding: 0 8px !important;
        }
        .mat-mdc-form-field-subscript-wrapper { display: none; }
        .mdc-notched-outline__leading,
        .mdc-notched-outline__trailing,
        .mdc-notched-outline__notch {
          border-color: #3f3f46 !important;
        }
      }
    }

    .tb-sep {
      width: 1px;
      height: 24px;
      background: var(--px-line, #e2e8f0);
      margin: 0 4px;
      flex-shrink: 0;
    }

    .tb-label {
      font-size: 0.72rem;
      opacity: 0.5;
      margin-right: 4px;
    }

    .tb-btn {
      font-size: 0.82rem;
      height: 34px;
      padding: 0 12px;
      flex-shrink: 0;

      mat-icon { margin-right: 4px; font-size: 18px; height: 18px; width: 18px; }

      &.primary {
        background: var(--mat-sys-primary) !important;
        color: var(--mat-sys-on-primary) !important;
      }
    }

    .size-input {
      width: 48px;
      text-align: center;
      background: var(--px-line, #e2e8f0);
      border: 1px solid #3f3f46;
      border-radius: 6px;
      color: #fafafa;
      font-size: 0.85rem;
      padding: 4px;
      outline: none;
      font-variant-numeric: tabular-nums;
      -moz-appearance: textfield;

      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
      }

      &:focus { border-color: var(--mat-sys-primary); }
    }

    .size-btn { transform: scale(0.85); }

    .color-wrapper {
      padding: 4px !important;
    }

    .color-swatch {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 2px solid #3f3f46;

      &.outline {
        background: transparent !important;
        border-width: 3px;
      }
    }

    button.active {
      background: var(--mat-sys-primary-container) !important;
      color: var(--mat-sys-on-primary-container) !important;
    }

    .grp-btn {
      font-size: 0.82rem !important;
      padding: 0 10px !important;
      min-width: auto !important;

      mat-icon {
        font-size: 16px !important;
        height: 16px !important;
        width: 16px !important;
        margin-right: 4px !important;
      }
    }

    ::ng-deep .grp-menu .mat-mdc-menu-content {
      min-width: 240px;
    }

    ::ng-deep .grp-section-title {
      padding: 8px 16px 4px;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.55;
    }

    ::ng-deep .grp-active {
      background: var(--mat-sys-primary-container) !important;
      color: var(--mat-sys-on-primary-container) !important;
    }

    .tb-delete {
      color: #ef4444;

      &:hover {
        background: rgba(239, 68, 68, 0.15) !important;
      }
    }

    ::ng-deep .magic-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px 8px;
      font-weight: 600;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      margin-bottom: 4px;

      mat-icon {
        color: var(--mat-sys-primary);
      }
    }

    ::ng-deep .slider-menu {
      .mat-mdc-menu-content {
        padding: 12px !important;
      }
    }

    ::ng-deep .menu-slider {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      min-width: 240px;

      label {
        font-size: 0.78rem;
        min-width: 80px;
        opacity: 0.7;
      }

      mat-slider {
        flex: 1;
      }

      .menu-val {
        font-size: 0.78rem;
        min-width: 40px;
        text-align: right;
        opacity: 0.6;
        font-variant-numeric: tabular-nums;
      }
    }
  `],
})
export class TextToolbarComponent implements OnInit, OnDestroy {
  readonly canvasService = inject(CanvasService);
  private readonly fontService = inject(FontService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly brandKit = inject(BrandKitService);
  private readonly magicWrite = inject(MagicWriteService);
  private readonly animationService = inject(AnimationService);
  private readonly apiService = inject(ApiService);
  readonly transformations = TRANSFORMATIONS;
  readonly animationPresets = ANIMATION_PRESETS;

  // Effects
  readonly effectShadow = signal(0);

  // Animate
  readonly currentAnimation = signal<AnimationType>('none');

  setEffectShadow(blur: number): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    this.effectShadow.set(blur);
    if (blur > 0) {
      obj.shadow = new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur, offsetX: 0, offsetY: 4 });
    } else {
      obj.shadow = null;
    }
    this.canvasService.commitChange(obj);
  }

  clearEffects(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.shadow = null;
    obj.set({ stroke: '', strokeWidth: 0 });
    this.effectShadow.set(0);
    this.canvasService.commitChange(obj);
  }

  setAnimationType(type: AnimationType): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    this.animationService.setAnimation(obj, { type, duration: 600, delay: 0 });
    this.currentAnimation.set(type);
    if (type !== 'none') {
      this.animationService.playAll();
    }
  }

  @ViewChild('replaceInput') replaceInputRef!: ElementRef<HTMLInputElement>;

  // Selection state
  readonly selectionType = signal<SelectionType>('none');

  /**
   * `true` when the active object is a photo-frame (PX-090/091) — drives
   * the fit-mode toggle in the IMAGE branch.
   */
  readonly isPhotoFrame = signal<boolean>(false);

  /** Current fit mode of the active photo-frame (`'cover'` default). */
  readonly frameFit = signal<'cover' | 'contain' | 'fill'>('cover');

  // Floating toolbar position (viewport pixels)
  readonly toolbarTop = signal(0);
  readonly toolbarLeft = signal(0);

  // Manual drag state: offsets applied on top of the auto-positioned values so
  // the toolbar stays glued to the selection but in the user's chosen offset.
  readonly isDragging = signal(false);
  private userOffsetX = 0;
  private userOffsetY = 0;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartOffsetX = 0;
  private dragStartOffsetY = 0;
  private dragMoveListener: ((e: MouseEvent) => void) | null = null;
  private dragUpListener: ((e: MouseEvent) => void) | null = null;

  // Text state
  readonly fontFamily = signal('Roboto');
  readonly fontSize = signal(48);
  readonly textColor = signal('#000000');
  readonly isBold = signal(false);
  readonly isItalic = signal(false);
  readonly isUnderline = signal(false);
  readonly isStrikethrough = signal(false);
  readonly textAlign = signal('left');
  readonly isUppercase = signal(false);
  readonly charSpacing = signal(0);
  readonly lineHeight = signal(1.16);
  readonly curveAmount = signal(0);

  // Shape state
  readonly fillColor = signal('#4285f4');
  readonly strokeColor = signal('#000000');
  readonly strokeWidth = signal(0);

  // Common state
  readonly opacity = signal(1);

  // PX-104 — absorbed from the old quick-action-bar
  readonly isMultiSelection = signal(false);
  readonly isGroup = signal(false);
  readonly isLocked = signal(false);

  readonly fonts = this.fontService.getAllFontFamilies();
  readonly alignIcon = signal('format_align_left');

  readonly filterPresets = [
    { name: 'Original', reset: true },
    { name: 'Vivid', brightness: 10, contrast: 20, saturation: 40 },
    { name: 'Warm', brightness: 5, contrast: 10, saturation: 20, sepia: true },
    { name: 'B&W', contrast: 20, grayscale: true },
    { name: 'Soft', brightness: 10, contrast: -10, blur: 1 },
    { name: 'Dramatic', brightness: -10, contrast: 40 },
  ];

  private listeners: (() => void)[] = [];

  ngOnInit(): void {
    this.attachWhenReady();
  }

  /**
   * Canvas is created in the parent editor's ngAfterViewInit, which fires
   * AFTER child components' ngOnInit. So we poll briefly until the canvas
   * exists, then attach selection listeners.
   */
  private attachWhenReady(attempts = 0): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) {
      if (attempts > 50) return; // give up after ~5s
      setTimeout(() => this.attachWhenReady(attempts + 1), 100);
      return;
    }

    const readState = () => {
      this.updateSelectionState();
      this.repositionToolbar();
    };
    const onNewSelection = () => {
      // Reset manual drag offset when the user picks a different object so the
      // toolbar returns to its default auto-position above the new selection.
      this.resetDragOffset();
      readState();
    };
    const reposOnly = () => this.repositionToolbar();

    canvas.on('selection:created', onNewSelection);
    canvas.on('selection:updated', onNewSelection);
    canvas.on('selection:cleared', () => {
      this.resetDragOffset();
      this.selectionType.set('none');
      this.isPhotoFrame.set(false);
    });
    canvas.on('text:changed', readState);
    canvas.on('object:modified', readState);
    // Keep toolbar glued to the object as it moves/resizes
    canvas.on('object:moving', reposOnly);
    canvas.on('object:scaling', reposOnly);
    canvas.on('object:rotating', reposOnly);
    // Follow zoom/pan
    canvas.on('after:render', reposOnly);

    // PX-097: belt-and-suspenders — after every mouse:up, re-sync the
    // toolbar's visibility against the canvas's actual active object.
    // Some fabric paths (programmatic discardActiveObject, file-picker
    // round-trips, popover overlays from the color picker) can leave
    // selection:cleared unfired but no active object present — this
    // catches those cases so the toolbar always hides when nothing is
    // really selected.
    const syncOnUp = () => {
      if (!canvas.getActiveObject()) {
        this.selectionType.set('none');
        this.isPhotoFrame.set(false);
      }
    };
    canvas.on('mouse:up', syncOnUp);

    this.listeners = [
      () => canvas.off('selection:created', onNewSelection),
      () => canvas.off('selection:updated', onNewSelection),
      () => canvas.off('selection:cleared'),
      () => canvas.off('text:changed', readState),
      () => canvas.off('object:modified', readState),
      () => canvas.off('object:moving', reposOnly),
      () => canvas.off('object:scaling', reposOnly),
      () => canvas.off('object:rotating', reposOnly),
      () => canvas.off('after:render', reposOnly),
      () => canvas.off('mouse:up', syncOnUp),
    ];

    // Run once in case something is already selected (e.g. after project load)
    readState();
  }

  ngOnDestroy(): void {
    this.listeners.forEach(fn => fn());
  }

  /**
   * Position the floating toolbar above the selected object's bounding rect,
   * clamped to the viewport. Falls back to below the object if no room above.
   */
  private repositionToolbar(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;

    const upperEl = canvas.upperCanvasEl as HTMLCanvasElement | undefined;
    if (!upperEl) return;

    // Bounding rect in canvas coordinates (already accounts for zoom/pan because
    // getBoundingRect() respects the viewport transform)
    const b = obj.getBoundingRect();
    const canvasRect = upperEl.getBoundingClientRect();

    // Convert to screen coordinates
    const screenLeft = canvasRect.left + b.left;
    const screenTop = canvasRect.top + b.top;
    const screenBottom = screenTop + b.height;
    const screenCenterX = screenLeft + b.width / 2;

    const toolbarHeight = 56;
    const gap = 16;

    let top: number;
    if (screenTop - toolbarHeight - gap > 8) {
      // room above — place there
      top = screenTop - toolbarHeight - gap;
    } else {
      // otherwise below
      top = screenBottom + gap;
    }

    // Clamp horizontally within viewport
    const vw = window.innerWidth;
    const halfToolbar = Math.min(400, vw / 2 - 16);
    let left = screenCenterX;
    if (left - halfToolbar < 8) left = halfToolbar + 8;
    if (left + halfToolbar > vw - 8) left = vw - halfToolbar - 8;

    this.toolbarTop.set(top + this.userOffsetY);
    this.toolbarLeft.set(left + this.userOffsetX);
  }

  /** Start dragging the toolbar from its grip handle. */
  onDragHandleDown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDragging.set(true);
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartOffsetX = this.userOffsetX;
    this.dragStartOffsetY = this.userOffsetY;

    this.dragMoveListener = (e: MouseEvent) => {
      this.userOffsetX = this.dragStartOffsetX + (e.clientX - this.dragStartX);
      this.userOffsetY = this.dragStartOffsetY + (e.clientY - this.dragStartY);
      this.repositionToolbar();
    };
    this.dragUpListener = () => {
      this.isDragging.set(false);
      if (this.dragMoveListener) window.removeEventListener('mousemove', this.dragMoveListener);
      if (this.dragUpListener) window.removeEventListener('mouseup', this.dragUpListener);
      this.dragMoveListener = null;
      this.dragUpListener = null;
    };

    window.addEventListener('mousemove', this.dragMoveListener);
    window.addEventListener('mouseup', this.dragUpListener);
  }

  /** Reset any user drag offset (called when selection changes). */
  private resetDragOffset(): void {
    this.userOffsetX = 0;
    this.userOffsetY = 0;
  }

  private updateSelectionState(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();

    // PX-091: track photo-frame state alongside the selection type.
    const customType = (obj as any)?.customType;
    this.isPhotoFrame.set(customType === 'photo-frame');
    if (customType === 'photo-frame' && (obj as any).fitMode) {
      this.frameFit.set((obj as any).fitMode);
    }

    // PX-104 — drive the new align/group/lock affordances
    this.isMultiSelection.set(obj instanceof fabric.ActiveSelection);
    this.isGroup.set(obj instanceof fabric.Group && !(obj instanceof fabric.ActiveSelection));
    this.isLocked.set(!!(obj as any)?._locked);

    if (!obj) {
      this.selectionType.set('none');
      return;
    }

    if (obj instanceof fabric.ActiveSelection) {
      this.selectionType.set('multiple');
      this.readCommonProps(obj);
      return;
    }

    if (obj instanceof fabric.IText || obj instanceof fabric.FabricText) {
      this.selectionType.set('text');
      this.readTextProps(obj as fabric.IText);
      this.readCommonProps(obj);
      return;
    }

    if (obj instanceof fabric.FabricImage) {
      this.selectionType.set('image');
      this.readCommonProps(obj);
      return;
    }

    if (obj instanceof fabric.Group) {
      this.selectionType.set('group');
      this.readCommonProps(obj);
      return;
    }

    // Default to shape
    this.selectionType.set('shape');
    this.readShapeProps(obj);
    this.readCommonProps(obj);
  }

  // ========== TEXT METHODS ==========

  setFont(family: string): void {
    this.fontService.loadFont(family).then(() => {
      this.applyProp('fontFamily', family);
      this.fontFamily.set(family);
      this.brandKit.trackRecentFont(family);
    });
  }

  setFontSize(size: number): void {
    if (size < 1 || size > 800) return;
    this.applyProp('fontSize', size);
    this.fontSize.set(size);
  }

  increaseFontSize(): void {
    this.setFontSize(this.fontSize() + 2);
  }

  decreaseFontSize(): void {
    this.setFontSize(Math.max(1, this.fontSize() - 2));
  }

  setColor(color: string): void {
    this.applyProp('fill', color);
    this.textColor.set(color);
    this.brandKit.trackRecentColor(color);
  }

  toggleBold(): void {
    const val = this.isBold() ? 'normal' : 'bold';
    this.applyProp('fontWeight', val);
    this.isBold.set(val === 'bold');
  }

  toggleItalic(): void {
    const val = this.isItalic() ? 'normal' : 'italic';
    this.applyProp('fontStyle', val);
    this.isItalic.set(val === 'italic');
  }

  toggleUnderline(): void {
    const val = !this.isUnderline();
    this.applyProp('underline', val);
    this.isUnderline.set(val);
  }

  toggleStrikethrough(): void {
    const val = !this.isStrikethrough();
    this.applyProp('linethrough', val);
    this.isStrikethrough.set(val);
  }

  cycleAlign(): void {
    const aligns = ['left', 'center', 'right'];
    const current = aligns.indexOf(this.textAlign());
    const next = aligns[(current + 1) % aligns.length];
    this.applyProp('textAlign', next);
    this.textAlign.set(next);
    this.updateAlignIcon(next);
  }

  toggleUppercase(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject() as fabric.IText;
    if (!obj) return;

    const text = obj.text ?? '';
    const isUpper = text === text.toUpperCase();
    obj.set('text', isUpper ? text.toLowerCase() : text.toUpperCase());
    this.isUppercase.set(!isUpper);
    this.canvasService.commitChange(obj);
  }

  setCharSpacing(val: number): void {
    this.applyProp('charSpacing', val);
    this.charSpacing.set(val);
  }

  setLineHeight(val: number): void {
    this.applyProp('lineHeight', val);
    this.lineHeight.set(val);
  }

  applyMagicTransform(type: Transformation): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.IText || obj instanceof fabric.FabricText)) return;

    const t = obj as fabric.IText;
    const original = t.text ?? '';
    const transformed = this.magicWrite.transform(original, type);

    if (transformed && transformed !== original) {
      t.set('text', transformed);
      this.canvasService.commitChange(obj);
    }
  }

  applyCurve(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.IText || obj instanceof fabric.FabricText)) return;

    const t = obj as fabric.IText;
    const text = t.text ?? '';
    if (!text) return;

    const curve = this.curveAmount();
    if (curve === 0) return;

    const fontSize = t.fontSize ?? 48;
    const fontFamily = t.fontFamily ?? 'Arial';
    const fill = (typeof t.fill === 'string' ? t.fill : '#000000') ?? '#000000';
    const fontWeight = t.fontWeight ?? 'normal';
    const fontStyle = t.fontStyle ?? 'normal';

    const charWidth = fontSize * 0.6;
    const textWidth = text.length * charWidth;
    const radius = Math.max(80, 300 - Math.abs(curve) * 2);
    const pathWidth = textWidth + fontSize * 2;
    const svgHeight = radius + fontSize + 20;

    let pathD: string;
    if (curve > 0) {
      pathD = `M 0,${svgHeight - 10} A ${radius},${radius} 0 0,1 ${pathWidth},${svgHeight - 10}`;
    } else {
      pathD = `M 0,20 A ${radius},${radius} 0 0,0 ${pathWidth},20`;
    }

    const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pathWidth} ${svgHeight}" width="${pathWidth}" height="${svgHeight}">
      <defs><path id="curvePath" d="${pathD}" fill="none" /></defs>
      <text font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${fill}">
        <textPath href="#curvePath" startOffset="50%" text-anchor="middle">${escapeXml(text)}</textPath>
      </text>
    </svg>`;

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

  // ========== IMAGE METHODS ==========

  triggerReplace(): void {
    this.replaceInputRef?.nativeElement?.click();
  }

  onReplaceFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return;

    // PX-112 — upload first, then load via URL so canvas_json stays small.
    this.apiService.uploadAsset(file).subscribe({
      next: asset => {
        const url = this.apiService.getAssetUrl(asset.id);
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        imgEl.onload = () => {
          const oldProps = {
            left: obj.left, top: obj.top,
            angle: obj.angle, opacity: obj.opacity,
            flipX: obj.flipX, flipY: obj.flipY,
            originX: obj.originX, originY: obj.originY,
            filters: obj.filters,
          };

          const newImg = new fabric.FabricImage(imgEl);
          const oldWidth = (obj.width ?? 1) * (obj.scaleX ?? 1);
          const oldHeight = (obj.height ?? 1) * (obj.scaleY ?? 1);
          const newScaleX = oldWidth / (newImg.width ?? 1);
          const newScaleY = oldHeight / (newImg.height ?? 1);

          newImg.set({ ...oldProps, scaleX: newScaleX, scaleY: newScaleY } as any);
          (newImg as any).layerId = (obj as any).layerId;

          canvas!.remove(obj);
          canvas!.add(newImg);
          canvas!.setActiveObject(newImg);
          this.canvasService.commitChange(obj);
        };
        imgEl.src = url;
      },
      error: () => {/* surface a snackbar via host snackBar — but text-toolbar does not own one */},
    });
  }

  applyFilterPreset(preset: any): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || !(obj instanceof fabric.FabricImage)) return;

    const filters: any[] = [];
    if (preset.reset) {
      obj.filters = [];
    } else {
      if (preset.brightness) filters.push(new fabric.filters.Brightness({ brightness: preset.brightness / 100 }));
      if (preset.contrast) filters.push(new fabric.filters.Contrast({ contrast: preset.contrast / 100 }));
      if (preset.saturation) filters.push(new fabric.filters.Saturation({ saturation: preset.saturation / 100 }));
      if (preset.blur) filters.push(new fabric.filters.Blur({ blur: preset.blur / 100 }));
      if (preset.grayscale) filters.push(new fabric.filters.Grayscale());
      if (preset.sepia) filters.push(new fabric.filters.Sepia());
      obj.filters = filters;
    }
    obj.applyFilters();
    this.canvasService.commitChange(obj);
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

  /**
   * Switch the active photo-frame between cover / contain / fill (PX-091).
   *
   * @param mode - The new fit mode emitted by the toggle group.
   */
  onFrameFitChange(mode: 'cover' | 'contain' | 'fill'): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj || (obj as any).customType !== 'photo-frame') return;
    this.canvasService.setFrameFit(obj, mode);
    this.frameFit.set(mode);
    this.canvasService.commitChange(obj);
  }

  /** PX-122 — enter modal-mode crop on the active photo-frame. */
  onEnterCropMode(): void {
    this.canvasService.enterCropMode();
  }

  // ========== SHAPE METHODS ==========

  setFill(color: string): void {
    this.applyProp('fill', color);
    this.fillColor.set(color);
    this.brandKit.trackRecentColor(color);
  }

  setStroke(color: string): void {
    this.applyProp('stroke', color);
    this.strokeColor.set(color);
    if (this.strokeWidth() === 0) {
      this.applyProp('strokeWidth', 2);
      this.strokeWidth.set(2);
    }
    this.brandKit.trackRecentColor(color);
  }

  setStrokeWidth(width: number): void {
    this.applyProp('strokeWidth', width);
    this.strokeWidth.set(width);
  }

  // ========== COMMON METHODS ==========

  setOpacity(val: number): void {
    this.applyProp('opacity', val);
    this.opacity.set(val);
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

  duplicate(): void {
    this.clipboardService.duplicate();
  }

  deleteSelected(): void {
    this.canvasService.removeActiveObject();
  }

  // ========== PX-104: align / group / lock ==========

  alignTo(direction: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void {
    this.canvasService.alignObjects(direction);
  }

  groupSelection(): void {
    this.canvasService.groupSelected();
  }

  ungroupSelection(): void {
    this.canvasService.ungroupSelected();
  }

  toggleLock(): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    const locked = !(obj as any)._locked;
    (obj as any)._locked = locked;
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
      hasBorders: true,
      hoverCursor: locked ? 'not-allowed' : 'move',
    });
    this.isLocked.set(locked);
    canvas!.requestRenderAll();
    this.canvasService.commitChange(obj);
  }

  // ========== PRIVATE HELPERS ==========

  private applyProp(key: string, value: any): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.set(key as keyof fabric.FabricObject, value);
    this.canvasService.commitChange(obj);
  }

  private readTextProps(obj: fabric.IText): void {
    this.fontFamily.set(obj.fontFamily ?? 'Roboto');
    this.fontSize.set(obj.fontSize ?? 48);
    this.textColor.set(typeof obj.fill === 'string' ? obj.fill : '#000000');
    this.isBold.set(obj.fontWeight === 'bold');
    this.isItalic.set(obj.fontStyle === 'italic');
    this.isUnderline.set(obj.underline ?? false);
    this.isStrikethrough.set(obj.linethrough ?? false);
    this.textAlign.set(obj.textAlign ?? 'left');
    this.charSpacing.set(obj.charSpacing ?? 0);
    this.lineHeight.set(obj.lineHeight ?? 1.16);
    const text = obj.text ?? '';
    this.isUppercase.set(text === text.toUpperCase() && text.length > 0);
    this.updateAlignIcon(obj.textAlign ?? 'left');
  }

  private readShapeProps(obj: fabric.FabricObject): void {
    this.fillColor.set(typeof obj.fill === 'string' ? obj.fill : '#4285f4');
    this.strokeColor.set(typeof obj.stroke === 'string' ? obj.stroke : '#000000');
    this.strokeWidth.set(obj.strokeWidth ?? 0);
  }

  private readCommonProps(obj: fabric.FabricObject): void {
    this.opacity.set(obj.opacity ?? 1);
    const shadow = obj.shadow as fabric.Shadow | null;
    this.effectShadow.set(shadow && shadow.blur ? shadow.blur : 0);
    const anim = this.animationService.getAnimation(obj);
    this.currentAnimation.set(anim?.type ?? 'none');
  }

  private updateAlignIcon(align: string): void {
    switch (align) {
      case 'center': this.alignIcon.set('format_align_center'); break;
      case 'right': this.alignIcon.set('format_align_right'); break;
      default: this.alignIcon.set('format_align_left');
    }
  }
}
