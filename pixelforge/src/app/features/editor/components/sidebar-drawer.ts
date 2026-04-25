import { Component, inject, signal, computed, output, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { ShapeType } from '../../../core/services/canvas.service';
import { FRAME_PRESETS, FramePreset } from '../../../core/data/frame-presets';
import { TemplateService, LOGO_TEMPLATES, LogoTemplate } from '../../../core/services/template.service';
import { BRAND_PALETTES } from '../../../core/models/color-palettes';
import { CanvasService, BackgroundMode } from '../../../core/services/canvas.service';
import { BackgroundRemovalService } from '../../../core/services/background-removal.service';
import { ProjectService } from '../../../core/services/project.service';
import { STOCK_ICONS, ICON_CATEGORIES } from '../../../core/data/stock-icons';
import { AiBackgroundService } from '../../../core/services/ai-background.service';
import { BrandKitService, BrandLogo } from '../../../core/services/brand-kit.service';
import { FontService } from '../../../core/services/font.service';
import { DesignHelperService, ColorPalette, FontPairing } from '../../../core/services/design-helper.service';
import { StyleVariationsService, StylePreset, StyleVariant } from '../../../core/services/style-variations.service';
import { PluginRegistry, Plugin } from '../../../core/plugins/plugin-api';
import '../../../core/plugins/builtin-plugins';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

export type SidebarTab = 'templates' | 'elements' | 'text' | 'uploads' | 'background' | 'bgremove' | 'draw' | 'aiimage' | 'brand' | 'helper' | 'widgets' | null;

@Component({
  selector: 'app-sidebar-drawer',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatSliderModule,
    MatSelectModule,
  ],
  template: `
    <div class="sidebar-wrapper">
      <!-- Icon Rail -->
      <nav class="icon-rail">
        <button
          class="rail-btn"
          [class.active]="activeTab() === 'templates'"
          (click)="toggleTab('templates')"
          matTooltip="Templates" matTooltipPosition="right"
        >
          <mat-icon>auto_awesome</mat-icon>
          <span>Templates</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'elements'"
          (click)="toggleTab('elements')"
          matTooltip="Elements" matTooltipPosition="right"
        >
          <mat-icon>category</mat-icon>
          <span>Elements</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'text'"
          (click)="toggleTab('text')"
          matTooltip="Text" matTooltipPosition="right"
        >
          <mat-icon>title</mat-icon>
          <span>Text</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'uploads'"
          (click)="toggleTab('uploads')"
          matTooltip="Uploads" matTooltipPosition="right"
        >
          <mat-icon>cloud_upload</mat-icon>
          <span>Uploads</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'background'"
          (click)="toggleTab('background')"
          matTooltip="Background" matTooltipPosition="right"
        >
          <mat-icon>wallpaper</mat-icon>
          <span>Bg</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'brand'"
          (click)="toggleTab('brand')"
          matTooltip="Brand Kit" matTooltipPosition="right"
        >
          <mat-icon>palette</mat-icon>
          <span>Brand</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'helper'"
          (click)="toggleTab('helper')"
          matTooltip="Design Helper" matTooltipPosition="right"
        >
          <mat-icon>tips_and_updates</mat-icon>
          <span>Helper</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'widgets'"
          (click)="toggleTab('widgets')"
          matTooltip="Widgets" matTooltipPosition="right"
        >
          <mat-icon>widgets</mat-icon>
          <span>Widgets</span>
        </button>

        <button
          class="rail-btn"
          [class.active]="activeTab() === 'draw'"
          (click)="toggleTab('draw')"
          matTooltip="Draw" matTooltipPosition="right"
        >
          <mat-icon>brush</mat-icon>
          <span>Draw</span>
        </button>

        <div class="rail-divider"></div>

        <button
          class="rail-btn accent"
          [class.active]="activeTab() === 'aiimage'"
          (click)="toggleTab('aiimage')"
          matTooltip="AI Image" matTooltipPosition="right"
        >
          <mat-icon>auto_awesome</mat-icon>
          <span>AI Image</span>
        </button>

        <button
          class="rail-btn accent"
          [class.active]="activeTab() === 'bgremove'"
          (click)="toggleTab('bgremove')"
          matTooltip="Remove Background" matTooltipPosition="right"
        >
          <mat-icon>auto_fix_high</mat-icon>
          <span>BG Remove</span>
        </button>
      </nav>

      <!-- Drawer Panel -->
      @if (activeTab(); as tab) {
        <div class="drawer-panel" [@.disabled]="true">
          <div class="drawer-header">
            <h3>{{ drawerTitle() }}</h3>
            <button mat-icon-button (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="drawer-content">
            <!-- TEMPLATES TAB -->
            @if (tab === 'templates') {
              <div class="template-grid">
                @for (tpl of templates; track tpl.id) {
                  <div class="template-card" (click)="applyTemplate(tpl.id)">
                    <div class="tpl-icon">
                      <mat-icon>{{ tpl.icon }}</mat-icon>
                    </div>
                    <span class="tpl-name">{{ tpl.name }}</span>
                    <span class="tpl-desc">{{ tpl.description }}</span>
                  </div>
                }
              </div>
            }

            <!-- ELEMENTS TAB -->
            @if (tab === 'elements') {
              <div class="section-label">Basic Shapes</div>
              <div class="shape-grid">
                @for (shape of basicShapes; track shape.type) {
                  <button class="shape-btn" (click)="addShape.emit(shape.type)" [matTooltip]="shape.name">
                    <mat-icon>{{ shape.icon }}</mat-icon>
                    <span>{{ shape.name }}</span>
                  </button>
                }
              </div>

              <div class="section-label">Logo Shapes</div>
              <div class="shape-grid">
                @for (shape of logoShapes; track shape.type) {
                  <button class="shape-btn" (click)="addShape.emit(shape.type)" [matTooltip]="shape.name">
                    <mat-icon>{{ shape.icon }}</mat-icon>
                    <span>{{ shape.name }}</span>
                  </button>
                }
              </div>

              <div class="section-label">Lines</div>
              <div class="shape-grid">
                <button class="shape-btn" (click)="addShape.emit('line')" matTooltip="Line">
                  <mat-icon>horizontal_rule</mat-icon>
                  <span>Line</span>
                </button>
              </div>

              <!-- Photo frames / collage (PX-090) -->
              <div class="section-label">Photo frames</div>
              <p class="frames-hint">
                Drop a layout, then click any empty slot to add a photo.
              </p>
              <div class="frame-grid" data-testid="frame-presets">
                @for (preset of framePresets; track preset.id) {
                  <button
                    type="button"
                    class="frame-card"
                    [attr.data-preset-id]="preset.id"
                    [matTooltip]="preset.name"
                    (click)="addFrameLayout.emit(preset)"
                  >
                    <span class="frame-preview" aria-hidden="true">
                      @for (slot of preset.slots; track $index) {
                        <span
                          class="frame-slot"
                          [class]="'frame-slot--' + (slot.shape || 'rect')"
                          [style.left.%]="slot.x * 100"
                          [style.top.%]="slot.y * 100"
                          [style.width.%]="slot.w * 100"
                          [style.height.%]="slot.h * 100"
                          [style.transform]="'rotate(' + (slot.rotation || 0) + 'deg)'"
                        ></span>
                      }
                    </span>
                    <span class="frame-name">{{ preset.name }}</span>
                  </button>
                }
              </div>

              <!-- Stock Icons -->
              <div class="section-label">Icons</div>
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search icons</mat-label>
                <input matInput [ngModel]="iconSearch()" (ngModelChange)="iconSearch.set($event)" />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <div class="icon-categories">
                @for (cat of iconCategories; track cat.value) {
                  <button
                    class="icon-cat-chip"
                    [class.active]="iconCategory() === cat.value"
                    (click)="iconCategory.set(cat.value)"
                  >{{ cat.label }}</button>
                }
              </div>

              <div class="icon-grid">
                @for (icon of filteredStockIcons(); track icon.name) {
                  <button class="icon-btn" [matTooltip]="icon.name" (click)="addStockIconToCanvas(icon)" [innerHTML]="trustSvg(icon.svg)"></button>
                }
              </div>
              <div class="icon-count">{{ filteredStockIcons().length }} icon{{ filteredStockIcons().length !== 1 ? 's' : '' }}</div>

              <!-- QR Code Generator -->
              <div class="section-label">QR Code</div>
              <div class="qr-generator">
                <mat-form-field appearance="outline" class="qr-input">
                  <mat-label>URL or text</mat-label>
                  <input matInput [ngModel]="qrInput()" (ngModelChange)="qrInput.set($event)" placeholder="https://example.com" />
                </mat-form-field>
                <button mat-flat-button class="qr-generate-btn" (click)="generateQR()" [disabled]="!qrInput()">
                  <mat-icon>qr_code_2</mat-icon> Add QR Code
                </button>
              </div>

              <!-- Decorative Elements -->
              <div class="section-label">Decorative</div>
              <div class="icon-grid">
                @for (decor of decorativeElements; track decor.name) {
                  <button class="icon-btn decor" [matTooltip]="decor.name" (click)="addDecorToCanvas(decor)">
                    <svg viewBox="0 0 24 24" fill="currentColor" [innerHTML]="decor.path"></svg>
                  </button>
                }
              </div>
            }

            <!-- TEXT TAB -->
            @if (tab === 'text') {
              <div class="text-presets">
                <button class="text-preset heading" (click)="addHeading()">
                  <span class="preview">Add a heading</span>
                </button>
                <button class="text-preset subheading" (click)="addSubheading()">
                  <span class="preview">Add a subheading</span>
                </button>
                <button class="text-preset body-text" (click)="addBody()">
                  <span class="preview">Add body text</span>
                </button>
              </div>

              <mat-divider />

              <div class="section-label">Font Combinations</div>
              <div class="font-combos">
                @for (combo of fontCombos; track combo.name) {
                  <button class="font-combo-card" (click)="applyFontCombo(combo)">
                    <span class="combo-heading" [style.fontFamily]="combo.heading">{{ combo.heading }}</span>
                    <span class="combo-body" [style.fontFamily]="combo.body">{{ combo.body }}</span>
                  </button>
                }
              </div>
            }

            <!-- UPLOADS TAB -->
            @if (tab === 'uploads') {
              <button
                mat-flat-button
                class="upload-btn"
                (click)="triggerUpload()"
              >
                <mat-icon>cloud_upload</mat-icon>
                Upload an image
              </button>

              <input
                type="file"
                #uploadFileInput
                accept="image/*,.svg"
                multiple
                (change)="onUploadFiles($event)"
                style="display: none"
              />

              @if (uploadedImages().length > 0) {
                <div class="section-label">Your uploads</div>
                <div class="uploads-gallery">
                  @for (img of uploadedImages(); track img.id) {
                    <div class="upload-thumb" (click)="addUploadedToCanvas(img.dataUrl)">
                      <img [src]="img.dataUrl" [alt]="img.name" />
                      <button class="remove-upload" (click)="removeUpload($event, img.id)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              } @else {
                <div class="upload-hint">
                  <mat-icon>info</mat-icon>
                  <p>Upload images to your library. Click any image to add it to the canvas.</p>
                </div>
              }

              <mat-divider />

              <button
                mat-stroked-button
                class="upload-btn secondary"
                (click)="removeBg.emit()"
              >
                <mat-icon>auto_fix_high</mat-icon>
                Remove Background
              </button>
              <p class="bg-hint">Select an image on canvas first, then click to remove its background using AI.</p>
            }

            <!-- BACKGROUND TAB -->
            @if (tab === 'background') {
              <div class="section-label">Canvas Background</div>
              <mat-button-toggle-group
                class="bg-toggle"
                [ngModel]="canvasService.backgroundMode()"
                (ngModelChange)="onBgModeChange($event)"
              >
                <mat-button-toggle value="white">White</mat-button-toggle>
                <mat-button-toggle value="transparent">None</mat-button-toggle>
                <mat-button-toggle value="custom">Color</mat-button-toggle>
              </mat-button-toggle-group>

              @if (canvasService.backgroundMode() === 'custom') {
                <div class="custom-bg-color">
                  <input
                    type="color"
                    [ngModel]="canvasService.backgroundColor()"
                    (ngModelChange)="onCustomBgColor($event)"
                    class="color-picker-lg"
                  />
                </div>
              }

              <mat-divider />

              <div class="section-label">AI Background</div>
              <div class="ai-bg-section">
                <mat-form-field appearance="outline" class="ai-bg-input">
                  <mat-label>Describe a background</mat-label>
                  <input matInput [ngModel]="aiPrompt()" (ngModelChange)="aiPrompt.set($event)"
                    placeholder="ocean sunset, mesh gradient..." />
                </mat-form-field>
                <button mat-flat-button class="ai-bg-btn" (click)="generateAiBg()" [disabled]="!aiPrompt()">
                  <mat-icon>auto_awesome</mat-icon> Generate
                </button>
                <div class="ai-bg-suggestions">
                  @for (suggestion of aiSuggestions; track suggestion) {
                    <button class="suggestion-chip" (click)="useAiSuggestion(suggestion)">{{ suggestion }}</button>
                  }
                </div>
              </div>

              <mat-divider />

              <div class="section-label">Background Image</div>
              <div class="bg-image-row">
                <button mat-stroked-button (click)="triggerBgImageUpload()">
                  <mat-icon>image</mat-icon> Upload Image
                </button>
                <button mat-stroked-button (click)="removeBgImage()">
                  <mat-icon>clear</mat-icon> Remove
                </button>
              </div>
              <input type="file" #bgImageInput accept="image/*" (change)="onBgImageSelected($event)" style="display: none" />

              <mat-button-toggle-group class="bg-fit-toggle" [ngModel]="bgFit()" (ngModelChange)="setBgFit($event)">
                <mat-button-toggle value="cover">Cover</mat-button-toggle>
                <mat-button-toggle value="contain">Fit</mat-button-toggle>
                <mat-button-toggle value="tile">Tile</mat-button-toggle>
              </mat-button-toggle-group>

              <mat-divider />

              <div class="section-label">Background Colors</div>
              <div class="bg-color-grid">
                @for (color of bgColors; track color) {
                  <button
                    class="bg-color-swatch"
                    [style.background]="color"
                    (click)="onCustomBgColor(color)"
                  ></button>
                }
              </div>
            }

            <!-- DRAW TAB -->
            @if (tab === 'draw') {
              <div class="draw-panel">
                <button
                  mat-flat-button
                  class="draw-toggle-btn"
                  [class.active]="canvasService.isDrawing()"
                  (click)="canvasService.toggleDrawingMode()"
                >
                  <mat-icon>{{ canvasService.isDrawing() ? 'edit_off' : 'edit' }}</mat-icon>
                  {{ canvasService.isDrawing() ? 'Stop Drawing' : 'Start Drawing' }}
                </button>

                <div class="draw-settings">
                  <div class="section-label">Brush Color</div>
                  <div class="draw-color-row">
                    <input type="color" [ngModel]="canvasService.brushColor()" (ngModelChange)="canvasService.setBrushColor($event)" class="draw-color-input" />
                    @for (c of drawColors; track c) {
                      <button class="draw-swatch" [style.background]="c" (click)="canvasService.setBrushColor(c)"></button>
                    }
                  </div>

                  <div class="section-label">Brush Size</div>
                  <div class="draw-size-row">
                    <mat-slider min="1" max="50" step="1" class="draw-slider">
                      <input matSliderThumb [ngModel]="canvasService.brushSize()" (ngModelChange)="canvasService.setBrushSize($event)" />
                    </mat-slider>
                    <span class="draw-size-val">{{ canvasService.brushSize() }}px</span>
                  </div>

                  <div class="draw-preview">
                    <svg width="100%" height="40" viewBox="0 0 200 40">
                      <line x1="10" y1="20" x2="190" y2="20"
                        [attr.stroke]="canvasService.brushColor()"
                        [attr.stroke-width]="canvasService.brushSize()"
                        stroke-linecap="round" />
                    </svg>
                  </div>
                </div>

                <div class="draw-hint">
                  <mat-icon>info</mat-icon>
                  <span>Click and drag on the canvas to draw. Each stroke becomes an editable layer.</span>
                </div>
              </div>
            }

            <!-- WIDGETS TAB -->
            @if (tab === 'widgets') {
              <div class="widgets-panel">
                <p class="section-desc">Click a widget to add it to your canvas. Edit the values, then add another.</p>

                @for (plugin of allPlugins; track plugin.id) {
                  <div class="widget-card">
                    <div class="widget-header">
                      <mat-icon>{{ plugin.icon }}</mat-icon>
                      <div>
                        <strong>{{ plugin.name }}</strong>
                        <span>{{ plugin.description }}</span>
                      </div>
                    </div>

                    @if (plugin.configFields && expandedWidget() === plugin.id) {
                      <div class="widget-config">
                        @for (field of plugin.configFields; track field.key) {
                          <div class="config-row">
                            <label>{{ field.label }}</label>
                            @switch (field.type) {
                              @case ('color') {
                                <input type="color" [ngModel]="getWidgetConfig(plugin.id, field.key, field.default)"
                                  (ngModelChange)="setWidgetConfig(plugin.id, field.key, $event)" />
                              }
                              @case ('number') {
                                <input type="number" [ngModel]="getWidgetConfig(plugin.id, field.key, field.default)"
                                  (ngModelChange)="setWidgetConfig(plugin.id, field.key, $event)" />
                              }
                              @case ('select') {
                                <select [ngModel]="getWidgetConfig(plugin.id, field.key, field.default)"
                                  (ngModelChange)="setWidgetConfig(plugin.id, field.key, $event)">
                                  @for (opt of field.options; track opt.value) {
                                    <option [value]="opt.value">{{ opt.label }}</option>
                                  }
                                </select>
                              }
                              @default {
                                <input type="text" [ngModel]="getWidgetConfig(plugin.id, field.key, field.default)"
                                  (ngModelChange)="setWidgetConfig(plugin.id, field.key, $event)" />
                              }
                            }
                          </div>
                        }
                        <button mat-flat-button class="add-widget-btn" (click)="addWidget(plugin.id)">
                          <mat-icon>add</mat-icon> Add to Canvas
                        </button>
                      </div>
                    } @else {
                      <button mat-stroked-button class="config-toggle-btn" (click)="toggleWidget(plugin.id)">
                        <mat-icon>tune</mat-icon> Configure
                      </button>
                    }
                  </div>
                }
              </div>
            }

            <!-- DESIGN HELPER TAB -->
            @if (tab === 'helper') {
              <div class="helper-panel">
                <div class="helper-section">
                  <div class="section-label">Extract Colors from Image</div>
                  <button mat-stroked-button class="full-width" (click)="extractColors()" [disabled]="extracting()">
                    <mat-icon>colorize</mat-icon>
                    {{ extracting() ? 'Analyzing...' : 'Extract from selected image' }}
                  </button>

                  @if (extractedColors().length > 0) {
                    <div class="extracted-row">
                      @for (color of extractedColors(); track color; let i = $index) {
                        <button class="extracted-swatch" [style.background]="color"
                          (click)="generatePalettes(color)" [matTooltip]="color"></button>
                      }
                    </div>
                  }
                </div>

                <div class="helper-section">
                  <div class="section-label">Color Palette Generator</div>
                  <div class="palette-input-row">
                    <input type="color" [ngModel]="paletteBase()" (ngModelChange)="generatePalettes($event)" class="palette-color-input" />
                    <span class="palette-hint">Pick a base color to generate palettes</span>
                  </div>

                  @for (palette of generatedPalettes(); track palette.name) {
                    <div class="generated-palette">
                      <span class="palette-name">{{ palette.name }}</span>
                      <div class="palette-colors">
                        @for (c of palette.colors; track c) {
                          <button class="palette-swatch" [style.background]="c"
                            [matTooltip]="c" (click)="useColor(c)"></button>
                        }
                      </div>
                    </div>
                  }
                </div>

                <div class="helper-section">
                  <div class="section-label">Font Pairings</div>
                  @for (pair of fontPairings; track pair.name) {
                    <button class="font-pair-card" (click)="useFontPair(pair)">
                      <strong [style.fontFamily]="pair.heading">{{ pair.heading }}</strong>
                      <span [style.fontFamily]="pair.body">{{ pair.body }}</span>
                      <small>{{ pair.vibe }}</small>
                    </button>
                  }
                </div>

                <div class="helper-section">
                  <div class="section-label">Style Variations</div>
                  <p class="helper-hint">Apply a consistent style to your whole design</p>
                  <div class="style-variants-grid">
                    @for (style of styleVariants; track style.id) {
                      <button class="style-variant-card" (click)="applyStyleVariant(style)"
                        [style.background]="style.palette.bg">
                        <div class="style-swatches">
                          <span [style.background]="style.palette.primary"></span>
                          <span [style.background]="style.palette.secondary"></span>
                          <span [style.background]="style.palette.accent"></span>
                        </div>
                        <strong [style.fontFamily]="style.headingFont" [style.color]="style.palette.primary">{{ style.name }}</strong>
                        <small [style.color]="style.palette.text">{{ style.description }}</small>
                      </button>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- BRAND KIT TAB -->
            @if (tab === 'brand') {
              <div class="brand-kit-panel">
                <!-- Brand Colors -->
                <div class="section-label">Brand Colors</div>
                <div class="brand-colors-row">
                  @for (color of brandKit.brandColors(); track color) {
                    <div class="brand-color-item">
                      <button class="brand-color-swatch" [style.background]="color" (click)="useBrandColor(color)" [matTooltip]="color"></button>
                      <button class="remove-mini" (click)="brandKit.removeBrandColor(color)" matTooltip="Remove">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                  <button class="add-color-btn" (click)="brandColorInput.click()" matTooltip="Add brand color">
                    <mat-icon>add</mat-icon>
                  </button>
                  <input type="color" #brandColorInput hidden (change)="addBrandColor($any($event.target).value)" />
                </div>

                @if (brandKit.recentColors().length > 0) {
                  <div class="section-label">Recent Colors</div>
                  <div class="brand-colors-row">
                    @for (color of brandKit.recentColors(); track color) {
                      <button class="brand-color-swatch" [style.background]="color" (click)="useBrandColor(color)" [matTooltip]="color"></button>
                    }
                  </div>
                }

                <!-- Brand Fonts -->
                <div class="section-label">Brand Fonts</div>
                <div class="brand-fonts-list">
                  @for (font of brandKit.brandFonts(); track font) {
                    <div class="brand-font-item">
                      <span class="font-preview" [style.fontFamily]="font" (click)="useBrandFont(font)">{{ font }}</span>
                      <button class="remove-mini" (click)="brandKit.removeBrandFont(font)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  } @empty {
                    <span class="empty-hint">Save fonts you frequently use</span>
                  }
                  <mat-form-field appearance="outline" class="add-font-field">
                    <mat-label>Add font</mat-label>
                    <mat-select [ngModel]="''" (ngModelChange)="addBrandFontFromSelect($event)">
                      @for (font of allFonts; track font) {
                        <mat-option [value]="font" [style.fontFamily]="font">{{ font }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <button mat-stroked-button class="upload-font-btn" (click)="customFontInput.click()">
                    <mat-icon>upload_file</mat-icon> Upload Custom Font
                  </button>
                  <input type="file" #customFontInput hidden accept=".ttf,.otf,.woff,.woff2"
                    (change)="uploadCustomFont($event)" />

                  @if (fontSvc.customFonts().length > 0) {
                    <div class="section-label" style="margin-top:12px">Uploaded Fonts</div>
                    @for (font of fontSvc.customFonts(); track font.family) {
                      <div class="brand-font-item">
                        <span class="font-preview" [style.fontFamily]="font.family" (click)="useBrandFont(font.family)">{{ font.family }}</span>
                        <button class="remove-mini" (click)="fontSvc.removeCustomFont(font.family)">
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    }
                  }
                </div>

                <!-- Brand Logos -->
                <div class="section-label">Brand Logos</div>
                <div class="brand-logos-grid">
                  @for (logo of brandKit.brandLogos(); track logo.id) {
                    <div class="brand-logo-card">
                      <img [src]="logo.dataUrl" [alt]="logo.name" (click)="useBrandLogo(logo.dataUrl)" />
                      @if (logo.mimeType === 'image/svg+xml') {
                        <button
                          class="download-mini"
                          matTooltip="Download SVG"
                          (click)="downloadLogoSvg(logo); $event.stopPropagation()"
                        >
                          <mat-icon>download</mat-icon>
                        </button>
                      }
                      <button class="remove-mini" (click)="brandKit.removeBrandLogo(logo.id)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                  <button class="add-logo-btn" (click)="logoInput.click()">
                    <mat-icon>cloud_upload</mat-icon>
                    <span>Upload</span>
                  </button>
                  <input type="file" #logoInput accept="image/*,.svg" hidden (change)="addBrandLogo($event)" />
                </div>
              </div>
            }

            <!-- AI IMAGE TAB -->
            @if (tab === 'aiimage') {
              <div class="ai-image-panel">
                <div class="ai-hero">
                  <div class="hero-icon">
                    <mat-icon>auto_awesome</mat-icon>
                  </div>
                  <strong>AI Image Generator</strong>
                  <span>Describe an image and add it to your design</span>
                </div>

                <mat-form-field appearance="outline" class="ai-prompt-field">
                  <mat-label>Image description</mat-label>
                  <textarea matInput rows="3" [ngModel]="aiImagePrompt()" (ngModelChange)="aiImagePrompt.set($event)"
                    placeholder="A serene mountain landscape at sunset, painterly style"></textarea>
                </mat-form-field>

                <div class="ai-style-row">
                  <span class="style-label">Style</span>
                  @for (style of aiImageStyles; track style) {
                    <button class="style-chip" [class.active]="aiImageStyle() === style"
                      (click)="aiImageStyle.set(style)">{{ style }}</button>
                  }
                </div>

                <button mat-flat-button class="ai-generate-btn"
                  (click)="generateAiImage()"
                  [disabled]="!aiImagePrompt() || isGeneratingAiImage()">
                  @if (isGeneratingAiImage()) {
                    <mat-icon class="spinner">autorenew</mat-icon> Generating...
                  } @else {
                    <mat-icon>auto_awesome</mat-icon> Generate
                  }
                </button>

                @if (lastAiImage(); as imageUrl) {
                  <div class="ai-result">
                    <img [src]="imageUrl" alt="Generated" />
                    <button mat-stroked-button (click)="addAiImageToCanvas(imageUrl)">
                      <mat-icon>add</mat-icon> Add to Canvas
                    </button>
                  </div>
                }

                <div class="ai-hint">
                  <mat-icon>info</mat-icon>
                  <span>Powered by Pollinations.ai (free, no API key needed)</span>
                </div>
              </div>
            }

            <!-- BG REMOVE TAB -->
            @if (tab === 'bgremove') {
              <div class="bgremove-panel">
                <div class="bgremove-hero">
                  <div class="hero-icon">
                    <mat-icon>auto_fix_high</mat-icon>
                  </div>
                  <h3>AI Background Remover</h3>
                  <p>Remove image backgrounds instantly — runs in your browser, no upload needed.</p>
                </div>

                <!-- Upload for BG removal -->
                <button
                  mat-flat-button
                  class="bgremove-upload-btn"
                  (click)="triggerBgRemoveUpload()"
                  [disabled]="bgRemovalService.status() === 'processing' || bgRemovalService.status() === 'loading-model'"
                >
                  <mat-icon>add_photo_alternate</mat-icon>
                  Upload Image
                </button>

                <input
                  type="file"
                  #bgFileInput
                  accept="image/*"
                  (change)="onBgRemoveFileSelected($event)"
                  style="display: none"
                />

                <mat-divider />

                <button
                  mat-stroked-button
                  class="bgremove-canvas-btn"
                  (click)="removeSelectedBg()"
                  [disabled]="bgRemovalService.status() === 'processing' || bgRemovalService.status() === 'loading-model'"
                >
                  <mat-icon>content_cut</mat-icon>
                  Remove from Selected
                </button>
                <p class="hint-text">Select an image on the canvas, then click to remove its background.</p>

                <!-- Status -->
                @if (bgRemovalService.status() !== 'idle' && bgRemovalService.status() !== 'done') {
                  <div class="bgremove-status">
                    @if (bgRemovalService.status() === 'loading-model') {
                      <div class="status-card">
                        <div class="mini-spinner"></div>
                        <span>Loading AI model...</span>
                        <p class="status-hint">First time may take a moment</p>
                      </div>
                    }
                    @if (bgRemovalService.status() === 'processing') {
                      <div class="status-card">
                        <div class="mini-spinner"></div>
                        <span>Processing image...</span>
                        <mat-progress-bar
                          mode="determinate"
                          [value]="bgRemovalService.progress()"
                          class="progress"
                        />
                        <span class="progress-pct">{{ bgRemovalService.progress() }}%</span>
                      </div>
                    }
                  </div>
                }

                @if (bgRemovalService.status() === 'error') {
                  <div class="error-card">
                    <mat-icon>error_outline</mat-icon>
                    <span>{{ bgRemovalService.errorMessage() }}</span>
                  </div>
                }

                @if (bgRemovalService.status() === 'done') {
                  <div class="success-card">
                    <mat-icon>check_circle</mat-icon>
                    <span>Background removed successfully!</span>
                  </div>
                }

                <mat-divider />

                <!-- How it works -->
                <div class="how-it-works">
                  <div class="section-label">How it works</div>
                  <div class="step">
                    <div class="step-num">1</div>
                    <div>
                      <strong>Upload or select</strong>
                      <p>Upload a new image or select one on canvas</p>
                    </div>
                  </div>
                  <div class="step">
                    <div class="step-num">2</div>
                    <div>
                      <strong>AI processes</strong>
                      <p>Background is detected and removed automatically</p>
                    </div>
                  </div>
                  <div class="step">
                    <div class="step-num">3</div>
                    <div>
                      <strong>Export transparent</strong>
                      <p>Download as transparent PNG up to 4K resolution</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sidebar-wrapper {
      display: flex;
      height: 100%;
    }

    /* === Icon Rail === */
    .icon-rail {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 76px;
      padding: 12px 0;
      background: var(--px-surface, #ffffff);
      border-right: 1px solid var(--px-line, #e2e8f0);
      gap: 2px;
      z-index: 2;
      overflow-y: auto;
      box-shadow: 1px 0 3px rgba(15, 23, 42, 0.04);
    }

    /* Mobile: rail becomes horizontal bottom bar, drawer becomes bottom sheet */
    @media (max-width: 768px) {
      .sidebar-wrapper {
        flex-direction: column-reverse;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        height: auto;
        max-height: 70vh;
      }

      .icon-rail {
        flex-direction: row;
        width: 100%;
        height: 56px;
        padding: 0 8px;
        border-right: none;
        border-top: 1px solid var(--px-line, #e2e8f0);
        overflow-x: auto;
        overflow-y: hidden;
        gap: 4px;
      }

      .drawer-panel {
        position: fixed !important;
        bottom: 56px;
        left: 0;
        right: 0;
        max-height: 60vh;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4);
      }
    }

    .rail-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      background: none;
      border: none;
      color: var(--px-ink-soft, #334155);
      cursor: pointer;
      padding: 10px 4px;
      border-radius: 10px;
      width: 64px;
      transition: all 0.15s;
      font-size: 0.65rem;
      font-weight: 500;

      mat-icon {
        font-size: 22px;
        height: 22px;
        width: 22px;
      }

      &:hover {
        background: rgba(124, 58, 237, 0.08);
        color: var(--px-violet, #7c3aed);
      }

      &.active {
        background: rgba(124, 58, 237, 0.12);
        color: var(--px-violet, #7c3aed);
      }
    }

    /* === Drawer Panel === */
    .drawer-panel {
      width: 320px;
      background: var(--px-surface, #ffffff);
      border-right: 1px solid var(--px-line, #e2e8f0);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--px-line, #e2e8f0);

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      opacity: 0.5;
      margin-bottom: 10px;
      margin-top: 16px;

      &:first-child {
        margin-top: 0;
      }
    }

    /* === Templates === */
    .template-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .template-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }

      .tpl-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--mat-sys-primary-container);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;

        mat-icon {
          color: var(--mat-sys-on-primary-container);
        }
      }

      .tpl-name {
        font-size: 0.85rem;
        font-weight: 500;
      }

      .tpl-desc {
        font-size: 0.7rem;
        opacity: 0.5;
        margin-top: 2px;
      }
    }

    /* === Frames (PX-090 collage) === */
    .frames-hint {
      margin: 0 0 12px;
      padding: 10px 12px;
      background: rgba(124, 58, 237, 0.06);
      border: 1px solid rgba(124, 58, 237, 0.18);
      border-radius: 10px;
      color: var(--px-ink-soft, #334155);
      font-size: 0.78rem;
      line-height: 1.45;
    }

    .frame-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .frame-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      background: var(--px-surface, #ffffff);
      border: 1px solid var(--px-line, #e2e8f0);
      border-radius: 12px;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease,
        box-shadow 160ms ease;
    }
    .frame-card:hover {
      transform: translateY(-2px);
      border-color: rgba(124, 58, 237, 0.5);
      box-shadow: 0 8px 18px -8px rgba(15, 23, 42, 0.18);
    }
    .frame-card:focus-visible {
      outline: 3px solid rgba(124, 58, 237, 0.45);
      outline-offset: 3px;
    }

    .frame-preview {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: 1 / 1;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 8px;
      overflow: hidden;
    }
    .frame-slot {
      position: absolute;
      background: linear-gradient(135deg,
        rgba(124, 58, 237, 0.55) 0%,
        rgba(6, 182, 212, 0.55) 100%);
      border-radius: 3px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
      transform-origin: center;
    }
    /* PX-102 — shape-aware previews using clip-path */
    .frame-slot--rounded { border-radius: 18%; }
    .frame-slot--circle { border-radius: 50%; }
    .frame-slot--hexagon {
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      border-radius: 0;
    }
    .frame-slot--star {
      clip-path: polygon(
        50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
        50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
      border-radius: 0;
    }
    .frame-slot--heart {
      clip-path: path('M 50,90 C 50,90 4,67 4,34 C 4,16 17,5 30,5 C 39,5 46,10 50,20 C 54,10 61,5 70,5 C 83,5 96,16 96,34 C 96,67 50,90 50,90 Z');
      border-radius: 0;
    }

    .frame-name {
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--px-ink, #0f172a);
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      .frame-card { transition: none !important; }
      .frame-card:hover { transform: none !important; }
    }

    /* === Shapes === */
    .shape-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }

    .shape-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid transparent;
      border-radius: 10px;
      padding: 12px 8px;
      cursor: pointer;
      color: var(--mat-sys-on-surface);
      transition: all 0.15s;

      mat-icon {
        font-size: 28px;
        height: 28px;
        width: 28px;
        opacity: 0.8;
      }

      span {
        font-size: 0.7rem;
        opacity: 0.6;
      }

      &:hover {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
      }
    }

    /* === Stock Icons === */
    .icon-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }

    .icon-cat-chip {
      padding: 3px 10px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid transparent;
      border-radius: 12px;
      color: inherit;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.15s;

      &.active {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        border-color: var(--mat-sys-primary);
      }

      &:not(.active):hover {
        border-color: var(--mat-sys-outline-variant);
      }
    }

    .icon-count {
      font-size: 0.7rem;
      opacity: 0.4;
      text-align: center;
      margin-top: 4px;
    }

    .search-field {
      width: 100%;
      margin-bottom: 8px;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }

    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid transparent;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      color: var(--mat-sys-on-surface);
      transition: all 0.15s;

      svg {
        width: 28px;
        height: 28px;
      }

      &:hover {
        border-color: var(--mat-sys-primary);
        background: var(--mat-sys-primary-container);
        transform: scale(1.05);
      }

      &.decor svg {
        width: 32px;
        height: 32px;
      }
    }

    /* === QR Code === */
    .qr-generator {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;

      .qr-input { width: 100%; }

      .qr-generate-btn {
        width: 100%;
        font-size: 0.85rem;
      }
    }

    /* === Widgets === */
    .widgets-panel { padding: 12px; }

    .widget-card {
      background: var(--mat-sys-surface-container-high);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 8px;
      border: 1px solid transparent;

      &:hover {
        border-color: var(--mat-sys-outline-variant);
      }
    }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      mat-icon {
        color: var(--mat-sys-primary);
        flex-shrink: 0;
      }

      strong {
        display: block;
        font-size: 0.88rem;
      }

      span {
        display: block;
        font-size: 0.72rem;
        opacity: 0.6;
      }
    }

    .widget-config {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .config-row {
      display: flex;
      align-items: center;
      gap: 8px;

      label {
        font-size: 0.78rem;
        flex: 1;
        opacity: 0.75;
      }

      input[type="text"], input[type="number"], select {
        flex: 1;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 0.82rem;
        color: inherit;
        outline: none;

        &:focus { border-color: var(--mat-sys-primary); }
      }

      input[type="color"] {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        background: none;
      }
    }

    .config-toggle-btn, .add-widget-btn {
      width: 100%;
      font-size: 0.82rem;
    }

    /* === Design Helper === */
    .helper-panel { padding: 12px; }

    .helper-section {
      margin-bottom: 20px;
    }

    .full-width { width: 100%; }

    .extracted-row {
      display: flex;
      gap: 6px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .extracted-swatch {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 2px solid var(--mat-sys-outline-variant);
      cursor: pointer;
      padding: 0;
      transition: transform 0.15s, border-color 0.15s;

      &:hover {
        transform: scale(1.1);
        border-color: var(--mat-sys-primary);
      }
    }

    .palette-input-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;

      .palette-color-input {
        width: 44px;
        height: 44px;
        border: 2px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        cursor: pointer;
        padding: 0;
        background: none;
      }

      .palette-hint {
        font-size: 0.75rem;
        opacity: 0.6;
        flex: 1;
      }
    }

    .generated-palette {
      margin-bottom: 14px;

      .palette-name {
        display: block;
        font-size: 0.78rem;
        font-weight: 600;
        opacity: 0.7;
        margin-bottom: 6px;
      }

      .palette-colors {
        display: flex;
        gap: 4px;

        .palette-swatch {
          flex: 1;
          height: 36px;
          border-radius: 6px;
          border: 1px solid var(--mat-sys-outline-variant);
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s;

          &:hover { transform: scaleY(1.15); border-color: var(--mat-sys-primary); }
        }
      }
    }

    .helper-hint {
      margin: 0 0 10px;
      font-size: 0.76rem;
      opacity: 0.6;
    }

    .style-variants-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .style-variant-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 12px 14px;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      transition: transform 0.15s, border-color 0.15s;

      &:hover {
        transform: translateY(-2px);
        border-color: var(--mat-sys-primary);
      }

      strong {
        font-size: 1.05rem;
        margin-bottom: 2px;
      }

      small {
        font-size: 0.74rem;
        opacity: 0.75;
      }
    }

    .style-swatches {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;

      span {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
    }

    .font-pair-card {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      width: 100%;
      padding: 12px 14px;
      margin-bottom: 6px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid transparent;
      border-radius: 10px;
      color: inherit;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;

      strong { font-size: 1.1rem; line-height: 1.2; }
      span { font-size: 0.85rem; opacity: 0.75; }
      small { font-size: 0.68rem; opacity: 0.5; margin-top: 4px; }

      &:hover {
        border-color: var(--mat-sys-primary);
      }
    }

    /* === Brand Kit === */
    .brand-kit-panel { padding: 12px; }

    .brand-colors-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 16px;
    }

    .brand-color-item {
      position: relative;
    }

    .brand-color-swatch {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 2px solid var(--mat-sys-outline-variant);
      cursor: pointer;
      padding: 0;
      transition: transform 0.15s, border-color 0.15s;

      &:hover {
        transform: scale(1.1);
        border-color: var(--mat-sys-primary);
      }
    }

    .brand-color-item:hover .remove-mini {
      opacity: 1;
    }

    .remove-mini {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #ef4444;
      color: white;
      border: none;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;

      mat-icon {
        font-size: 12px;
        height: 12px;
        width: 12px;
      }
    }

    .add-color-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 2px dashed var(--mat-sys-outline-variant);
      background: none;
      color: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s;

      &:hover { border-color: var(--mat-sys-primary); color: var(--mat-sys-primary); }

      mat-icon { font-size: 18px; height: 18px; width: 18px; }
    }

    .brand-fonts-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 16px;
    }

    .brand-font-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 8px;
      position: relative;

      .font-preview {
        flex: 1;
        font-size: 0.9rem;
        cursor: pointer;
      }

      &:hover .remove-mini {
        opacity: 1;
        position: relative;
        top: 0;
        right: 0;
      }
    }

    .add-font-field {
      width: 100%;
    }

    .upload-font-btn {
      width: 100%;
      margin-top: 4px;
      font-size: 0.82rem;
    }

    .empty-hint {
      font-size: 0.78rem;
      opacity: 0.4;
      text-align: center;
      padding: 12px;
    }

    .brand-logos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }

    .brand-logo-card {
      position: relative;
      aspect-ratio: 1;
      background: var(--mat-sys-surface-container-high);
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        cursor: pointer;
        padding: 6px;
      }

      &:hover .remove-mini { opacity: 1; }
      &:hover .download-mini { opacity: 1; }
    }

    .download-mini {
      position: absolute;
      top: -4px;
      left: -4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      border: none;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;

      mat-icon {
        font-size: 12px;
        height: 12px;
        width: 12px;
      }
    }

    .add-logo-btn {
      aspect-ratio: 1;
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: 8px;
      background: none;
      color: inherit;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: border-color 0.15s;

      &:hover { border-color: var(--mat-sys-primary); color: var(--mat-sys-primary); }

      mat-icon { font-size: 24px; height: 24px; width: 24px; }
      span { font-size: 0.75rem; }
    }

    /* === AI Image Generator === */
    .ai-image-panel { padding: 12px; }

    .ai-hero {
      text-align: center;
      padding: 20px 16px;
      background: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.15) 100%);
      border-radius: 12px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .hero-icon mat-icon {
        font-size: 36px;
        height: 36px;
        width: 36px;
        color: var(--mat-sys-primary);
        margin-bottom: 8px;
      }

      strong { font-size: 0.95rem; }
      span { font-size: 0.78rem; opacity: 0.6; }
    }

    .ai-prompt-field {
      width: 100%;
    }

    .ai-style-row {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-bottom: 12px;
      align-items: center;

      .style-label {
        font-size: 0.72rem;
        opacity: 0.5;
        margin-right: 4px;
      }
    }

    .style-chip {
      padding: 3px 10px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 12px;
      color: inherit;
      font-size: 0.72rem;
      cursor: pointer;
      transition: all 0.15s;

      &.active {
        background: var(--mat-sys-primary-container);
        border-color: var(--mat-sys-primary);
      }
    }

    .ai-generate-btn {
      width: 100%;
      height: 42px;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%) !important;
      color: white !important;

      .spinner {
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .ai-result {
      margin-bottom: 12px;

      img {
        width: 100%;
        border-radius: 8px;
        margin-bottom: 8px;
        background: var(--mat-sys-surface-container-high);
      }

      button { width: 100%; }
    }

    .ai-hint {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 10px 12px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 8px;
      font-size: 0.72rem;
      opacity: 0.6;

      mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
        flex-shrink: 0;
      }
    }

    /* === AI Background === */
    .ai-bg-section {
      margin-bottom: 12px;

      .ai-bg-input {
        width: 100%;
        margin-bottom: 8px;
      }

      .ai-bg-btn {
        width: 100%;
        margin-bottom: 8px;
        background: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%) !important;
        color: white !important;
      }

      .ai-bg-suggestions {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .suggestion-chip {
        padding: 3px 10px;
        background: var(--mat-sys-surface-container-high);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        color: inherit;
        font-size: 0.72rem;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          border-color: var(--mat-sys-primary);
          background: var(--mat-sys-primary-container);
        }
      }
    }

    /* === Background Image === */
    .bg-image-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;

      button {
        flex: 1;
        font-size: 0.78rem;
      }
    }

    .bg-fit-toggle {
      width: 100%;
      margin-bottom: 12px;
    }

    /* === Draw Panel === */
    .draw-panel {
      padding: 12px;
    }

    .draw-toggle-btn {
      width: 100%;
      margin-bottom: 16px;
      font-size: 0.9rem;

      &.active {
        background: var(--mat-sys-error-container) !important;
        color: var(--mat-sys-on-error-container) !important;
      }
    }

    .draw-settings {
      .draw-color-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .draw-color-input {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        background: none;
      }

      .draw-swatch {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: transform 0.15s, border-color 0.15s;

        &:hover {
          transform: scale(1.15);
          border-color: var(--mat-sys-primary);
        }
      }

      .draw-size-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .draw-slider { flex: 1; }
        .draw-size-val {
          font-size: 0.82rem;
          min-width: 36px;
          text-align: right;
          opacity: 0.6;
        }
      }

      .draw-preview {
        margin-top: 12px;
        background: var(--mat-sys-surface-container-high);
        border-radius: 8px;
        padding: 4px;
      }
    }

    .draw-hint {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-top: 16px;
      padding: 12px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 8px;
      font-size: 0.78rem;
      opacity: 0.6;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        flex-shrink: 0;
      }
    }

    /* === Text Presets === */
    .text-presets {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .text-preset {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-high);
      cursor: pointer;
      transition: all 0.15s;
      color: var(--mat-sys-on-surface);

      &:hover {
        border-color: var(--mat-sys-primary);
      }

      &.heading .preview {
        font-size: 1.3rem;
        font-weight: 700;
      }

      &.subheading .preview {
        font-size: 1rem;
        font-weight: 500;
      }

      &.body-text .preview {
        font-size: 0.85rem;
        font-weight: 400;
      }
    }

    .font-combos {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .font-combo-card {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-high);
      cursor: pointer;
      color: var(--mat-sys-on-surface);
      transition: all 0.15s;

      &:hover {
        border-color: var(--mat-sys-primary);
      }

      .combo-heading {
        font-size: 1.1rem;
        font-weight: 700;
      }

      .combo-body {
        font-size: 0.8rem;
        opacity: 0.6;
      }
    }

    /* === Uploads === */
    .upload-btn {
      width: 100%;
      padding: 16px;
      font-size: 0.95rem;
      margin-bottom: 16px;

      &.secondary {
        margin-top: 16px;
      }
    }

    .uploads-gallery {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }

    .upload-thumb {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 1;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border: 2px solid transparent;
      transition: border-color 0.15s, transform 0.15s;

      &:hover {
        border-color: var(--mat-sys-primary);
        transform: scale(1.03);

        .remove-upload { opacity: 1; }
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-upload {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        background: rgba(0,0,0,0.7);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.15s;
        padding: 0;

        mat-icon {
          font-size: 14px;
          height: 14px;
          width: 14px;
        }
      }
    }

    .upload-hint {
      display: flex;
      gap: 8px;
      padding: 12px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 10px;
      margin-bottom: 16px;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        opacity: 0.5;
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        margin: 0;
        font-size: 0.8rem;
        opacity: 0.6;
        line-height: 1.4;
      }
    }

    .bg-hint {
      font-size: 0.78rem;
      opacity: 0.5;
      line-height: 1.4;
      margin: 4px 0 0;
    }

    /* === Background === */
    .bg-toggle {
      width: 100%;
      margin-bottom: 12px;
    }

    .custom-bg-color {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;

      .color-picker-lg {
        width: 64px;
        height: 64px;
        border: 3px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        cursor: pointer;
        padding: 0;
        background: none;
      }
    }

    .bg-color-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
    }

    .bg-color-swatch {
      aspect-ratio: 1;
      border-radius: 8px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;

      &:hover {
        transform: scale(1.15);
        border-color: var(--mat-sys-primary);
      }
    }

    /* === Rail Divider === */
    .rail-divider {
      width: 40px;
      height: 1px;
      background: var(--mat-sys-outline-variant);
      margin: 6px 0;
    }

    .rail-btn.accent mat-icon {
      color: var(--mat-sys-primary);
    }

    /* === BG Remove Panel === */
    .bgremove-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bgremove-hero {
      text-align: center;
      padding: 8px 0 16px;

      .hero-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: linear-gradient(135deg, #e91e63, #9c27b0);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;

        mat-icon {
          color: white;
          font-size: 28px;
          height: 28px;
          width: 28px;
        }
      }

      h3 {
        margin: 0 0 6px;
        font-size: 1.05rem;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 0.8rem;
        opacity: 0.6;
        line-height: 1.4;
      }
    }

    .bgremove-upload-btn {
      width: 100%;
      padding: 14px;
      font-size: 0.95rem;
    }

    .bgremove-canvas-btn {
      width: 100%;
      padding: 12px;
    }

    .hint-text {
      font-size: 0.75rem;
      opacity: 0.5;
      margin: 2px 0 0;
      line-height: 1.4;
    }

    .bgremove-status {
      margin: 8px 0;
    }

    .status-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      text-align: center;

      span {
        font-size: 0.85rem;
        font-weight: 500;
      }

      .status-hint {
        font-size: 0.75rem;
        opacity: 0.5;
        margin: 0;
      }

      .progress {
        width: 100%;
        border-radius: 4px;
      }

      .progress-pct {
        font-size: 0.8rem;
        opacity: 0.6;
        font-variant-numeric: tabular-nums;
      }
    }

    .mini-spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--mat-sys-outline-variant);
      border-top-color: var(--mat-sys-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-card {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px;
      background: rgba(244, 67, 54, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(244, 67, 54, 0.3);

      mat-icon {
        color: #f44336;
        font-size: 20px;
        height: 20px;
        width: 20px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      span {
        font-size: 0.8rem;
        line-height: 1.4;
      }
    }

    .success-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(76, 175, 80, 0.3);

      mat-icon {
        color: #4caf50;
        font-size: 20px;
        height: 20px;
        width: 20px;
      }

      span {
        font-size: 0.85rem;
        font-weight: 500;
      }
    }

    .how-it-works {
      .step {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;

        .step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--mat-sys-primary-container);
          color: var(--mat-sys-on-primary-container);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        strong {
          font-size: 0.85rem;
          display: block;
          margin-bottom: 2px;
        }

        p {
          margin: 0;
          font-size: 0.75rem;
          opacity: 0.5;
          line-height: 1.3;
        }
      }
    }
  `],
})
export class SidebarDrawerComponent {
  private readonly templateService = inject(TemplateService);
  readonly canvasService = inject(CanvasService);
  readonly bgRemovalService = inject(BackgroundRemovalService);

  @ViewChild('bgFileInput') bgFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadFileInput') uploadFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('bgImageInput') bgImageInputRef!: ElementRef<HTMLInputElement>;

  readonly bgFit = signal<'cover' | 'contain' | 'tile'>('cover');
  private currentBgImageDataUrl: string | null = null;

  private readonly aiBgService = inject(AiBackgroundService);
  readonly aiPrompt = signal('');
  readonly aiSuggestions = ['ocean sunset', 'forest mesh', 'midnight space', 'pastel waves', 'gold luxury'];

  readonly brandKit = inject(BrandKitService);
  readonly fontSvc = inject(FontService);
  readonly allFonts = this.fontSvc.getAllFontFamilies();

  // Design Helper
  private readonly helperService = inject(DesignHelperService);
  readonly extractedColors = signal<string[]>([]);
  readonly extracting = signal(false);
  readonly paletteBase = signal('#7c3aed');
  readonly generatedPalettes = signal<ColorPalette[]>([]);
  readonly fontPairings = this.helperService.getFontPairings();

  // Style variations
  private readonly styleVariationsSvc = inject(StyleVariationsService);
  readonly styleVariants = this.styleVariationsSvc.getAllStyles();

  async applyStyleVariant(style: StylePreset): Promise<void> {
    await this.styleVariationsSvc.applyStyle(style.id);
  }

  // Plugins
  readonly allPlugins = PluginRegistry.getAll();
  readonly expandedWidget = signal<string | null>(null);
  private widgetConfigs: Record<string, Record<string, any>> = {};

  readonly aiImagePrompt = signal('');
  readonly aiImageStyle = signal('photo');
  readonly aiImageStyles = ['photo', 'illustration', '3d-render', 'anime', 'minimalist', 'painting'];
  readonly isGeneratingAiImage = signal(false);
  readonly lastAiImage = signal<string | null>(null);

  private readonly projectService = inject(ProjectService);
  readonly uploadedImages = this.projectService.uploadedImages;

  readonly activeTab = signal<SidebarTab>(null);
  readonly drawerTitle = signal('');

  readonly templates = LOGO_TEMPLATES;

  addShape = output<ShapeType>();
  addText = output<{ text: string; fontSize: number; fontWeight: string; fontFamily?: string }>();
  uploadImage = output<void>();
  removeBg = output<void>();
  /**
   * Emitted when the user clicks a collage layout preset card. The
   * editor host listens for this and forwards to
   * `CanvasService.addFrameLayout`. Output (rather than direct service
   * call) keeps the sidebar drawer's data dependencies one-way.
   *
   * @see Story PX-090 AC-2.
   */
  addFrameLayout = output<FramePreset>();

  /** All collage presets — bound to the Frames drawer panel grid. */
  readonly framePresets = FRAME_PRESETS;

  readonly basicShapes: { type: ShapeType; name: string; icon: string }[] = [
    { type: 'rect', name: 'Rectangle', icon: 'rectangle' },
    { type: 'circle', name: 'Circle', icon: 'circle' },
    { type: 'triangle', name: 'Triangle', icon: 'change_history' },
  ];

  readonly logoShapes: { type: ShapeType; name: string; icon: string }[] = [
    { type: 'star', name: 'Star', icon: 'star' },
    { type: 'polygon', name: 'Pentagon', icon: 'pentagon' },
    { type: 'hexagon', name: 'Hexagon', icon: 'hexagon' },
    { type: 'diamond', name: 'Diamond', icon: 'diamond' },
    { type: 'arrow', name: 'Arrow', icon: 'arrow_right_alt' },
  ];

  readonly fontCombos = [
    { name: 'Classic', heading: 'Georgia', body: 'Roboto' },
    { name: 'Modern', heading: 'Helvetica', body: 'Arial' },
    { name: 'Editorial', heading: 'Times New Roman', body: 'Verdana' },
    { name: 'Clean', heading: 'Trebuchet MS', body: 'Roboto' },
  ];

  readonly drawColors = [
    '#000000', '#ffffff', '#e74c3c', '#3498db', '#2ecc71',
    '#f39c12', '#9b59b6', '#1abc9c', '#e91e63', '#795548',
  ];

  readonly bgColors = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da',
    '#1a1a2e', '#16213e', '#0f3460', '#2c3e50', '#34495e',
    '#e74c3c', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
    '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548',
  ];

  private readonly sanitizer = inject(DomSanitizer);
  readonly iconSearch = signal('');
  readonly qrInput = signal('');

  readonly stockIcons: { name: string; path: any; svg: string }[] = [
    { name: 'Heart', path: this.trust('<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74c3c"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
    { name: 'Star', path: this.trust('<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f1c40f"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
    { name: 'Lightning', path: this.trust('<path d="M7 2v11h3v9l7-12h-4l4-8z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f39c12"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>' },
    { name: 'Moon', path: this.trust('<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9b59b6"><path d="M12.1 22c-4.97 0-9-3.03-9-9s4.03-9 9-9c4.97 0 8 3.58 8 8 0 2.76-2.24 5-5 5h-1.77c-.83 0-1.5.67-1.5 1.5 0 .39.15.74.38 1 .24.27.39.62.39 1.01 0 .83-.67 1.49-1.5 1.49z"/></svg>' },
    { name: 'Sun', path: this.trust('<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f39c12"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>' },
    { name: 'Cloud', path: this.trust('<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3498db"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>' },
    { name: 'Location', path: this.trust('<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74c3c"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' },
    { name: 'Music', path: this.trust('<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9b59b6"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>' },
    { name: 'Camera', path: this.trust('<circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2c3e50"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>' },
    { name: 'Phone', path: this.trust('<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#27ae60"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' },
    { name: 'Email', path: this.trust('<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3498db"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' },
    { name: 'Lock', path: this.trust('<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#95a5a6"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>' },
    { name: 'Home', path: this.trust('<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2c3e50"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' },
    { name: 'Trophy', path: this.trust('<path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f1c40f"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>' },
    { name: 'Gift', path: this.trust('<path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74c3c"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/></svg>' },
    { name: 'Rocket', path: this.trust('<path d="M12 2.5c-3.26 0-6.27 1.66-8 4.39l3.61 2.09c.93-1.62 2.65-2.7 4.61-2.7s3.68 1.07 4.61 2.7L20.44 6.9C18.7 4.16 15.69 2.5 12.43 2.5zM9.58 16.13l-3.61 2.09C7.7 20.34 10.71 22 14 22c3.26 0 6.27-1.66 8-4.39l-3.61-2.09c-.93 1.62-2.65 2.7-4.61 2.7s-3.68-1.07-4.61-2.7z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e67e22"><path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.26zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83L11.17 17zM14.65 14.81l.26 1.33c.13.66-.08 1.34-.55 1.81L10.31 22l-1.55-3.62c.31-.13 3.6-1.53 5.89-3.57zM12 9c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>' },
    { name: 'Leaf', path: this.trust('<path d="M17.12 2.12c-5.69 0-11.63 3.13-12.01 11.25C2 15.13 2 17.8 2 21c0 .55.45 1 1 1h.01c3.2 0 5.87 0 7.63-3.11C18.76 18.52 22 12.57 22 6.88c0-2.63-2.13-4.76-4.88-4.76z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#27ae60"><path d="M17.12 2.12c-5.69 0-11.63 3.13-12.01 11.25C2 15.13 2 17.8 2 21c0 .55.45 1 1 1h.01c3.2 0 5.87 0 7.63-3.11C18.76 18.52 22 12.57 22 6.88c0-2.63-2.13-4.76-4.88-4.76z"/></svg>' },
    { name: 'Flag', path: this.trust('<path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e74c3c"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>' },
    { name: 'Shield', path: this.trust('<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3498db"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>' },
    { name: 'Smile', path: this.trust('<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f1c40f"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>' },
    { name: 'Crown', path: this.trust('<path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f1c40f"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"/></svg>' },
  ];

  readonly decorativeElements: { name: string; path: any; svg: string }[] = [
    { name: 'Circle Ring', path: this.trust('<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>' },
    { name: 'Double Ring', path: this.trust('<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7"/></svg>' },
    { name: 'Badge', path: this.trust('<path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.2l-4.8 2.4.9-5.3L4.3 7.6l5.3-.8z" fill="none" stroke="currentColor" stroke-width="1.5"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" stroke-width="1.5"><path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.2l-4.8 2.4.9-5.3L4.3 7.6l5.3-.8z"/></svg>' },
    { name: 'Divider Dot', path: this.trust('<circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#71717a"><circle cx="4" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="20" cy="12" r="2"/></svg>' },
    { name: 'Wave', path: this.trust('<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke-linecap="round"/></svg>' },
    { name: 'Brackets', path: this.trust('<path d="M4 4v16M20 4v16M4 4h4M4 20h4M20 4h-4M20 20h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'), svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2c3e50" stroke-width="2"><path d="M4 4v16M20 4v16M4 4h4M4 20h4M20 4h-4M20 20h-4" stroke-linecap="round"/></svg>' },
  ];

  readonly filteredIcons = computed(() => {
    const search = this.iconSearch().toLowerCase();
    if (!search) return this.stockIcons;
    return this.stockIcons.filter(i => i.name.toLowerCase().includes(search));
  });

  // New expanded library
  readonly stockIconsLibrary = STOCK_ICONS;
  readonly iconCategories = ICON_CATEGORIES;
  readonly iconCategory = signal<string>('all');

  readonly filteredStockIcons = computed(() => {
    const search = this.iconSearch().toLowerCase();
    const cat = this.iconCategory();

    let icons = this.stockIconsLibrary;
    if (cat !== 'all') {
      icons = icons.filter(i => i.category === cat);
    }
    if (search) {
      icons = icons.filter(i => i.name.toLowerCase().includes(search));
    }
    return icons;
  });

  trustSvg(svg: string): any {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  addStockIconToCanvas(icon: { name: string; svg: string }): void {
    this.canvasService.addSvg(icon.svg);
  }

  private trust(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleTab(tab: SidebarTab): void {
    if (this.activeTab() === tab) {
      this.activeTab.set(null);
    } else {
      this.activeTab.set(tab);
      this.drawerTitle.set(this.getTitleForTab(tab!));
    }
  }

  closeDrawer(): void {
    this.activeTab.set(null);
  }

  applyTemplate(id: string): void {
    this.templateService.applyTemplate(id);
  }

  addHeading(): void {
    this.addText.emit({ text: 'Add a heading', fontSize: 64, fontWeight: 'bold' });
  }

  addSubheading(): void {
    this.addText.emit({ text: 'Add a subheading', fontSize: 36, fontWeight: '500' });
  }

  addBody(): void {
    this.addText.emit({ text: 'Add body text', fontSize: 20, fontWeight: 'normal' });
  }

  addIconToCanvas(icon: { name: string; svg: string }): void {
    this.canvasService.addSvg(icon.svg);
  }

  async generateQR(): Promise<void> {
    const text = this.qrInput();
    if (!text) return;

    // Dynamic import to keep initial bundle small
    const qrcode = (await import('qrcode-generator')).default;
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = 8;
    const margin = 16;
    const size = moduleCount * cellSize + margin * 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          const x = margin + c * cellSize;
          const y = margin + r * cellSize;
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`;
        }
      }
    }
    svg += '</svg>';

    this.canvasService.addSvg(svg);
  }

  addDecorToCanvas(decor: { name: string; svg: string }): void {
    this.canvasService.addSvg(decor.svg);
  }

  applyFontCombo(combo: { heading: string; body: string }): void {
    this.addText.emit({ text: 'Heading Text', fontSize: 48, fontWeight: 'bold', fontFamily: combo.heading });
  }

  onBgModeChange(mode: BackgroundMode): void {
    this.canvasService.setBackgroundMode(mode);
  }

  onCustomBgColor(color: string): void {
    this.canvasService.setBackgroundMode('custom', color);
  }

  triggerBgImageUpload(): void {
    this.bgImageInputRef?.nativeElement?.click();
  }

  onBgImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.currentBgImageDataUrl = dataUrl;
      this.canvasService.setBackgroundImage(dataUrl, this.bgFit());
    };
    reader.readAsDataURL(file);
  }

  removeBgImage(): void {
    this.currentBgImageDataUrl = null;
    this.canvasService.removeBackgroundImage();
  }

  // --- Widgets / Plugins ---

  toggleWidget(id: string): void {
    this.expandedWidget.set(this.expandedWidget() === id ? null : id);
  }

  getWidgetConfig(pluginId: string, key: string, defaultValue: any): any {
    if (!this.widgetConfigs[pluginId]) {
      this.widgetConfigs[pluginId] = {};
    }
    if (this.widgetConfigs[pluginId][key] === undefined) {
      this.widgetConfigs[pluginId][key] = defaultValue;
    }
    return this.widgetConfigs[pluginId][key];
  }

  setWidgetConfig(pluginId: string, key: string, value: any): void {
    if (!this.widgetConfigs[pluginId]) {
      this.widgetConfigs[pluginId] = {};
    }
    this.widgetConfigs[pluginId][key] = value;
  }

  async addWidget(pluginId: string): Promise<void> {
    const plugin = PluginRegistry.getById(pluginId);
    if (!plugin) return;

    const config = this.widgetConfigs[pluginId] || {};
    // Fill in defaults
    plugin.configFields?.forEach(f => {
      if (config[f.key] === undefined) config[f.key] = f.default;
    });

    await plugin.render(config, {
      canvas: this.canvasService,
      addSvg: (svg: string) => this.canvasService.addSvg(svg),
      addText: (text: string, options?: any) => this.canvasService.addText(text, options),
      addImage: (url: string) => this.canvasService.addImage(url),
    });
  }

  // --- Design Helper ---

  async extractColors(): Promise<void> {
    this.extracting.set(true);
    try {
      const colors = await this.helperService.extractColorsFromSelection();
      this.extractedColors.set(colors);
      if (colors.length > 0) {
        this.paletteBase.set(colors[0]);
        this.generatedPalettes.set(this.helperService.generatePalettesFrom(colors[0]));
      }
    } finally {
      this.extracting.set(false);
    }
  }

  generatePalettes(baseColor: string): void {
    this.paletteBase.set(baseColor);
    this.generatedPalettes.set(this.helperService.generatePalettesFrom(baseColor));
  }

  useColor(color: string): void {
    this.useBrandColor(color);
  }

  useFontPair(pair: FontPairing): void {
    // Add a heading and body text using the pair
    Promise.all([
      this.fontSvc.loadFont(pair.heading),
      this.fontSvc.loadFont(pair.body),
    ]).then(() => {
      this.canvasService.addText('Heading Text', { fontFamily: pair.heading, fontSize: 56, fontWeight: 'bold' });
      setTimeout(() => {
        this.canvasService.addText('Body text goes here', { fontFamily: pair.body, fontSize: 18 });
      }, 100);
    });
  }

  // --- Brand Kit ---

  addBrandColor(color: string): void {
    this.brandKit.addBrandColor(color);
  }

  useBrandColor(color: string): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (obj) {
      obj.set('fill', color);
      canvas!.renderAll();
    }
    this.brandKit.trackRecentColor(color);
  }

  addBrandFontFromSelect(font: string): void {
    if (font) this.brandKit.addBrandFont(font);
  }

  async uploadCustomFont(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    try {
      const family = await this.fontSvc.uploadCustomFont(file);
      this.brandKit.addBrandFont(family);
    } catch (e: any) {
      alert(e?.message || 'Failed to upload font');
    }
  }

  useBrandFont(font: string): void {
    const canvas = this.canvasService.getCanvas();
    const obj = canvas?.getActiveObject();
    if (obj && 'fontFamily' in obj) {
      this.fontSvc.loadFont(font).then(() => {
        obj.set('fontFamily' as any, font);
        canvas!.renderAll();
      });
    }
    this.brandKit.trackRecentFont(font);
  }

  addBrandLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.brandKit.addBrandLogo(file.name, dataUrl);
    };
    reader.readAsDataURL(file);
  }

  useBrandLogo(dataUrl: string): void {
    if (dataUrl.startsWith('data:image/svg')) {
      // For SVG, fetch text version
      fetch(dataUrl).then(r => r.text()).then(svg => this.canvasService.addSvg(svg));
    } else {
      this.canvasService.addImage(dataUrl);
    }
  }

  /**
   * Download the given logo's SVG source as a `.svg` file.
   *
   * @param logo - Must be an SVG-typed {@link BrandLogo}; the UI template
   *   only renders the trigger button when `logo.mimeType === 'image/svg+xml'`
   *   so this method can assume that invariant.
   *
   * @see PX-003 AC-3
   */
  downloadLogoSvg(logo: BrandLogo): void {
    this.brandKit.downloadBrandLogoSvg(logo);
  }

  generateAiImage(): void {
    const prompt = this.aiImagePrompt();
    if (!prompt) return;

    this.isGeneratingAiImage.set(true);

    const style = this.aiImageStyle();
    const fullPrompt = encodeURIComponent(`${prompt}, ${style}`);
    const seed = Math.floor(Math.random() * 1000000);
    const w = 1024;
    const h = 1024;

    // Pollinations.ai - free image generation, no API key needed
    const url = `https://image.pollinations.ai/prompt/${fullPrompt}?width=${w}&height=${h}&seed=${seed}&nologo=true`;

    // Verify the image loads
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.lastAiImage.set(url);
      this.isGeneratingAiImage.set(false);
    };
    img.onerror = () => {
      this.isGeneratingAiImage.set(false);
      console.error('AI image generation failed');
    };
    img.src = url;
  }

  addAiImageToCanvas(url: string): void {
    this.canvasService.addImage(url);
  }

  generateAiBg(): void {
    const prompt = this.aiPrompt();
    if (!prompt) return;
    this.aiBgService.generateAndApply(prompt);
  }

  useAiSuggestion(suggestion: string): void {
    this.aiPrompt.set(suggestion);
    this.generateAiBg();
  }

  setBgFit(fit: 'cover' | 'contain' | 'tile'): void {
    this.bgFit.set(fit);
    if (this.currentBgImageDataUrl) {
      this.canvasService.setBackgroundImage(this.currentBgImageDataUrl, fit);
    }
  }

  // --- Uploads Gallery ---

  triggerUpload(): void {
    this.uploadFileInputRef?.nativeElement.click();
  }

  onUploadFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');

      if (!file.type.startsWith('image/') && !isSvg) continue;

      if (isSvg) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const svgString = e.target?.result as string;
          this.canvasService.addSvg(svgString);
        };
        reader.readAsText(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          this.projectService.addUploadedImage(file.name, dataUrl);
        };
        reader.readAsDataURL(file);
      }
    }

    input.value = '';
  }

  addUploadedToCanvas(dataUrl: string): void {
    this.canvasService.addImage(dataUrl);
  }

  removeUpload(event: Event, id: string): void {
    event.stopPropagation();
    this.projectService.removeUploadedImage(id);
  }

  // --- BG Removal ---

  triggerBgRemoveUpload(): void {
    this.bgRemovalService.reset();
    this.bgFileInputRef?.nativeElement.click();
  }

  async onBgRemoveFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    const resultBlob = await this.bgRemovalService.removeBackground(file);
    if (resultBlob) {
      const url = URL.createObjectURL(resultBlob);
      this.canvasService.addImage(url);
    }
  }

  async removeSelectedBg(): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    this.bgRemovalService.reset();

    const dataUrl = activeObj.toDataURL({ format: 'png' });
    const resultUrl = await this.bgRemovalService.removeFromDataURL(dataUrl);

    if (resultUrl) {
      this.canvasService.addImage(resultUrl);
      canvas.remove(activeObj);
      canvas.renderAll();
    }
  }

  private getTitleForTab(tab: string): string {
    switch (tab) {
      case 'templates': return 'Templates';
      case 'elements': return 'Elements';
      case 'text': return 'Text';
      case 'uploads': return 'Uploads';
      case 'background': return 'Background';
      case 'draw': return 'Draw';
      case 'aiimage': return 'AI Image';
      case 'brand': return 'Brand Kit';
      case 'helper': return 'Design Helper';
      case 'widgets': return 'Widgets';
      case 'bgremove': return 'Background Remover';
      default: return '';
    }
  }
}
