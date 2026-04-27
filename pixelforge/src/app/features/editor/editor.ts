import {
  Component,
  inject,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  signal,
  computed,
  HostListener,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CanvasService, ShapeType } from '../../core/services/canvas.service';
import { FramePreset } from '../../core/data/frame-presets';
import { getPlatformPreset } from '../../core/constants/platform-presets';
import { ProjectService } from '../../core/services/project.service';
import { ExportService } from '../../core/services/export.service';
import { ApiService } from '../../core/services/api.service';
import { HistoryService } from '../../core/services/history.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import { ClipboardService } from '../../core/services/clipboard.service';
import { BackgroundRemovalService } from '../../core/services/background-removal.service';
import { LayerPanelComponent } from './components/layer-panel';
import { PropertyPanelComponent } from './components/property-panel';
import {
  ContextToolbarComponent,
  ContextToolbarContext,
} from './components/context-toolbar';
import { SidebarDrawerComponent } from './components/sidebar-drawer';
import { ExportDialog } from './components/export-dialog';
import { ShortcutsDialog } from './components/shortcuts-dialog';
import { ResizeDialog } from './components/resize-dialog';
import { ShareDialog } from './components/share-dialog';
import { VersionsDialog } from './components/versions-dialog';
import { CommandPalette } from './components/command-palette';
import { AuditDialog } from './components/audit-dialog';
import { PresentationMode } from './components/presentation-mode';
import { CommentsOverlay } from './components/comments-overlay';
import { CommentsService } from '../../core/services/comments.service';
import { CollabOverlay, CollabStatusDot } from './components/collab-overlay';
import { CollaborationService } from '../../core/services/collaboration.service';
import { AiDesignService } from '../../core/services/ai-design.service';
import { QualityScoreService, QualityBreakdown } from '../../core/services/quality-score.service';
import { OnboardingTour } from './components/onboarding-tour';
import { AnimationTimeline } from './components/animation-timeline';
import { ImageFiltersPanelComponent } from './components/image-filters-panel';
import { ContextMenuComponent } from './components/context-menu';
import { TextToolbarComponent } from './components/text-toolbar';
import { FontService } from '../../core/services/font.service';
import { TemplateService } from '../../core/services/template.service';
import { BrandKitService } from '../../core/services/brand-kit.service';
import { BrandKitApplyService } from '../../core/services/brand-kit-apply.service';
import type { PlatformType } from '../../core/constants/platform-presets';
import * as fabric from 'fabric';

/**
 * Project-ids whose Brand-Kit auto-apply toast has already been shown (or
 * dismissed / undone) in the current browser session. Module-level so it
 * survives `Editor` component re-creations within the same tab — the
 * guarantee is "at most one toast per project-open" (PX-060 AC-4).
 *
 * @see Story PX-060
 */
export const TOAST_SHOWN_PROJECT_IDS = new Set<string>();

/**
 * Maximum age (in milliseconds) of a project's ``brand_kit_applied_at``
 * timestamp for the editor load-hook to count it as "just applied" and
 * fire the toast.
 *
 * @remarks
 * 30 minutes accommodates realistic gallery → editor navigation delays
 * (slow backend, user switches tabs, modal interstitials) while still
 * expiring stale markers from prior sessions where the server-clear leg
 * failed. The server-side marker is cleared on any toast dismissal
 * (action, swipe, or 7s timeout) via `BrandKitApplyService.clearMarker`,
 * so this freshness window is only ever a fallback safety net.
 *
 * @see Story PX-060 — AC-1, AC-4, Orion decision D1 (2026-04-24T17:50Z).
 */
const BRAND_KIT_APPLIED_FRESHNESS_MS = 30 * 60 * 1000;

@Component({
  selector: 'app-editor',
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatSliderModule,
    MatDialogModule,
    LayerPanelComponent,
    PropertyPanelComponent,
    ContextToolbarComponent,
    CommandPalette,
    PresentationMode,
    CommentsOverlay,
    CollabOverlay,
    CollabStatusDot,
    OnboardingTour,
    AnimationTimeline,
    ImageFiltersPanelComponent,
    ContextMenuComponent,
    TextToolbarComponent,
    SidebarDrawerComponent,
  ],
  template: `
    <div class="editor-layout">
      <!-- Top Bar -->
      <header class="editor-topbar">
        <div class="topbar-left">
          <button mat-icon-button matTooltip="Home" (click)="goBack()" class="home-btn">
            <mat-icon>home</mat-icon>
          </button>

          <!-- File menu (Canva-style) -->
          <button mat-button class="file-btn" [matMenuTriggerFor]="fileMenu">
            <mat-icon>description</mat-icon>
            File
          </button>
          <mat-menu #fileMenu="matMenu">
            <button mat-menu-item (click)="fileNew()">
              <mat-icon>add</mat-icon>
              <span>New design</span>
              <span class="file-shortcut">Ctrl+N</span>
            </button>
            <button mat-menu-item (click)="goBack()">
              <mat-icon>folder_open</mat-icon>
              <span>Open...</span>
            </button>
            <mat-divider />
            <button mat-menu-item (click)="saveProject()">
              <mat-icon>save</mat-icon>
              <span>Save</span>
              <span class="file-shortcut">Ctrl+S</span>
            </button>
            <button mat-menu-item (click)="fileMakeCopy()">
              <mat-icon>file_copy</mat-icon>
              <span>Make a copy</span>
            </button>
            <mat-divider />
            <button mat-menu-item (click)="openExportDialog()">
              <mat-icon>download</mat-icon>
              <span>Download...</span>
            </button>
            <button mat-menu-item (click)="openShareDialog()">
              <mat-icon>share</mat-icon>
              <span>Share</span>
            </button>
            <button mat-menu-item (click)="publishAsTemplate()">
              <mat-icon>publish</mat-icon>
              <span>Publish as template</span>
            </button>
            <mat-divider />
            <button mat-menu-item (click)="openVersionsDialog()">
              <mat-icon>history</mat-icon>
              <span>Version history</span>
            </button>
            <button mat-menu-item (click)="openResizeDialog()">
              <mat-icon>aspect_ratio</mat-icon>
              <span>Resize canvas</span>
            </button>
            <mat-divider />
            <button mat-menu-item (click)="openShortcutsDialog()">
              <mat-icon>keyboard</mat-icon>
              <span>Keyboard shortcuts</span>
              <span class="file-shortcut">?</span>
            </button>
          </mat-menu>

          <div class="project-info">
            @if (isEditingName()) {
              <input
                class="name-input"
                [ngModel]="editableName()"
                (ngModelChange)="editableName.set($event)"
                (blur)="finishNameEdit()"
                (keydown.enter)="finishNameEdit()"
                (keydown.escape)="cancelNameEdit()"
                #nameInput
              />
            } @else {
              <span class="project-name" (click)="startNameEdit()" matTooltip="Click to rename">
                {{ projectService.currentProject()?.name ?? 'Untitled' }}
                <mat-icon class="edit-icon">edit</mat-icon>
              </span>
            }
            <span class="project-size" matTooltip="Click to resize canvas" (click)="openResizeDialog()">
              {{ canvasService.canvasWidth() }} × {{ canvasService.canvasHeight() }} · Page {{ activePage() + 1 }}/{{ pages().length }}
              <mat-icon class="resize-icon">open_in_full</mat-icon>
            </span>
          </div>
        </div>

        <div class="topbar-center">
          <button mat-icon-button matTooltip="Undo (Ctrl+Z)" (click)="undo()" [disabled]="!historyService.canUndo()">
            <mat-icon>undo</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Redo (Ctrl+Y)" (click)="redo()" [disabled]="!historyService.canRedo()">
            <mat-icon>redo</mat-icon>
          </button>

          <span class="topbar-sep"></span>

          <button mat-icon-button [matTooltip]="canvasService.showGrid() ? 'Hide Grid' : 'Show Grid'" (click)="canvasService.toggleGrid()" [class.active-toggle]="canvasService.showGrid()">
            <mat-icon>grid_on</mat-icon>
          </button>
          <button mat-icon-button [matTooltip]="canvasService.snapToGrid() ? 'Disable Snap' : 'Enable Snap'" (click)="canvasService.toggleSnapToGrid()" [class.active-toggle]="canvasService.snapToGrid()">
            <mat-icon>grid_4x4</mat-icon>
          </button>
          <button mat-icon-button [matTooltip]="canvasService.showThirds() ? 'Hide Rule of Thirds' : 'Show Rule of Thirds'" (click)="toggleThirds()" [class.active-toggle]="canvasService.showThirds() || canvasService.snapToThirds()">
            <mat-icon>view_quilt</mat-icon>
          </button>
          <button mat-icon-button [matTooltip]="canvasService.printMode() ? 'Exit Print Mode' : 'Print Mode (bleed + safe zone)'" (click)="canvasService.togglePrintMode()" [class.active-toggle]="canvasService.printMode()">
            <mat-icon>print</mat-icon>
          </button>
        </div>

        <div class="topbar-right">
          <!-- PX-157: live presence dot. Renders nothing when the collab
               socket is offline; a single pulsing green dot when connected
               (hover for collaborator count). Replaces the floating "Live"
               bar that used to sit on top of the canvas. -->
          <app-collab-status-dot />

          <!-- PX-093: hide/unhide the right properties panel -->
          <button
            mat-icon-button
            class="panels-toggle-btn"
            [class.active-toggle]="panelsHidden()"
            [matTooltip]="panelsHidden() ? 'Show properties panel' : 'Hide properties panel'"
            data-testid="panels-toggle"
            (click)="panelsHidden.update(v => !v)"
          >
            <mat-icon>{{ panelsHidden() ? 'view_sidebar' : 'menu_open' }}</mat-icon>
          </button>

          <span class="topbar-sep"></span>

          <button
            mat-stroked-button
            class="save-btn"
            [class.saving]="projectService.isSaving()"
            [class.saved]="!projectService.isSaving() && projectService.lastSaved()"
            (click)="saveProject()"
            [matTooltip]="saveTooltip()"
          >
            <mat-icon>{{ saveIcon() }}</mat-icon>
            <span class="save-label">{{ saveLabel() }}</span>
          </button>

          <button
            mat-icon-button
            [matTooltip]="commentsService.commentMode() ? 'Exit comment mode' : 'Add comment'"
            [class.active-toggle]="commentsService.commentMode()"
            (click)="commentsService.toggleCommentMode()"
          >
            <mat-icon
              [matBadge]="commentsService.unresolvedCount() || null"
              matBadgeColor="warn"
              matBadgeSize="small"
              aria-hidden="false"
              [attr.aria-label]="commentsService.unresolvedCount() ? commentsService.unresolvedCount() + ' unresolved comments' : 'Comments'"
            >comment</mat-icon>
          </button>

          <button mat-icon-button matTooltip="Version History" (click)="openVersionsDialog()">
            <mat-icon>history</mat-icon>
          </button>

          <button mat-icon-button matTooltip="Share" (click)="openShareDialog()">
            <mat-icon>share</mat-icon>
          </button>

          <button mat-icon-button matTooltip="Publish as public template" (click)="publishAsTemplate()">
            <mat-icon>publish</mat-icon>
          </button>

          @if (qualityScore(); as q) {
            <button
              class="quality-badge"
              [class.grade-a]="q.grade === 'A+' || q.grade === 'A'"
              [class.grade-b]="q.grade === 'B'"
              [class.grade-c]="q.grade === 'C'"
              [class.grade-d]="q.grade === 'D' || q.grade === 'F'"
              [matTooltip]="qualityTooltip()"
              matTooltipPosition="below"
              (click)="openAuditDialog()"
            >
              <span class="q-grade">{{ q.grade }}</span>
              <span class="q-num">{{ q.total }}</span>
            </button>
          }

          <button mat-icon-button matTooltip="Keyboard Shortcuts (?)" (click)="openShortcutsDialog()">
            <mat-icon>keyboard</mat-icon>
          </button>

          <button mat-icon-button matTooltip="Present" (click)="startPresentation()">
            <mat-icon>play_circle</mat-icon>
          </button>

          <button mat-flat-button class="export-btn" (click)="openExportDialog()">
            <mat-icon>download</mat-icon>
            Export
          </button>
        </div>
      </header>

      @if (isProcessing()) {
        <mat-progress-bar mode="indeterminate" class="processing-bar" />
      }

      <!-- Floating text toolbar (shows only when text is selected) -->
      <app-text-toolbar />

      <div class="editor-body">
        <!-- Left Sidebar (Canva-style) -->
        <app-sidebar-drawer
          (addShape)="addShape($event)"
          (addText)="addTextWithOptions($event)"
          (uploadImage)="triggerImageUpload()"
          (removeBg)="removeBackground()"
          (addFrameLayout)="onAddFrameLayout($event)"
        />

        <!-- PX-090: hidden file input that the click-to-fill listener
             on photo-frame placeholders triggers programmatically. -->
        <input
          #frameImageInput
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp,image/gif"
          (change)="onFrameImageFile($event)"
        />

        <!-- Canvas Area -->
          <div
            class="canvas-area"
            #canvasContainer
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (contextmenu)="onContextMenu($event)"
            (mousedown)="onCanvasAreaMouseDown($event)"
            [class.drag-over]="isDragOver()"
          >
            <!-- PX-141 / PX-148 / PX-157 — floating object-verb toolbar.
                 Self-positions above the active selection's bounding rect
                 (or below it when there's no room above). Owns object
                 verbs only — formatting controls live in the docked
                 app-text-toolbar under the editor header. Hides itself
                 when selectionContext() is 'none'. -->
            <app-context-toolbar
              [context]="selectionContext()"
              [locked]="selectionLocked()"
              (toggleLock)="toggleSelectionLock()"
              (duplicateSelected)="duplicateSelection()"
              (deleteSelected)="canvasService.removeActiveObject()"
              (bringToFront)="canvasService.bringActiveToFront()"
              (sendToBack)="canvasService.sendActiveToBack()"
              (alignSelected)="canvasService.alignObjects($event)"
              (removeBackground)="removeBackground()"
              (groupSelected)="canvasService.groupSelected()"
              (ungroupSelected)="canvasService.ungroupSelected()"
            />
            <div class="canvas-stack">
              <div
                class="canvas-wrapper"
                [class.canvas-transparent]="canvasService.backgroundMode() === 'transparent'"
                [class.canvas-focused]="canvasFocused()"
              >
                <canvas
                  #editorCanvas
                  role="img"
                  aria-label="Design canvas. Use the toolbar to add elements. Press question mark for keyboard shortcuts."
                  tabindex="0"
                ></canvas>
                <app-comments-overlay class="canvas-comments-overlay" />

                <!-- Canvas-level quick actions (top-right of canvas) -->
                <div class="canvas-actions">
                  <!-- PX-152 — quick page-background toggle. Same three
                       modes as the sidebar Background tab and the
                       property-panel "Page background" expansion, just
                       always one click away from the canvas itself.
                       Useful especially after Remove Background /
                       Magic Eraser to verify the transparent cut. -->
                  <button
                    mat-icon-button
                    matTooltip="Page background"
                    data-testid="canvas-bg-menu"
                    [matMenuTriggerFor]="canvasBgMenu"
                  >
                    <mat-icon>palette</mat-icon>
                  </button>
                  <mat-menu #canvasBgMenu="matMenu" class="canvas-bg-menu">
                    <button
                      mat-menu-item
                      data-testid="canvas-bg-white"
                      [class.active]="canvasService.backgroundMode() === 'white'"
                      (click)="canvasService.setBackgroundMode('white')"
                    >
                      <mat-icon>format_color_fill</mat-icon>
                      <span>White</span>
                    </button>
                    <button
                      mat-menu-item
                      data-testid="canvas-bg-transparent"
                      [class.active]="canvasService.backgroundMode() === 'transparent'"
                      (click)="canvasService.setBackgroundMode('transparent')"
                    >
                      <mat-icon>grid_on</mat-icon>
                      <span>Transparent</span>
                    </button>
                    <div class="bg-color-row" (click)="$event.stopPropagation()">
                      <input
                        type="color"
                        class="bg-color-input"
                        data-testid="canvas-bg-color"
                        [ngModel]="canvasService.backgroundColor() || '#ffffff'"
                        (ngModelChange)="canvasService.setBackgroundMode('custom', $event)"
                      />
                      <span class="bg-color-label">Color…</span>
                    </div>
                  </mat-menu>

                  <button mat-icon-button [matTooltip]="pageLocked() ? 'Unlock page' : 'Lock page'" (click)="togglePageLock()">
                    <mat-icon>{{ pageLocked() ? 'lock' : 'lock_open' }}</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Duplicate this page" (click)="duplicateCurrentPage()">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Download this page" (click)="openExportDialog()">
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Canva-style "Add page" button directly below canvas -->
              <button class="inline-add-page" (click)="addPage()">
                <mat-icon>add</mat-icon> Add page
              </button>
            </div>

            @if (isDragOver()) {
              <div class="drop-overlay">
                <mat-icon>cloud_upload</mat-icon>
                <p>Drop image here</p>
              </div>
            }
          </div>

        <!-- Right Panel: collapses when nothing is selected (Canva-style),
             or when the user explicitly hid it via the topbar toggle (PX-093). -->
        <div
          class="right-panel"
          [class.collapsed]="panelsHidden() || (!hasSelection() && !layersPinned())"
        >
          @if (hasSelection() && !panelsHidden()) {
            <app-property-panel (removeBackgroundRequested)="removeBackground()" />
            <app-image-filters-panel />
          }
          @if ((hasSelection() || layersPinned()) && !panelsHidden()) {
            <app-layer-panel />
          }
        </div>

        <!-- Properties panel show/hide affordance (PX-093). Visible when
             collapsed-by-toggle so the user can re-open from the canvas edge. -->
        @if (panelsHidden()) {
          <button
            mat-icon-button
            class="panels-edge-toggle"
            matTooltip="Show properties panel"
            data-testid="panels-edge-toggle"
            (click)="panelsHidden.set(false)"
          >
            <mat-icon>chevron_left</mat-icon>
          </button>
        }

        <!-- Layers toggle (always visible, lets user pin layers panel open) -->
        <button
          mat-icon-button
          class="layers-toggle"
          [class.active-toggle]="layersPinned()"
          [matTooltip]="layersPinned() ? 'Hide Layers' : 'Show Layers'"
          (click)="layersPinned.update(v => !v)"
        >
          <mat-icon>layers</mat-icon>
        </button>
      </div>

      <!-- Page Bar (bottom) -->
      <div class="page-bar">
        <!-- Left: Notes + Timer (Canva-style) -->
        <div class="page-bar-left">
          <button mat-button class="pb-btn" [matMenuTriggerFor]="notesMenu">
            <mat-icon>sticky_note_2</mat-icon>
            Notes
            @if (currentPageNotes()) {
              <span class="notes-dot"></span>
            }
          </button>
          <mat-menu #notesMenu="matMenu" class="notes-menu">
            <div class="notes-panel" (click)="$event.stopPropagation()">
              <div class="notes-header">Speaker notes for page {{ activePage() + 1 }}</div>
              <textarea
                class="notes-textarea"
                rows="5"
                placeholder="Add notes for this page..."
                [ngModel]="currentPageNotes()"
                (ngModelChange)="updatePageNotes($event)"
              ></textarea>
            </div>
          </mat-menu>

          <button mat-button class="pb-btn" (click)="toggleTimer()">
            <mat-icon>{{ timerRunning() ? 'pause_circle' : 'timer' }}</mat-icon>
            @if (timerSeconds() > 0) {
              {{ formatTimer(timerSeconds()) }}
            } @else {
              Timer
            }
          </button>
        </div>

        <div class="page-list">
          @for (page of pages(); track page.id; let i = $index) {
            <div
              class="page-thumb"
              [class.active]="activePage() === i"
              (click)="switchToPage(i)"
            >
              @if (page.thumbnail) {
                <img [src]="page.thumbnail" alt="Page {{ i + 1 }}" />
              } @else {
                <div class="page-empty">
                  <span>{{ i + 1 }}</span>
                </div>
              }

              <div class="page-actions">
                <button matTooltip="Duplicate page" (click)="duplicatePageAt($event, i)">
                  <mat-icon>content_copy</mat-icon>
                </button>
                @if (pages().length > 1) {
                  <button matTooltip="Delete page" (click)="deletePageAt($event, i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </div>

              <span class="page-label">{{ i + 1 }}</span>
            </div>
          }
        </div>

        <!-- Right side: Zoom controls (Canva-style) -->
        <div class="page-bar-right">
          <button mat-icon-button matTooltip="Zoom out" (click)="zoomOut()" class="zoom-btn">
            <mat-icon>remove</mat-icon>
          </button>
          <mat-slider class="zoom-slider" min="10" max="500" step="5">
            <input
              matSliderThumb
              [ngModel]="zoomPercent()"
              (ngModelChange)="setZoomPct($event)"
            />
          </mat-slider>
          <button mat-icon-button matTooltip="Zoom in" (click)="zoomIn()" class="zoom-btn">
            <mat-icon>add</mat-icon>
          </button>
          <button mat-button class="zoom-pct" [matMenuTriggerFor]="zoomMenu">
            {{ (canvasService.zoom() * 100).toFixed(0) }}%
          </button>
          <mat-menu #zoomMenu="matMenu">
            <button mat-menu-item (click)="setZoomPct(25)">25%</button>
            <button mat-menu-item (click)="setZoomPct(50)">50%</button>
            <button mat-menu-item (click)="setZoomPct(75)">75%</button>
            <button mat-menu-item (click)="setZoomPct(100)">100%</button>
            <button mat-menu-item (click)="setZoomPct(150)">150%</button>
            <button mat-menu-item (click)="setZoomPct(200)">200%</button>
            <mat-divider />
            <button mat-menu-item (click)="fitToScreen()">
              <mat-icon>fit_screen</mat-icon> Fit to screen
            </button>
            <button mat-menu-item (click)="setZoomPct(100)">
              <mat-icon>zoom_in</mat-icon> Zoom to 100%
            </button>
          </mat-menu>
          <button mat-icon-button matTooltip="Fit to screen" (click)="fitToScreen()" class="zoom-btn">
            <mat-icon>fit_screen</mat-icon>
          </button>
        </div>
      </div>
    </div>

    <app-context-menu #contextMenu />
    <app-command-palette />
    <app-collab-overlay />
    <app-onboarding-tour />
    <app-animation-timeline />
    <app-presentation-mode #presentation [pages]="presentationPages()" />

    <!-- Processing Overlay -->
    @if (isProcessing()) {
      <div class="processing-overlay">
        <div class="processing-card">
          <div class="spinner"></div>
          <h3>Removing Background</h3>
          <p>AI is processing your image...</p>
        </div>
      </div>
    }

    <input
      type="file"
      #fileInput
      accept="image/*,.svg"
      (change)="onImageUpload($event)"
      style="display: none"
    />
  `,
  styles: [`
    .editor-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--mat-sys-surface);
    }

    /* === Top Bar (Canva-style) === */
    .editor-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 16px;
      background: #18181b;
      border-bottom: 1px solid #27272a;
      z-index: 10;
    }

    .file-btn {
      font-size: 0.88rem !important;
      padding: 0 12px !important;
      min-width: auto !important;

      mat-icon {
        margin-right: 4px !important;
        font-size: 18px;
        height: 18px;
        width: 18px;
      }
    }

    ::ng-deep .file-shortcut {
      margin-left: auto;
      padding-left: 16px;
      font-size: 0.72rem;
      opacity: 0.5;
      font-family: monospace;
    }

    .topbar-left, .topbar-center, .topbar-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .home-btn {
      color: #a1a1aa;
      &:hover { color: white; }
    }

    .project-info {
      display: flex;
      flex-direction: column;
      margin-left: 6px;
      border-left: 1px solid #27272a;
      padding-left: 12px;

      .project-name {
        font-size: 0.95rem;
        font-weight: 600;
        line-height: 1.2;
        color: #fafafa;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 4px;
        margin: -2px -6px;
        transition: background 0.15s;

        &:hover {
          background: #27272a;
        }

        .edit-icon {
          font-size: 14px;
          height: 14px;
          width: 14px;
          opacity: 0;
          transition: opacity 0.15s;
        }

        &:hover .edit-icon {
          opacity: 0.5;
        }
      }

      .name-input {
        font-size: 0.95rem;
        font-weight: 600;
        color: #fafafa;
        background: #27272a;
        border: 1px solid var(--mat-sys-primary);
        border-radius: 4px;
        padding: 2px 6px;
        outline: none;
        width: 180px;
      }

      .project-size {
        font-size: 0.72rem;
        color: #71717a;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 4px;
        transition: background 0.15s;

        &:hover {
          background: rgba(255,255,255,0.05);
          color: #a1a1aa;
        }

        .resize-icon {
          font-size: 12px;
          height: 12px;
          width: 12px;
          opacity: 0.5;
        }
      }
    }

    .topbar-sep {
      width: 1px;
      height: 22px;
      background: #27272a;
      margin: 0 8px;
    }

    .active-toggle {
      color: var(--mat-sys-primary) !important;
      background: rgba(124, 58, 237, 0.15);
      border-radius: 8px;
    }

    .zoom-value {
      font-size: 0.82rem;
      min-width: 44px;
      text-align: center;
      color: #a1a1aa;
      font-variant-numeric: tabular-nums;
    }

    .quality-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 14px;
      background: var(--mat-sys-surface-container-high);
      border: 1px solid var(--mat-sys-outline-variant);
      color: inherit;
      cursor: pointer;
      font-size: 0.78rem;
      margin-right: 6px;

      &:hover {
        border-color: var(--mat-sys-primary);
      }

      .q-grade {
        font-weight: 700;
        font-size: 0.85rem;
      }

      .q-num {
        opacity: 0.6;
        font-variant-numeric: tabular-nums;
      }

      &.grade-a { color: #10b981; border-color: rgba(16,185,129,0.4); }
      &.grade-b { color: #3b82f6; border-color: rgba(59,130,246,0.4); }
      &.grade-c { color: #f59e0b; border-color: rgba(245,158,11,0.4); }
      &.grade-d { color: #ef4444; border-color: rgba(239,68,68,0.4); }
    }

    .save-btn {
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }

      .save-label {
        font-variant-numeric: tabular-nums;
      }

      &.saving {
        color: #f59e0b !important;
        border-color: #f59e0b !important;

        mat-icon {
          animation: spin 1s linear infinite;
        }
      }

      &.saved {
        color: #10b981 !important;
        border-color: rgba(16, 185, 129, 0.3) !important;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .export-btn {
      margin-left: 8px;
      border-radius: 8px;
    }

    .processing-bar {
      position: absolute;
      top: 56px;
      left: 0;
      right: 0;
      z-index: 20;
    }

    /* === Editor Body === */
    .editor-body {
      display: flex;
      flex: 1;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
    }

    .canvas-wrapper {
      position: relative;
    }

    .canvas-actions {
      position: absolute;
      top: -44px;
      right: 0;
      display: flex;
      gap: 2px;
      padding: 2px 4px;
      background: var(--mat-sys-surface-container-high);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      z-index: 10;

      button {
        transform: scale(0.8);
      }
    }

    .layers-toggle {
      position: fixed;
      bottom: 140px;
      right: 16px;
      z-index: 90;
      background: var(--mat-sys-surface-container-high) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

      &.active-toggle {
        background: var(--mat-sys-primary) !important;
        color: var(--mat-sys-on-primary) !important;
      }
    }

    .canvas-comments-overlay {
      position: absolute !important;
      inset: 0;
      pointer-events: none;
    }

    /* PX-118 — tablet breakpoint: narrow the right panel but keep it visible
       so designers on iPads / small laptops still have property editing. */
    @media (max-width: 1100px) {
      .right-panel {
        width: 240px;
      }
    }

    /* PX-118 — mobile breakpoint: right panel becomes a slide-over from the
       right edge instead of disappearing entirely (the old behavior left
       designers on tablets unable to edit any object property). The
       sidebar already collapses to a bottom sheet at this width. */
    @media (max-width: 768px) {
      .topbar-center {
        display: none;
      }
      .topbar-right .save-btn {
        display: none;
      }
      .right-panel {
        position: fixed;
        top: 56px;             /* below the topbar */
        right: 0;
        bottom: 56px;          /* above the sidebar bottom rail */
        width: min(320px, 92vw);
        z-index: 90;
        box-shadow: -8px 0 24px rgba(0, 0, 0, 0.45);
        transform: translateX(0);
        transition: transform 0.22s ease;
      }
      .right-panel.collapsed {
        width: min(320px, 92vw) !important;
        transform: translateX(100%);
        border-left: none;
        overflow: hidden;
      }
      .panels-edge-toggle {
        right: 0 !important;
      }
      .page-bar {
        padding: 4px 8px !important;
      }
      .editor-topbar {
        padding: 0 8px !important;
      }
      .project-name {
        font-size: 0.9rem !important;
      }
      .project-size {
        display: none !important;
      }
    }

    @media (max-width: 480px) {
      .home-btn {
        display: none;
      }
      .topbar-right .topbar-icon-btn[matTooltip*="Share"] {
        display: none;
      }
    }

    /* === Canvas Area (Canva-style gray workspace) === */
    .canvas-area {
      flex: 1;
      min-height: 0;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: auto;
      /* Top padding tightened in PX-157 — the docked text toolbar now
         provides the visual separation that the old 40px top padding gave
         the floating toolbar room to land in. */
      padding: 24px 40px 40px;
      background-color: #09090b;

      &.drag-over {
        &::after {
          content: '';
          position: absolute;
          inset: 8px;
          border: 3px dashed var(--mat-sys-primary);
          border-radius: 16px;
          pointer-events: none;
          z-index: 4;
        }
      }
    }

    .canvas-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    /* PX-153 — visual indicator for transparent canvas mode. The
       previous PX-152 checkerboard was too easy to confuse with the
       transparency pattern image viewers show on exported PNGs (users
       reported "the grid is in my exported file" — it wasn't, but the
       pattern looked identical). Now: let the canvas-area's solid
       dark background show through (background:transparent), with a
       faint dashed outline to keep the canvas bounds visible. The
       exported PNG is unaffected either way (CSS on the wrapper never
       leaks into fabric's toDataURL), but this look is unmistakably
       UI chrome — you can't mistake a dark void with a dashed border
       for a "transparency-indicator" pattern in an image. */
    .canvas-wrapper.canvas-transparent {
      background: transparent !important;
      box-shadow: none !important;
      outline: 1px dashed rgba(255, 255, 255, 0.25);
      outline-offset: -1px;
    }
    .canvas-wrapper.canvas-transparent::before {
      content: 'Transparent canvas';
      position: absolute;
      top: -22px;
      left: 0;
      font-size: 0.7rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.4);
      pointer-events: none;
    }

    /* PX-152 — page-bg menu styling. The custom-color row uses a
       native <input type="color"> for the swatch so the user can pick
       any color without leaving the menu. Stop-propagation on the row
       so clicks inside the swatch don't dismiss the menu. */
    ::ng-deep .canvas-bg-menu .mat-mdc-menu-item.active {
      background: rgba(124, 58, 237, 0.08);
      font-weight: 600;
    }
    ::ng-deep .canvas-bg-menu .bg-color-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      cursor: pointer;
    }
    ::ng-deep .canvas-bg-menu .bg-color-input {
      width: 28px;
      height: 28px;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      padding: 0;
      cursor: pointer;
      background: transparent;
    }
    ::ng-deep .canvas-bg-menu .bg-color-label {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface);
    }

    .canvas-wrapper {
      /* Shrink to fit the Fabric canvas inside — otherwise the wrapper's
         shadow/border would stretch to the full flex width and appear
         rectangular even when the design is square. */
      display: inline-block;
      width: fit-content;
      height: fit-content;
      position: relative;
      background: #ffffff;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.06),
        0 4px 16px rgba(0,0,0,0.4),
        0 12px 48px rgba(0,0,0,0.3);
      border-radius: 4px;
      line-height: 0;
      /* Smooth fade so the canvas-as-target ring doesn't snap on/off. */
      transition: outline-color 0.12s ease, outline-offset 0.12s ease;
    }

    /* PX-157 — Canva-style "canvas-as-target" ring. Shown when the user
       clicks the empty canvas (mouse:down with no fabric target). Lives
       outside box-shadow so it sits clear of the existing drop shadow
       and doesn't fight Fabric's selection chrome on objects. */
    .canvas-wrapper.canvas-focused {
      outline: 2px solid var(--px-violet, #7c3aed);
      outline-offset: 4px;
    }
      /* Fabric wraps our <canvas> in a .canvas-container div — make sure
         it's a block and sizes exactly to the backing canvas. */
      ::ng-deep .canvas-container {
        display: block !important;
      }

      canvas {
        display: block;
      }
    }

    .inline-add-page {
      /* Matches canvas width (stretched in column flex) — Canva-style */
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      align-self: stretch;
      padding: 12px 18px;
      background: transparent;
      border: 1px dashed var(--mat-sys-outline-variant);
      border-radius: 8px;
      color: var(--mat-sys-on-surface);
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      opacity: 0.7;
      transition: all 0.15s;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
      }

      &:hover {
        background: var(--mat-sys-surface-container-high);
        border-color: var(--mat-sys-primary);
        color: var(--mat-sys-primary);
        opacity: 1;
      }
    }

    .drop-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 5;
      pointer-events: none;
      backdrop-filter: blur(4px);

      mat-icon {
        font-size: 72px;
        height: 72px;
        width: 72px;
        margin-bottom: 16px;
        opacity: 0.9;
      }

      p {
        font-size: 1.3rem;
        font-weight: 500;
      }
    }

    /* === Right Panel (Canva-style) === */
    .right-panel {
      width: 280px;
      display: flex;
      flex-direction: column;
      background: #18181b;
      border-left: 1px solid #27272a;
      overflow-y: auto;
      transition: width 0.25s ease, border-color 0.25s ease;

      &.collapsed {
        width: 0;
        border-left: none;
        overflow: hidden;
      }

      app-property-panel {
        flex-shrink: 0;
      }

      app-layer-panel {
        flex: 1;
        min-height: 180px;
      }
    }

    /* === Page Bar === */
    .page-bar {
      background: #18181b;
      border-top: 1px solid #27272a;
      padding: 10px 16px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .page-bar-left {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .page-bar-right {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
      margin-left: auto;
    }

    .zoom-btn {
      transform: scale(0.85);
    }

    .zoom-slider {
      width: 140px;
      margin: 0 4px;

      ::ng-deep .mdc-slider__track {
        height: 3px !important;
      }
    }

    .zoom-pct {
      font-size: 0.82rem !important;
      font-variant-numeric: tabular-nums;
      min-width: 52px !important;
      padding: 0 8px !important;
      opacity: 0.85;

      &:hover { opacity: 1; }
    }

    .pb-btn {
      font-size: 0.82rem !important;
      position: relative;

      mat-icon {
        margin-right: 4px !important;
        font-size: 18px;
        height: 18px;
        width: 18px;
      }

      .notes-dot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ef4444;
      }
    }

    ::ng-deep .notes-menu .mat-mdc-menu-content {
      padding: 0 !important;
    }

    ::ng-deep .notes-panel {
      width: 320px;
      padding: 12px;

      .notes-header {
        font-size: 0.78rem;
        font-weight: 600;
        opacity: 0.7;
        margin-bottom: 8px;
      }

      .notes-textarea {
        width: 100%;
        min-height: 100px;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 6px;
        padding: 8px;
        color: inherit;
        font: inherit;
        font-size: 0.85rem;
        outline: none;
        resize: vertical;

        &:focus { border-color: var(--mat-sys-primary); }
      }
    }

    .page-list {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .page-thumb {
      position: relative;
      width: 80px;
      height: 52px;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid #3f3f46;
      background: #27272a;
      flex-shrink: 0;
      transition: border-color 0.15s;

      &:hover {
        border-color: #71717a;
        .page-actions { opacity: 1; }
      }

      &.active {
        border-color: var(--mat-sys-primary);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .page-empty {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #52525b;
        font-size: 0.85rem;
        font-weight: 600;
      }

      .page-actions {
        position: absolute;
        top: 0;
        right: 0;
        display: flex;
        gap: 2px;
        padding: 2px;
        opacity: 0;
        transition: opacity 0.15s;

        button {
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 3px;
          background: rgba(0,0,0,0.7);
          color: white;
          cursor: pointer;
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
      }

      .page-label {
        position: absolute;
        bottom: 2px;
        left: 4px;
        font-size: 0.6rem;
        color: #a1a1aa;
        font-weight: 600;
      }
    }

    .add-page-btn {
      width: 80px;
      height: 52px;
      border-radius: 6px;
      border: 2px dashed #3f3f46;
      background: none;
      color: #71717a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;

      &:hover {
        border-color: var(--mat-sys-primary);
        color: var(--mat-sys-primary);
      }

      mat-icon {
        font-size: 24px;
        height: 24px;
        width: 24px;
      }
    }

    /* === Processing Overlay === */
    .processing-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .processing-card {
      background: var(--mat-sys-surface-container-highest);
      border-radius: 20px;
      padding: 40px 56px;
      text-align: center;
      box-shadow: 0 16px 64px rgba(0,0,0,0.4);

      h3 {
        margin: 20px 0 8px;
        font-size: 1.2rem;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.6;
      }
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--mat-sys-outline-variant);
      border-top-color: var(--mat-sys-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ═══════════════════════════════════════════════════════════════
       PX-072 — editor topbar consistency overrides
       Final selector wins. Brings the editor's chrome into the same
       light/violet palette used by /auth /hub /gallery /profile
       /dashboard. Body (canvas, sidebar, panels) untouched.
       ═══════════════════════════════════════════════════════════════ */

    .editor-topbar {
      height: 60px;
      padding: 0 18px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: saturate(1.4) blur(10px);
      /* PX-157: drop the hairline border under the header — the toolbar
         card immediately below carries its own shadow, and a stacked
         border + shadow read as a double line. The faint box-shadow
         alone keeps just enough separation from the editor body. */
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }

    .home-btn {
      color: var(--px-ink-soft, #334155);
    }
    .home-btn:hover {
      color: var(--px-violet, #7c3aed);
      background: rgba(124, 58, 237, 0.08);
    }

    .file-btn {
      color: var(--px-ink, #0f172a) !important;
      font-weight: 500;
    }
    .file-btn:hover {
      background: rgba(124, 58, 237, 0.08) !important;
      color: var(--px-violet, #7c3aed) !important;
    }
    .file-btn mat-icon { color: inherit; }

    /* Slate divider (replaces #27272a) */
    .topbar-sep {
      width: 1px;
      height: 22px;
      background: var(--px-line, #e2e8f0);
      margin: 0 4px;
      border: none;
    }

    /* Project info block */
    .project-info {
      border-left: 1px solid var(--px-line, #e2e8f0);
    }
    .project-info .project-name {
      color: var(--px-ink, #0f172a);
    }
    .project-info .project-name:hover {
      background: rgba(124, 58, 237, 0.08);
      color: var(--px-violet, #7c3aed);
    }
    .project-info .project-name .edit-icon {
      color: var(--px-muted, #64748b);
    }
    .project-info .project-size {
      color: var(--px-muted, #64748b);
    }
    .project-info .project-size:hover {
      color: var(--px-violet, #7c3aed);
    }
    .name-input {
      color: var(--px-ink, #0f172a);
      background: var(--px-surface, #ffffff);
      border: 1px solid var(--px-violet, #7c3aed);
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 0.95rem;
      font-weight: 600;
      outline: none;
    }

    /* Center-zone icon buttons */
    .topbar-center button.mat-mdc-icon-button,
    .topbar-right button.mat-mdc-icon-button {
      color: var(--px-ink-soft, #334155);
    }
    .topbar-center button.mat-mdc-icon-button:not(:disabled):hover,
    .topbar-right button.mat-mdc-icon-button:not(:disabled):hover {
      background: rgba(124, 58, 237, 0.08);
      color: var(--px-violet, #7c3aed);
    }
    .topbar-center button.mat-mdc-icon-button:disabled,
    .topbar-right button.mat-mdc-icon-button:disabled {
      color: rgba(15, 23, 42, 0.25);
    }

    .active-toggle {
      color: var(--px-violet, #7c3aed) !important;
      background: rgba(124, 58, 237, 0.12) !important;
    }

    /* Save CTA — gradient primary like /hub's "Create design" */
    .save-btn {
      height: 40px !important;
      padding: 0 18px !important;
      background: linear-gradient(135deg, var(--px-violet, #7c3aed) 0%, #a855f7 100%) !important;
      color: #ffffff !important;
      border: none !important;
      border-radius: 10px !important;
      font-weight: 600 !important;
      letter-spacing: 0.005em;
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.28);
      transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
    }
    .save-btn:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(124, 58, 237, 0.36);
      filter: brightness(1.05);
    }
    .save-btn .mdc-button__label,
    .save-btn .save-label {
      color: #ffffff !important;
    }
    .save-btn mat-icon { color: #ffffff !important; }
    .save-btn.saving {
      filter: brightness(0.95);
    }
    .save-btn.saved {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28);
    }

    /* Quality badge — keep semantic colors but soften surface */
    .quality-badge {
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06) !important;
    }

    /* Drop the dark default text color on any leftover topbar children */
    .editor-topbar, .editor-topbar * {
      color: inherit;
    }
    .editor-topbar { color: var(--px-ink, #0f172a); }

    @media (prefers-reduced-motion: reduce) {
      .save-btn, .file-btn, .home-btn { transition: none !important; }
      .save-btn:not(:disabled):hover { transform: none !important; }
    }

    /* PX-093 — properties-panel hide/unhide */
    .panels-edge-toggle {
      position: absolute !important;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      z-index: 30;
      width: 28px !important;
      height: 56px !important;
      min-width: 0 !important;
      padding: 0 !important;
      border-radius: 8px 0 0 8px !important;
      background: var(--px-surface, #ffffff) !important;
      color: var(--px-violet, #7c3aed) !important;
      border: 1px solid var(--px-line, #e2e8f0) !important;
      border-right: none !important;
      box-shadow: -2px 0 8px rgba(15, 23, 42, 0.08);
    }
    .panels-edge-toggle:hover {
      background: rgba(124, 58, 237, 0.08) !important;
    }
    .panels-edge-toggle mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ═══════════════════════════════════════════════════════════════
       PX-076 — editor body retheme
       Same final-selector-wins pattern as PX-068/069/072. Retones
       the canvas workspace + right panel + page bar to the light
       palette without touching fabric.js logic, layer/property
       panel internals, or animation timeline behavior.
       ═══════════════════════════════════════════════════════════════ */

    /* Canvas workspace — Canva-style soft neutral (was #09090b dark) */
    .canvas-area {
      background-color: #f1f5f9 !important;
      background-image:
        radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.06) 1px, transparent 0);
      background-size: 18px 18px;
    }
    .canvas-area.drag-over::after {
      border-color: var(--px-violet, #7c3aed) !important;
    }

    /* Right panel (property + layer) — was #18181b */
    .right-panel {
      background: var(--px-surface, #ffffff) !important;
      border-left: 1px solid var(--px-line, #e2e8f0) !important;
      color: var(--px-ink, #0f172a);
    }

    /* Bottom page bar — was #18181b */
    .page-bar {
      background: rgba(255, 255, 255, 0.92) !important;
      backdrop-filter: saturate(1.4) blur(8px);
      border-top: 1px solid var(--px-line, #e2e8f0) !important;
    }
    .page-bar button.mat-mdc-icon-button {
      color: var(--px-ink-soft, #334155);
    }
    .page-bar button.mat-mdc-icon-button:not(:disabled):hover {
      background: rgba(124, 58, 237, 0.08);
      color: var(--px-violet, #7c3aed);
    }
    .page-bar button.mat-mdc-icon-button:disabled {
      color: rgba(15, 23, 42, 0.25);
    }

    /* Floating canvas-actions toolbar — was zinc bg + heavy black shadow */
    .canvas-actions {
      background: var(--px-surface, #ffffff) !important;
      border: 1px solid var(--px-line, #e2e8f0);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12) !important;
    }

    /* Floating layers-toggle button (mobile/tablet) */
    .layers-toggle {
      background: var(--px-surface, #ffffff) !important;
      color: var(--px-ink-soft, #334155) !important;
      border: 1px solid var(--px-line, #e2e8f0);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.16) !important;
    }
    .layers-toggle.active-toggle {
      background: linear-gradient(135deg, var(--px-violet, #7c3aed) 0%, #a855f7 100%) !important;
      color: #ffffff !important;
      border-color: transparent !important;
    }

    /* Mobile responsive — canvas area can be more compact, plus bottom-pad
       to clear the sidebar bottom rail (PX-118). */
    @media (max-width: 768px) {
      .canvas-area {
        padding: 16px !important;
        padding-bottom: 80px !important;
      }
      .page-bar {
        margin-bottom: 56px;
      }
    }
  `],
})
export class Editor implements AfterViewInit, OnDestroy {
  @ViewChild('editorCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  /** Hidden input wired to the photo-frame click-to-fill flow (PX-090). */
  @ViewChild('frameImageInput') frameImageInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('contextMenu') contextMenu!: ContextMenuComponent;
  @ViewChild('presentation') presentationRef!: PresentationMode;

  readonly isOnline = signal(navigator.onLine);
  readonly hasSelection = signal(false);

  /**
   * PX-141 — kind of the active fabric selection. Drives which verb set
   * the floating context toolbar surfaces above the canvas.
   */
  readonly selectionContext = signal<ContextToolbarContext>('none');

  /**
   * PX-141 / PX-157 — map a fabric active-object instance to one of the
   * supported context kinds. ActiveSelection (multi-select drag-box / shift-
   * click) shows the Group verb; a real fabric.Group shows Ungroup. Photo-
   * frames have their own crop/replace UI (property panel), so they fall
   * back to `'none'` to keep the floating toolbar out of their way.
   */
  private classifySelection(
    obj: fabric.FabricObject | null | undefined,
  ): ContextToolbarContext {
    if (!obj) return 'none';
    if ((obj as any).customType === 'photo-frame') return 'none';
    if (obj instanceof fabric.ActiveSelection) return 'multiple';
    if (obj instanceof fabric.Group) return 'group';
    if (obj instanceof fabric.FabricImage) return 'image';
    if (obj instanceof fabric.IText || obj instanceof fabric.FabricText) return 'text';
    return 'shape';
  }

  /** Active object's lock state — drives the floating toolbar's lock icon. */
  readonly selectionLocked = signal(false);

  /**
   * PX-157 — `true` when the user has clicked the canvas itself with no
   * object underneath (the "canvas-as-target" Canva pattern). Drives the
   * violet outline ring around the canvas-wrapper. Cleared on object
   * selection or when the user clicks anywhere outside the canvas.
   */
  readonly canvasFocused = signal(false);
  readonly layersPinned = signal(false);
  readonly pageLocked = signal(false);
  /**
   * User-driven hide for the right properties panel (PX-093 / PX-157).
   *
   * @remarks
   * Independent of `hasSelection` — when this is `true` the panel
   * stays collapsed even if an object is selected. Defaults to `true`
   * after PX-157 so the editor matches the clean Canva layout out of
   * the box (formatting docked up top, object verbs floating, canvas
   * centered with no right rail). The topbar toggle still lets power
   * users open the panel for fine-grained property edits when needed.
   */
  readonly panelsHidden = signal(true);

  // Per-page notes (ephemeral; persisted in the `pages` array below)
  readonly currentPageNotes = computed(() => this.pages()[this.activePage()]?.notes ?? '');

  /**
   * Replace the notes field on the currently-active page.
   *
   * @param notes - Arbitrary string, shown in the per-page sidebar.
   */
  updatePageNotes(notes: string): void {
    this.pages.update(pages => pages.map((p, i) =>
      i === this.activePage() ? { ...p, notes } : p,
    ));
  }

  // Design timer
  readonly timerRunning = signal(false);
  readonly timerSeconds = signal(0);
  private timerHandle: any = null;

  /** Start/stop the 1Hz design-time timer shown in the sidebar. */
  toggleTimer(): void {
    if (this.timerRunning()) {
      this.timerRunning.set(false);
      if (this.timerHandle) clearInterval(this.timerHandle);
    } else {
      this.timerRunning.set(true);
      this.timerHandle = setInterval(() => {
        this.timerSeconds.update(s => s + 1);
      }, 1000);
    }
  }

  /**
   * Pretty-print a duration for the on-screen timer.
   *
   * @param s - Seconds elapsed.
   * @returns `mm:ss` or `h:mm:ss` for spans ≥ 1h.
   */
  formatTimer(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  /**
   * Lock/unlock every object on the page for movement, rotation, scaling.
   * Preserves individual layer-lock state when unlocking the page.
   */
  togglePageLock(): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;
    const locked = !this.pageLocked();
    this.pageLocked.set(locked);
    canvas.getObjects().forEach(o => {
      if ((o as any)._isGuideline || (o as any)._isGrid) return;
      if (locked) {
        o.set({
          selectable: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hasControls: false,
        });
      } else {
        // When unlocking the page, respect each object's own _locked state so
        // individually-locked objects stay locked.
        const objLocked = !!(o as any)._locked;
        o.set({
          selectable: true,
          evented: true,
          lockMovementX: objLocked,
          lockMovementY: objLocked,
          lockRotation: objLocked,
          lockScalingX: objLocked,
          lockScalingY: objLocked,
          hasControls: !objLocked,
        });
      }
    });
    if (locked) canvas.discardActiveObject();
    canvas.renderAll();
  }

  /** Alias for {@link duplicatePage} used by the page-list toolbar. */
  duplicateCurrentPage(): void {
    this.duplicatePage();
  }

  /**
   * PX-157 — Toggle the lock state of the currently-selected object from
   * the floating context toolbar. Mirrors the per-object lock behavior
   * that used to live on the floating text toolbar before formatting and
   * object verbs were split apart.
   *
   * @remarks
   * Sets the same fabric flags as the page-lock path (`lockMovement*`,
   * `lockScaling*`, etc.) plus `_locked` so the page-lock unlock logic
   * keeps individually-locked objects locked.
   */
  toggleSelectionLock(): void {
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
    this.selectionLocked.set(locked);
    canvas!.requestRenderAll();
    this.canvasService.commitChange(obj);
  }

  /** PX-157 — duplicate the active selection via the existing clipboard
   * service so the floating context toolbar's Duplicate verb mirrors the
   * Ctrl+D shortcut exactly. */
  duplicateSelection(): void {
    this.clipboardService.duplicate();
  }

  /** Navigate back to the dashboard with the "new design" action. */
  fileNew(): void {
    this.router.navigate(['/'], { queryParams: { action: 'new' } });
  }

  /** Duplicate the active project and route to the editor for the copy. */
  fileMakeCopy(): void {
    const current = this.projectService.currentProject();
    if (!current) return;
    const dup = this.projectService.duplicateProject(current.id);
    if (dup) {
      this.router.navigate(['/editor', dup.id]);
    }
  }

  readonly saveLabel = computed(() => {
    if (this.projectService.isSaving()) return 'Saving...';
    if (!this.isOnline()) return 'Offline';
    const last = this.projectService.lastSaved();
    if (!last) return 'Save';
    const secs = Math.floor((Date.now() - new Date(last).getTime()) / 1000);
    if (secs < 5) return 'Saved';
    if (secs < 60) return `Saved ${secs}s ago`;
    if (secs < 3600) return `Saved ${Math.floor(secs / 60)}m ago`;
    return `Saved ${Math.floor(secs / 3600)}h ago`;
  });

  readonly saveIcon = computed(() => {
    if (this.projectService.isSaving()) return 'sync';
    if (!this.isOnline()) return 'cloud_off';
    if (this.projectService.lastSaved()) return 'cloud_done';
    return 'save';
  });

  readonly saveTooltip = computed(() => {
    if (!this.isOnline()) return 'Offline — saved locally, will sync when online';
    if (this.projectService.isSaving()) return 'Syncing to cloud...';
    const last = this.projectService.lastSaved();
    if (last) return `All changes saved · ${new Date(last).toLocaleTimeString()}`;
    return 'Click to save (Ctrl+S)';
  });

  readonly presentationPages = computed(() => {
    return this.pages().map(p => ({
      thumbnail: p.thumbnail,
      canvasJson: p.canvasJson ?? '',
    }));
  });

  readonly canvasService = inject(CanvasService);
  readonly projectService = inject(ProjectService);
  readonly commentsService = inject(CommentsService);
  private readonly collabService = inject(CollaborationService);
  private readonly aiDesignService = inject(AiDesignService);
  private readonly qualityService = inject(QualityScoreService);
  readonly qualityScore = signal<QualityBreakdown | null>(null);

  readonly qualityTooltip = computed(() => {
    const q = this.qualityScore();
    if (!q) return '';
    return q.factors.map(f => `${f.name}: ${f.score}/100 — ${f.detail}`).join('\n');
  });
  readonly historyService = inject(HistoryService);
  private readonly exportService = inject(ExportService);
  private readonly apiService = inject(ApiService);
  private readonly keyboardService = inject(KeyboardService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly bgRemovalService = inject(BackgroundRemovalService);
  private readonly fontService = inject(FontService);
  private readonly templateService = inject(TemplateService);
  private readonly brandKitService = inject(BrandKitService);
  private readonly brandKitApplyService = inject(BrandKitApplyService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly isProcessing = signal(false);
  readonly isDragOver = signal(false);
  readonly isEditingName = signal(false);
  readonly editableName = signal('');

  // Multi-page
  readonly pages = signal<{ id: string; canvasJson: string; thumbnail: string; notes?: string }[]>([]);
  readonly activePage = signal(0);

  private autoSaveTimer: any = null;
  private debounceSaveTimer: any = null;
  private qualityDebounce: any = null;
  private rightClickSub: any = null;
  private shortcutsListener: (() => void) | null = null;
  private startCommentListener: (() => void) | null = null;
  private pasteListener: ((e: ClipboardEvent) => void) | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  /** PX-144: synchronous save flush before refresh / nav-away. */
  private beforeUnloadHandler: (() => void) | null = null;
  /** PX-097: document-level deselect bridge (see ngAfterViewInit). */
  private docDeselectListener: ((e: Event) => void) | null = null;
  /** PX-098: explicit replace-photo handler (see ngAfterViewInit). */
  private frameReplaceListener: (() => void) | null = null;

  /**
   * Handle Ctrl/Cmd + wheel as canvas zoom. Plain scroll is ignored so
   * the surrounding page can scroll normally.
   *
   * @param event - DOM `WheelEvent`.
   */
  @HostListener('window:wheel', ['$event'])
  onMouseWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();

    const currentZoom = this.canvasService.zoom();
    // Smooth zoom steps that feel natural
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.min(Math.max(currentZoom * factor, 0.1), 5);
    this.canvasService.setZoom(newZoom);
  }

  /**
   * Lifecycle: wire up the canvas, load any saved state, subscribe to
   * collab/autosave timers, and prime first-run UX (tour, quality score).
   */
  ngAfterViewInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.projectService.openProject(projectId);
      this.commentsService.setActiveProject(projectId);
      // Connect to collab room after canvas init (delayed)
      setTimeout(() => this.collabService.connect(projectId), 600);
    }

    const project = this.projectService.currentProject();
    const width = project?.width ?? 1000;
    const height = project?.height ?? 1000;

    this.canvasService.initCanvas(this.canvasRef.nativeElement, width, height);

    // PX-090 + PX-098: bind click-to-fill on photo-frame placeholders.
    // Detect a "click" (vs. a drag) by tracking mousedown position and
    // treating any release within a small movement-threshold as a tap.
    // Time-only thresholds were too strict — slow taps got rejected.
    const fabricCanvas = this.canvasService.getCanvas();
    if (fabricCanvas) {
      let downX = 0,
        downY = 0,
        downHadTarget: fabric.FabricObject | null = null;
      // PX-099 Shift+drag-to-pan state. When active, each mouse:move
      // accumulates canvas-pixel deltas and dispatches them to
      // CanvasService.applyFramePanDelta. lockMovementX/Y on the frame
      // disables fabric's normal drag during the pan gesture.
      let panState: {
        frame: fabric.FabricObject;
        lastX: number;
        lastY: number;
      } | null = null;

      fabricCanvas.on(
        'mouse:down',
        (opt: { e?: MouseEvent | TouchEvent; target?: fabric.FabricObject | null }) => {
          const e = opt.e as MouseEvent | undefined;
          downX = e?.clientX ?? 0;
          downY = e?.clientY ?? 0;
          downHadTarget = opt.target ?? null;

          // Engage Shift+drag pan if conditions match.
          const isShift = (e as MouseEvent | undefined)?.shiftKey === true;
          const target = opt.target;
          const isFrame = target && (target as any).customType === 'photo-frame';
          const inCover =
            isFrame &&
            ((target as any).fitMode === 'cover' || !(target as any).fitMode);
          if (isShift && isFrame && inCover && opt.e) {
            // fabric 7 dropped `getPointer` from its TS types; `getScenePoint`
            // is the canvas-coord replacement (same return shape).
            const ptr = fabricCanvas.getScenePoint(opt.e as any);
            panState = { frame: target!, lastX: ptr.x, lastY: ptr.y };
            target!.set({ lockMovementX: true, lockMovementY: true });
          }
        },
      );

      // PX-096 — split combined-angle back into frameAngle when the
      // user drags the rotation handle on a photo-frame. Keeps the
      // clipPath aligned with the slot regardless of photoAngle.
      fabricCanvas.on(
        'object:rotating',
        (opt: { target?: fabric.FabricObject | null }) => {
          if (opt.target && (opt.target as any).customType === 'photo-frame') {
            this.canvasService.syncFrameAngleAfterRotate(opt.target);
          }
        },
      );

      fabricCanvas.on('mouse:move', (opt: { e?: Event }) => {
        if (!panState) return;
        if (!opt.e) return;
        const ptr = fabricCanvas.getScenePoint(opt.e as any);
        const dx = ptr.x - panState.lastX;
        const dy = ptr.y - panState.lastY;
        panState.lastX = ptr.x;
        panState.lastY = ptr.y;
        this.canvasService.applyFramePanDelta(panState.frame, dx, dy);
      });

      fabricCanvas.on(
        'mouse:up',
        (opt: { e?: MouseEvent | TouchEvent; target?: fabric.FabricObject | null }) => {
          // Wind down the pan gesture if active.
          if (panState) {
            panState.frame.set({ lockMovementX: false, lockMovementY: false });
            panState = null;
            return; // Pan release isn't a click — skip click-to-fill.
          }

          const e = opt.e as MouseEvent | undefined;
          const dx = (e?.clientX ?? 0) - downX;
          const dy = (e?.clientY ?? 0) - downY;
          const movedSqr = dx * dx + dy * dy;
          // Click ≠ drag: pixel distance < ~6px is treated as a tap.
          if (movedSqr > 36) return;
          this.maybeOpenFrameFiller(opt.target ?? downHadTarget);
        },
      );
    }

    // PX-097: deselect on clicks outside the canvas + its in-canvas
    // overlays + the floating toolbars + property panel. Fabric only
    // fires selection:cleared for events that hit its own canvas; clicks
    // on the page-bar or sidebar drawer don't reach it, so the floating
    // toolbar would otherwise stay visible after the user has moved on.
    // This document-level listener bridges that gap without making the
    // property-panel itself a deselect surface (users are still allowed
    // to edit the selected object's properties).
    const KEEP_SELECTION_INSIDE = [
      '.canvas-area',
      '.right-panel',
      '.ctx-toolbar',
      // PX-148 — also whitelist the PX-141 floating context toolbar.
      // Without this, clicking Remove Background (or any toolbar verb)
      // would fire the document-level mousedown deselect, clearing the
      // active object before the click handler runs and leaving the
      // verbs unable to act on a selection.
      '.context-toolbar',
      '.canvas-actions',
      '.editor-topbar',
      // PX-129 — sidebar must keep selection so the text-toolbar stays
      // alive while the user clicks "Add a heading" / picks an icon.
      // Without this, mousedown on sidebar discards the active object,
      // selection:cleared fires, text-toolbar selectionType resets to
      // 'none', then click adds new text and re-selects — but the racey
      // ordering on slow devices can land users in the 'none' state.
      'app-sidebar-drawer',
      '.sidebar-wrapper',
      '.drawer-panel',
      '.mat-mdc-menu-panel',
      '.mat-mdc-dialog-container',
      '.mat-mdc-snack-bar-container',
      '.cdk-overlay-pane',
    ].join(',');
    this.docDeselectListener = (e: Event) => {
      const target = e.target as Element | null;
      if (!target || !target.closest) return;
      // PX-149 — any click that lands on (or inside) a button keeps
      // the canvas selection. Buttons outside the canvas are always
      // intended to act on the currently-selected object (Remove
      // Background, font picker, color, layer order, etc.); deselecting
      // before the click handler runs makes them silently no-op.
      // Same intent applies to native form controls.
      if (
        target.closest(
          'button, [role="button"], a, input, textarea, select, label, [matMenuTriggerFor]',
        )
      ) {
        return;
      }
      if (target.closest(KEEP_SELECTION_INSIDE)) return;
      const fc = this.canvasService.getCanvas();
      if (fc?.getActiveObject()) {
        fc.discardActiveObject();
        fc.requestRenderAll();
      }
    };
    document.addEventListener('mousedown', this.docDeselectListener, true);

    // PX-098: explicit "Replace photo" path from the property-panel
    // button. Bypasses the canvas click-to-fill detector entirely so
    // users always have a working replace flow regardless of click
    // sensitivity / drag thresholds. Reads the active object at event
    // time and routes through the same hidden file input.
    this.frameReplaceListener = () => {
      const fc = this.canvasService.getCanvas();
      const active = fc?.getActiveObject();
      if (!active || (active as any).customType !== 'photo-frame') return;
      this.framePendingFill = active;
      this.frameImageInputRef?.nativeElement.click();
    };
    document.addEventListener('pf:request-frame-replace', this.frameReplaceListener);

    // Apply ?platform=<type> query param (Story PX-020 AC-5). The `custom`
    // preset has 0x0 sentinel dimensions — it means "user-defined, no
    // auto-resize", so we skip the resize call in that branch.
    const platformParam = this.route.snapshot.queryParamMap.get('platform');
    if (platformParam) {
      const preset = getPlatformPreset(platformParam);
      if (preset && preset.id !== 'custom' && preset.width > 0 && preset.height > 0) {
        this.canvasService.resize(preset.width, preset.height);
      }
    }

    // Load saved canvas state or apply template
    const templateId = this.route.snapshot.queryParamMap.get('template');

    if (projectId) {
      const savedJson = this.projectService.getCanvasState(projectId);
      if (savedJson) {
        // PX-135 — peel off the multi-page envelope before handing the
        // active page's JSON to fabric. Single-page legacy projects skip
        // this branch; the entire savedJson is the canvas JSON.
        const activeCanvasJson = this.hydrateMultiPageEnvelope(savedJson);
        this.canvasService.loadFromJSON(activeCanvasJson).then(() => {
          this.historyService.init();
          this.fitToScreen();
        });
      } else if (templateId) {
        // New project from template
        this.templateService.applyTemplate(templateId);
        this.historyService.init();
        this.fitToScreen();
      } else {
        // Project may be loading from backend — poll for canvas state.
        // PX-139 — extended from 4.5s (30 attempts) to 15s (100 attempts)
        // because cold-start backend responses + Mongo connect + getProject
        // can comfortably exceed the old window. On final timeout we
        // surface a snackbar instead of leaving an empty canvas with no
        // signal that anything went wrong.
        this.historyService.init();
        this.fitToScreen();
        let attempts = 0;
        const waitForProject = setInterval(() => {
          attempts++;
          const p = this.projectService.currentProject();
          const json = p?.canvasJson;
          if (json) {
            clearInterval(waitForProject);
            this.canvasService.setCanvasSize(p!.width, p!.height);
            // PX-135 — same multi-page hydration as the eager-load path.
            const activeCanvasJson = this.hydrateMultiPageEnvelope(json);
            this.canvasService.loadFromJSON(activeCanvasJson).then(() => this.fitToScreen());
          } else if (attempts > 100) {
            clearInterval(waitForProject);
            this.snackBar.open(
              "Couldn't load this project. Try refreshing or going back to /hub.",
              'OK',
              { duration: 8000 },
            );
          }
        }, 150);
      }
    } else {
      this.historyService.init();
      this.fitToScreen();
    }

    // Consume queued AI design prompt (set by dashboard before navigation)
    const aiPrompt = sessionStorage.getItem('pf_ai_design_prompt');
    if (aiPrompt) {
      sessionStorage.removeItem('pf_ai_design_prompt');
      // Wait for canvas to fully initialize, then generate
      setTimeout(async () => {
        await this.aiDesignService.generate(aiPrompt);
        this.fitToScreen();
        this.historyService.init();
        this.snackBar.open('AI design generated! Edit any element to customize.', 'OK', { duration: 4000 });
      }, 400);
    }

    // PX-060 T-1 — after canvas-load, inspect the project's server-side
    // Brand-Kit auto-apply markers and conditionally show the Undo toast.
    if (projectId) {
      this.maybeShowBrandKitToast(projectId);
    }

    this.keyboardService.init();
    this.fontService.preloadPopularFonts();
    this.initPages();

    // Listen for ? shortcut
    this.shortcutsListener = () => this.openShortcutsDialog();
    window.addEventListener('show-shortcuts', this.shortcutsListener);

    // Listen for "start comment mode" from context menu
    this.startCommentListener = () => this.commentsService.setCommentMode(true);
    window.addEventListener('pf:start-comment-mode', this.startCommentListener);

    // System clipboard paste handler — drop screenshots/images directly onto canvas
    this.pasteListener = (e: ClipboardEvent) => this.handleSystemPaste(e);
    document.addEventListener('paste', this.pasteListener);

    // Online/offline listeners for save indicator
    this.onlineHandler = () => this.isOnline.set(true);
    this.offlineHandler = () => this.isOnline.set(false);
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);

    // PX-144 — final-chance flush on browser unload / mobile pagehide.
    // Even with a 1s debounce, a hot refresh within that window would
    // lose the edit. These handlers cancel the pending debounce timer
    // and call saveProject() synchronously so localStorage is current
    // when the next page load reads it. ngOnDestroy doesn't reliably
    // fire before the browser kills the page on refresh.
    this.beforeUnloadHandler = () => {
      if (this.debounceSaveTimer) {
        clearTimeout(this.debounceSaveTimer);
        this.debounceSaveTimer = null;
      }
      this.saveProject();
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    window.addEventListener('pagehide', this.beforeUnloadHandler);

    // Subscribe to Fabric right-click — more reliable than DOM contextmenu
    // because Fabric captures pointer events on its own upperCanvasEl.
    this.rightClickSub = this.canvasService.rightClick$.subscribe((e) => {
      this.contextMenu.show(e);
    });

    // Track selection so we can collapse right panel when nothing is selected.
    // PX-140 — earlier shape (PX-137) also auto-shrunk oversized images on
    // every selection event, which clobbered user-intended resizes the
    // moment they clicked away and back. The Fit-to-canvas toolbar button
    // (PX-136) is the explicit, user-controlled path; auto-fit-on-selection
    // is gone.
    // PX-141 — additionally classifies the active selection so the floating
    // context toolbar can swap its verb set (image / text / shape / group).
    // PX-145 — also re-syncs on `object:removed` because some deletion
    // paths (right-click → Delete, layer-panel delete, certain
    // programmatic removes) fired the remove event without a paired
    // `selection:cleared`, leaving the toolbar pinned to a stale
    // context. Reading canvas state directly on every event makes the
    // toolbar's visibility derive from one source of truth.
    const fcanvas = this.canvasService.getCanvas();
    if (fcanvas) {
      const syncSel = () => {
        const active = fcanvas.getActiveObject();
        this.hasSelection.set(!!active);
        this.selectionContext.set(this.classifySelection(active));
        this.selectionLocked.set(!!(active as any)?._locked);
        // Selecting an object clears the canvas-itself focus state.
        if (active) this.canvasFocused.set(false);
      };
      fcanvas.on('selection:created', syncSel);
      fcanvas.on('selection:updated', syncSel);
      fcanvas.on('selection:cleared', syncSel);
      fcanvas.on('object:removed', syncSel);

      // PX-157 — Canva-style "canvas as target". A mouse:down with no
      // object underneath promotes the canvas itself to the active
      // selection so canvas-level affordances (background, page color,
      // resize) feel reachable. The violet outline class is the visual
      // signal; it disappears as soon as an object is selected or the
      // user clicks anywhere outside the canvas.
      fcanvas.on('mouse:down', (opt) => {
        const evt = opt.e as MouseEvent | undefined;
        if (evt && evt.button !== 0) return; // only left-click
        if (!opt.target) {
          this.canvasFocused.set(true);
        }
      });
    }

    // Auto-save every 30 seconds
    this.autoSaveTimer = setInterval(() => this.saveProject(), 30000);

    // PX-144 — Debounced auto-save on canvas changes. Was 5000ms, now
    // 1000ms because a 5-second window between edit and persist meant
    // any refresh / navigate-away during that window lost the edit.
    // localStorage write inside saveProject is synchronous, so the
    // perceived "save" is sub-millisecond; the backend HTTP fan-out is
    // already debounced internally by the project service.
    const canvas = this.canvasService.getCanvas();
    if (canvas) {
      const debounceSave = () => {
        if (this.debounceSaveTimer) clearTimeout(this.debounceSaveTimer);
        this.debounceSaveTimer = setTimeout(() => this.saveProject(), 1000);
      };
      canvas.on('object:modified', debounceSave);
      canvas.on('object:added', debounceSave);
      canvas.on('object:removed', debounceSave);

      // Refresh quality score on changes (debounced)
      const refreshQuality = () => {
        if (this.qualityDebounce) clearTimeout(this.qualityDebounce);
        this.qualityDebounce = setTimeout(() => {
          this.qualityScore.set(this.qualityService.calculate());
        }, 400);
      };
      canvas.on('object:modified', refreshQuality);
      canvas.on('object:added', refreshQuality);
      canvas.on('object:removed', refreshQuality);
      // Initial compute
      refreshQuality();
    }
  }

  /**
   * Lifecycle: persist state, tear down every listener/timer registered
   * in {@link ngAfterViewInit}, and release the fabric canvas.
   */
  ngOnDestroy(): void {
    // Save before leaving
    this.saveProject();

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    if (this.debounceSaveTimer) {
      clearTimeout(this.debounceSaveTimer);
    }
    if (this.shortcutsListener) {
      window.removeEventListener('show-shortcuts', this.shortcutsListener);
    }
    if (this.startCommentListener) {
      window.removeEventListener('pf:start-comment-mode', this.startCommentListener);
    }
    if (this.pasteListener) {
      document.removeEventListener('paste', this.pasteListener);
    }
    if (this.onlineHandler) window.removeEventListener('online', this.onlineHandler);
    if (this.offlineHandler) window.removeEventListener('offline', this.offlineHandler);
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      window.removeEventListener('pagehide', this.beforeUnloadHandler);
    }
    if (this.docDeselectListener) {
      document.removeEventListener('mousedown', this.docDeselectListener, true);
    }
    if (this.frameReplaceListener) {
      document.removeEventListener('pf:request-frame-replace', this.frameReplaceListener);
    }
    this.rightClickSub?.unsubscribe();
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.collabService.disconnect();
    this.keyboardService.destroy();
    this.historyService.clear();
    this.canvasService.dispose();
  }

  /** Navigate to the dashboard root. */
  goBack(): void {
    this.router.navigate(['/']);
  }

  // --- Project Name ---

  /** Begin inline-editing the project name in the top bar. */
  startNameEdit(): void {
    this.editableName.set(this.projectService.currentProject()?.name ?? 'Untitled');
    this.isEditingName.set(true);
    setTimeout(() => {
      const input = document.querySelector('.name-input') as HTMLInputElement;
      input?.focus();
      input?.select();
    }, 0);
  }

  /** Commit the inline project-name edit (trimmed, non-empty only). */
  finishNameEdit(): void {
    const newName = this.editableName().trim();
    if (newName && this.projectService.currentProject()) {
      this.projectService.updateProject(this.projectService.currentProject()!.id, { name: newName });
    }
    this.isEditingName.set(false);
  }

  /** Abort the inline project-name edit without saving. */
  cancelNameEdit(): void {
    this.isEditingName.set(false);
  }

  // --- Multi-Page ---

  /** Initialize the multi-page state with a single blank page. */
  initPages(): void {
    if (this.pages().length === 0) {
      this.pages.set([{ id: crypto.randomUUID(), canvasJson: '', thumbnail: '' }]);
      this.activePage.set(0);
    }
  }

  /**
   * Detect a PX-135 multi-page envelope inside a project's stored canvas
   * JSON, restore the `pages` signal + `activePage`, and return the JSON
   * fabric should actually load right now (the active page's canvas JSON).
   *
   * @param savedJson - Whatever ProjectService.getCanvasState handed back.
   * @returns The single canvas JSON to pass to fabric's loadFromJSON.
   *
   * @remarks
   * Single-page projects round-trip exactly as before — the envelope is
   * a NEW shape and old project docs don't carry the `_multiPage` flag,
   * so they fall through to the "this whole string IS the canvas JSON"
   * branch.
   */
  private hydrateMultiPageEnvelope(savedJson: string): string {
    try {
      const parsed = JSON.parse(savedJson);
      if (parsed && parsed._multiPage === true && Array.isArray(parsed.pages)) {
        const pages = parsed.pages.map((p: { id?: string; canvasJson?: string; thumbnail?: string }) => ({
          id: p.id ?? crypto.randomUUID(),
          canvasJson: p.canvasJson ?? '',
          thumbnail: p.thumbnail ?? '',
        }));
        const activeIdx = Math.max(
          0,
          Math.min(typeof parsed.activePage === 'number' ? parsed.activePage : 0, pages.length - 1),
        );
        if (pages.length > 0) {
          this.pages.set(pages);
          this.activePage.set(activeIdx);
          return pages[activeIdx].canvasJson || '';
        }
      }
    } catch {
      /* Not JSON-shaped or not our envelope — fall through to legacy. */
    }
    return savedJson;
  }

  /** Snapshot the active page's canvas JSON + thumbnail into {@link pages}. */
  saveCurrentPageState(): void {
    const json = this.canvasService.getCanvasJSON();
    const thumb = this.canvasService.getThumbnail();
    this.pages.update(p => p.map((page, i) =>
      i === this.activePage() ? { ...page, canvasJson: json, thumbnail: thumb } : page
    ));
  }

  /**
   * Switch to another page; saves the current page first, then loads the
   * target page into the canvas (or resets if the target is blank).
   *
   * @param index - 0-based page index.
   */
  switchToPage(index: number): void {
    if (index === this.activePage() || index < 0 || index >= this.pages().length) return;

    // Save current page
    this.saveCurrentPageState();

    // Load target page
    this.activePage.set(index);
    const page = this.pages()[index];

    if (page.canvasJson) {
      this.canvasService.loadFromJSON(page.canvasJson);
    } else {
      this.canvasService.clearCanvas();
      this.canvasService.setBackgroundMode('white');
    }
  }

  /** Append a fresh page and make it active. */
  addPage(): void {
    this.saveCurrentPageState();
    const newPage = { id: crypto.randomUUID(), canvasJson: '', thumbnail: '' };
    this.pages.update(p => [...p, newPage]);
    this.activePage.set(this.pages().length - 1);
    this.canvasService.clearCanvas();
    this.canvasService.setBackgroundMode('white');
  }

  /** Insert a copy of the active page immediately after it. */
  duplicatePage(): void {
    this.saveCurrentPageState();
    const currentJson = this.canvasService.getCanvasJSON();
    const currentThumb = this.canvasService.getThumbnail();
    const newPage = { id: crypto.randomUUID(), canvasJson: currentJson, thumbnail: currentThumb };
    const idx = this.activePage();
    this.pages.update(p => [...p.slice(0, idx + 1), newPage, ...p.slice(idx + 1)]);
    this.activePage.set(idx + 1);
    // Canvas already has the duplicated content
  }

  /**
   * Delete the page at the given index and load whichever page becomes active.
   *
   * @param index - 0-based page index. Noop if this is the last remaining page.
   */
  deletePage(index: number): void {
    if (this.pages().length <= 1) return; // Can't delete last page

    this.pages.update(p => p.filter((_, i) => i !== index));

    if (this.activePage() >= this.pages().length) {
      this.activePage.set(this.pages().length - 1);
    }

    // Load the now-active page
    const page = this.pages()[this.activePage()];
    if (page.canvasJson) {
      this.canvasService.loadFromJSON(page.canvasJson);
    } else {
      this.canvasService.clearCanvas();
      this.canvasService.setBackgroundMode('white');
    }
  }

  /**
   * Duplicate the given page from a DOM event handler on the page-list.
   *
   * @param event - Originating DOM event; propagation is stopped so the
   * page-list click handler doesn't also fire.
   * @param index - 0-based index of the page to duplicate.
   */
  duplicatePageAt(event: Event, index: number): void {
    event.stopPropagation();
    if (index !== this.activePage()) this.switchToPage(index);
    this.duplicatePage();
  }

  /**
   * Delete the given page from a DOM event handler on the page-list.
   *
   * @param event - Originating DOM event; propagation is stopped.
   * @param index - 0-based index of the page to remove.
   */
  deletePageAt(event: Event, index: number): void {
    event.stopPropagation();
    this.deletePage(index);
  }

  // --- Object Creation ---

  /**
   * Add a shape layer to the canvas (delegates to {@link CanvasService}).
   *
   * @param type - Shape kind.
   */
  addShape(type: ShapeType): void {
    this.canvasService.addShape(type);
  }

  /**
   * Drop a collage layout (N empty photo-frame placeholders) onto the
   * canvas — wired from the sidebar's Frames panel (PX-090).
   *
   * @param preset - The selected {@link FramePreset}.
   */
  onAddFrameLayout(preset: FramePreset): void {
    this.canvasService.addFrameLayout(preset);
  }

  /**
   * Tracks the photo-frame placeholder a click-to-fill flow targeted —
   * set on `mouse:down` over a placeholder, consumed by the file
   * input's `change` handler when the user picks a photo (PX-090 AC-4).
   */
  private framePendingFill: fabric.FabricObject | null = null;

  /**
   * Handle the hidden file input's change event after a photo-frame
   * was clicked. Reads the file as a DataURL and delegates to
   * {@link CanvasService.replaceFrameWithImage}.
   *
   * @param event - The DOM `change` event from `<input #frameImageInput>`.
   */
  onFrameImageFile(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (input) input.value = '';
    if (!file || !this.framePendingFill) return;

    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      this.snackBar.open('Photo must be PNG, JPEG, WebP, or GIF.', 'Dismiss', {
        duration: 3000,
      });
      this.framePendingFill = null;
      return;
    }

    // PX-112 — upload to GridFS-backed asset store first, THEN load via
    // URL. Inlining base64 photos in canvas_json blew past MongoDB's 16MB
    // BSON document limit and silently failed every save.
    const target = this.framePendingFill;
    this.framePendingFill = null;
    if (!target) return;
    const projectId = this.projectService.currentProject()?.id;
    this.apiService.uploadAsset(file, projectId).subscribe({
      next: asset => {
        const url = `${this.apiService.getAssetUrl(asset.id)}`;
        void this.canvasService.replaceFrameWithImage(target, url);
      },
      error: () => {
        this.snackBar.open('Could not upload that photo.', 'Dismiss', {
          duration: 3000,
        });
      },
    });
  }

  /**
   * Hook into fabric's `mouse:down` to detect clicks on photo-frame
   * placeholders / filled frames and route them into the file picker
   * flow (PX-090 AC-4 / AC-6).
   *
   * @param target - The fabric object reported by the canvas event.
   */
  private maybeOpenFrameFiller(target: fabric.FabricObject | null): void {
    if (!target) return;
    if ((target as any).customType !== 'photo-frame') return;
    this.framePendingFill = target;
    this.frameImageInputRef?.nativeElement.click();
  }

  /**
   * Add a text layer with custom typography options.
   *
   * @param opts - Text content + font overrides.
   */
  addTextWithOptions(opts: { text: string; fontSize: number; fontWeight: string; fontFamily?: string }): void {
    // PX-127 — only forward defined fields. Spreading `{ fontFamily: undefined }`
    // into addText's options object would override the 'Roboto' default to
    // undefined, which downstream consumers (export, brand-kit, fabric Text)
    // could choke on when they call `fontFamily.toLowerCase()` on the result.
    const overrides: Record<string, unknown> = {
      fontSize: opts.fontSize,
      fontWeight: opts.fontWeight,
    };
    if (opts.fontFamily) overrides['fontFamily'] = opts.fontFamily;
    this.canvasService.addText(opts.text, overrides as any);
  }

  /** Programmatically open the hidden file picker. */
  triggerImageUpload(): void {
    this.fileInputRef.nativeElement.click();
  }

  /**
   * Handle a file-input change event from the hidden upload input.
   *
   * @param event - DOM `change` event.
   */
  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.loadImageFile(file);
    input.value = '';
  }

  // --- Context Menu ---

  /**
   * Show the custom context menu at the pointer and suppress the native one.
   *
   * @param event - DOM `contextmenu` event.
   */
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    this.contextMenu.show(event);
  }

  /**
   * When the user clicks the canvas background (outside any fabric object
   * and outside the `<canvas>` element itself), deselect the active object
   * so the floating toolbar hides.
   *
   * @param event - DOM `mousedown` event.
   */
  onCanvasAreaMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    // If the click is on the Fabric canvas or one of the overlays/controls,
    // let Fabric handle it — it will fire selection:cleared itself if needed.
    if (target.tagName === 'CANVAS') return;
    if (target.closest('.canvas-wrapper')) return;
    if (target.closest('.canvas-actions')) return;
    if (target.closest('.inline-add-page')) return;
    // PX-150 — the PX-141 floating context toolbar lives INSIDE
    // `.canvas-area` (PX-148 moved it there to pin it via absolute
    // positioning). Without these guards, every click on the toolbar
    // — including its Remove Background / Bold / Delete verbs — fires
    // this handler's discardActiveObject() before the verb's click
    // handler reads the active object, leaving the verbs unable to
    // act on a selection. Also covers any button click (Material or
    // native) inside the canvas-area for the same reason as PX-149.
    if (target.closest('.context-toolbar, .floating-context-toolbar')) return;
    if (
      target.closest(
        'button, [role="button"], a, input, textarea, select, label, [matMenuTriggerFor]',
      )
    ) {
      return;
    }

    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;
    if (canvas.getActiveObject()) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
    // PX-157 — leaving the canvas wrapper drops the canvas-focused ring.
    this.canvasFocused.set(false);
  }

  // --- Drag & Drop ---

  /**
   * React to file drag-over on the canvas area (enables drop affordance).
   *
   * @param event - DOM `dragover` event.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /**
   * Clear the drop affordance when the dragged files leave the canvas area.
   *
   * @param event - DOM `dragleave` event.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /**
   * Handle a file drop: each dropped image is loaded as an image layer.
   *
   * @param event - DOM `drop` event.
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        this.loadImageFile(files[i]);
      }
    }
  }

  // --- Background Removal ---

  /**
   * Run background removal on the currently-selected image.
   *
   * @returns A promise that resolves once the operation settles.
   * @remarks Shows toasts on both success and failure paths.
   */
  async removeBackground(): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj || !(activeObj instanceof fabric.FabricImage)) {
      this.snackBar.open('Please select an image on the canvas first', 'OK', { duration: 3000 });
      return;
    }

    this.isProcessing.set(true);

    // PX-142 — capture at the image's *natural* resolution, not the
    // canvas-fitted display size. fabric's `toDataURL` defaults to
    // `multiplier: 1` which means "rasterize at displayed size", so an
    // image that addImage scaled down to fit a smaller canvas would
    // come back from bg-removal at the down-scaled size and lose pixels
    // when the user then resized it back up. Compensating with
    // `multiplier = 1 / scaleX` recaptures at the underlying bitmap's
    // natural resolution, regardless of any subsequent user resizes.
    // Capped at 8× as a defensive limit against OOM on outlier inputs.
    const sx = activeObj.scaleX ?? 1;
    const naturalMultiplier = sx > 0 ? 1 / sx : 1;
    const dataUrl = activeObj.toDataURL({
      format: 'png',
      multiplier: Math.min(naturalMultiplier, 8),
    });
    const resultUrl = await this.bgRemovalService.removeFromDataURL(dataUrl);

    if (resultUrl) {
      this.canvasService.addImage(resultUrl);
      canvas.remove(activeObj);
      canvas.renderAll();
      this.snackBar.open('Background removed successfully!', 'OK', { duration: 3000 });
    } else {
      this.snackBar.open(this.bgRemovalService.errorMessage() || 'Background removal failed', 'OK', { duration: 5000 });
    }

    this.isProcessing.set(false);
  }

  /** Delete the currently-selected object. */
  deleteSelected(): void {
    this.canvasService.removeActiveObject();
  }

  // --- Zoom ---

  /** Increase zoom by 10% up to the 5× cap. */
  zoomIn(): void {
    this.canvasService.setZoom(Math.min(this.canvasService.zoom() + 0.1, 5));
  }

  /** Decrease zoom by 10% down to the 10% floor. */
  zoomOut(): void {
    this.canvasService.setZoom(Math.max(this.canvasService.zoom() - 0.1, 0.1));
  }

  /**
   * Set zoom as an integer percentage (clamped to [10, 500]).
   *
   * @param pct - Zoom percent, e.g. `100` for 100%.
   */
  setZoomPct(pct: number): void {
    const z = Math.max(0.1, Math.min(5, pct / 100));
    this.canvasService.setZoom(z);
  }

  readonly zoomPercent = computed(() => Math.round(this.canvasService.zoom() * 100));

  /** Compute a zoom that fits the canvas within the container (≤ 1×). */
  fitToScreen(): void {
    const container = this.containerRef?.nativeElement;
    if (!container) return;

    const zoom = Math.min(
      (container.clientWidth - 64) / this.canvasService.canvasWidth(),
      (container.clientHeight - 64) / this.canvasService.canvasHeight(),
      1,
    );
    this.canvasService.setZoom(zoom);
  }

  // --- Save ---

  /**
   * Global keydown handler — currently only Ctrl/Cmd+S hooks `saveProject`.
   *
   * @param event - DOM `keydown` event.
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.saveProject();
    }
  }

  /**
   * Persist the project's canvas state via {@link ProjectService.saveCanvasState}.
   * Noop without an active project.
   *
   * @remarks
   * PX-135 — multi-page projects round-trip ALL pages, not just the
   * active one. Single-page projects fall through to the legacy single-
   * canvas serializer so old project documents stay byte-compatible:
   *
   * - 1 page → canvas_json = the page's canvas JSON (legacy shape).
   * - 2+ pages → canvas_json = `{ "_multiPage": true, "version": 1,
   *   "activePage": N, "pages": [{ id, canvasJson, thumbnail }, ...] }`.
   *
   * The thumbnail saved alongside is always the active page's, since
   * the hub's recent-projects strip shows one image per project.
   */
  saveProject(): void {
    const project = this.projectService.currentProject();
    if (!project) return;

    // Save current page state first so pages[activePage] is fresh.
    this.saveCurrentPageState();

    const allPages = this.pages();
    const thumbnail = this.canvasService.getThumbnail();

    let canvasJson: string;
    if (allPages.length <= 1) {
      // Legacy single-page envelope.
      canvasJson = this.canvasService.getCanvasJSON();
    } else {
      // PX-135 — multi-page envelope.
      canvasJson = JSON.stringify({
        _multiPage: true,
        version: 1,
        activePage: this.activePage(),
        pages: allPages.map(p => ({
          id: p.id,
          canvasJson: p.canvasJson ?? '',
          thumbnail: p.thumbnail ?? '',
        })),
      });
    }

    // PX-146 — guard against teardown / mid-load races that briefly
    // produce an empty canvas snapshot. If the new state is empty AND
    // the existing saved project has content, refuse the save. This
    // prevents the "edited image, refresh, canvas is empty" failure
    // mode where a transient empty getCanvasJSON destroyed real work.
    // Intentional "delete everything" still persists because that
    // path goes through user-driven object:removed → autosave with a
    // fully stable (just empty-of-objects) canvas; the guard kicks in
    // only when our prior saved state was non-empty AND the new
    // snapshot is empty in a way that suggests a torn-down canvas.
    if (
      this.isEffectivelyEmpty(canvasJson) &&
      !this.isEffectivelyEmpty(project.canvasJson)
    ) {
      console.warn(
        '[saveProject] refusing to overwrite non-empty saved state with empty snapshot',
      );
      return;
    }

    // Silent save — the save-button pill in the topbar reflects sync state
    // ("Saving..." / "Saved Xs ago" / "Offline"), so no snackbar needed.
    this.projectService.saveCanvasState(project.id, canvasJson, thumbnail);
  }

  /**
   * PX-146 — true when the given canvasJson string represents a canvas
   * with no objects. Handles both the legacy single-page shape
   * (`{"version":"7","objects":[]}`) and the PX-135 multi-page envelope
   * (every page's canvasJson is itself empty). Defensive against
   * unparseable / nullish inputs (treats them as empty).
   */
  private isEffectivelyEmpty(json: string | null | undefined): boolean {
    if (!json || json === '' || json === '{}') return true;
    try {
      const parsed = JSON.parse(json);
      if (parsed?._multiPage && Array.isArray(parsed.pages)) {
        return parsed.pages.every((p: { canvasJson?: string }) =>
          this.isEffectivelyEmpty(p.canvasJson),
        );
      }
      return !Array.isArray(parsed.objects) || parsed.objects.length === 0;
    } catch {
      // Unknown shape — be safe and treat as non-empty so we don't
      // refuse a legitimate save.
      return false;
    }
  }

  // --- History ---

  /** Undo the last history step. */
  undo(): void { this.historyService.undo(); }
  /** Redo the last undone history step. */
  redo(): void { this.historyService.redo(); }

  // --- Export ---

  /** Open the Export dialog, seeded with every page's canvas JSON. */
  openExportDialog(): void {
    // Save current page so it's up-to-date in pages array
    this.saveCurrentPageState();

    const ref = this.dialog.open(ExportDialog, {
      width: '500px',
      panelClass: 'export-dialog-container',
    });

    ref.afterOpened().subscribe(() => {
      ref.componentInstance.setPagesData(
        this.pages().map(p => ({ canvasJson: p.canvasJson ?? '' })),
        this.canvasService.getCanvasJSON(),
      );
    });
  }

  /** Open the keyboard shortcuts help dialog. */
  openShortcutsDialog(): void {
    this.dialog.open(ShortcutsDialog, {
      width: '600px',
    });
  }

  /** Open the accessibility / design audit dialog. */
  openAuditDialog(): void {
    this.dialog.open(AuditDialog, {
      width: '640px',
    });
  }

  /**
   * Prompt for metadata and publish the current project as a public template.
   * Silent-fails without an active project (toast-only).
   */
  publishAsTemplate(): void {
    const project = this.projectService.currentProject();
    if (!project) {
      this.snackBar.open('Save the project first', 'OK', { duration: 2000 });
      return;
    }
    const name = prompt('Template name:', project.name);
    if (!name) return;
    const category = prompt('Category (Logo, Social, Marketing, Print, Other):', 'Other') || 'Other';
    const description = prompt('Short description (optional):', '') || undefined;

    this.saveCurrentPageState();
    const json = this.canvasService.getCanvasJSON();
    const thumb = this.canvasService.getThumbnail();

    this.apiService.publishTemplate({
      name,
      category,
      description,
      canvas_json: json,
      thumbnail: thumb,
      width: this.canvasService.canvasWidth(),
      height: this.canvasService.canvasHeight(),
    }).subscribe({
      next: () => this.snackBar.open('Template published to public gallery!', 'OK', { duration: 3000 }),
      error: (err) => {
        const msg = err?.error?.detail || 'Failed to publish — are you logged in?';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      },
    });
  }

  /** Open the canvas-resize dialog. */
  openResizeDialog(): void {
    this.dialog.open(ResizeDialog, {
      width: '560px',
    });
  }

  /** Persist the active page and enter full-screen presentation mode. */
  startPresentation(): void {
    // Update current page thumbnail before presenting
    this.saveCurrentPageState();
    setTimeout(() => {
      this.presentationRef?.start(this.activePage());
    }, 50);
  }

  /** Toggle both the visual rule-of-thirds overlay and its snapping. */
  toggleThirds(): void {
    // Toggle both showing and snapping in one click
    this.canvasService.toggleShowThirds();
    this.canvasService.toggleSnapToThirds();
  }

  /** Open the project-sharing dialog (noop without an active project). */
  openShareDialog(): void {
    const projectId = this.projectService.currentProject()?.id;
    if (!projectId) return;
    this.dialog.open(ShareDialog, {
      width: '520px',
      data: { projectId },
    });
  }

  /**
   * Save the project, then open the version-history dialog so the newest
   * snapshot is visible (noop without an active project).
   */
  openVersionsDialog(): void {
    const projectId = this.projectService.currentProject()?.id;
    if (!projectId) return;
    // Save before opening so the current state can be snapshotted
    this.saveProject();
    this.dialog.open(VersionsDialog, {
      width: '660px',
      data: { projectId },
    });
  }

  // --- Helpers ---

  private handleSystemPaste(event: ClipboardEvent): void {
    // Skip if user is typing in an input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Skip if a fabric text object is being edited
    const activeObj = this.canvasService.getCanvas()?.getActiveObject();
    if (activeObj && 'isEditing' in activeObj && (activeObj as any).isEditing) {
      return;
    }

    const items = event.clipboardData?.items;
    if (!items) return;

    let handled = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Image data (screenshots, copied images)
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          this.loadImageFile(file);
          this.snackBar.open('Image pasted from clipboard', 'OK', { duration: 2000 });
          handled = true;
        }
        break;
      }
    }

    // Fall back to text paste only when nothing is selected on canvas
    if (!handled) {
      const text = event.clipboardData?.getData('text');
      if (text && text.length < 2000 && !this.canvasService.getCanvas()?.getActiveObject()) {
        event.preventDefault();
        this.canvasService.addText(text);
        this.snackBar.open('Text pasted from clipboard', 'OK', { duration: 2000 });
      }
    }
  }

  private loadImageFile(file: File): void {
    const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.canvasService.addSvg(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      // PX-112 — route through the asset upload endpoint so the canvas JSON
      // holds a URL instead of inline base64 (MongoDB 16MB doc limit).
      const projectId = this.projectService.currentProject()?.id;
      this.apiService.uploadAsset(file, projectId).subscribe({
        next: asset => this.canvasService.addImage(this.apiService.getAssetUrl(asset.id)),
        error: () => this.snackBar.open('Could not upload that image.', 'Dismiss', { duration: 3000 }),
      });
    }
  }

  private dataURLToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const byteString = atob(parts[1]);
    const uint8Array = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([uint8Array], { type: mime });
  }

  /**
   * Show the Brand-Kit auto-apply "Undo" toast when all preconditions pass.
   *
   * @param projectId - The project being opened.
   * @returns Nothing — the toast fires asynchronously after the backend
   *   `getProject` response. Silent no-op in every miss branch.
   *
   * @remarks
   * Preconditions (ALL must hold, per PX-060 AC-1 / AC-4 / AC-5):
   *   1. Backend returns a project whose `source_template_id` is non-null.
   *   2. The user's Brand Kit has at least one color.
   *   3. `brand_kit_applied_at` is within {@link BRAND_KIT_APPLIED_FRESHNESS_MS}
   *      (fresh load — 30 minutes).
   *   4. The toast has NOT already been shown for this project in this
   *      session ({@link TOAST_SHOWN_PROJECT_IDS}).
   *
   * The toast uses {@link MatSnackBar} with a 7-second duration, an "Undo"
   * action, and `aria-live="polite"` semantics (the default MatSnackBar
   * announces as `role="status"` which maps to `polite`). Clicking Undo
   * delegates to {@link BrandKitApplyService.revertToTemplateDefaults}.
   *
   * All long-lived observables (`getProject`, `onAction`, `afterDismissed`)
   * are piped through {@link takeUntilDestroyed} so they tear down cleanly
   * when the `Editor` component is destroyed (Angular 21 zoneless-safe).
   *
   * Regardless of how the toast dismisses (user Undo, swipe, or 7s
   * timeout) the `brand_kit_applied_at` marker is cleared server-side via
   * {@link BrandKitApplyService.clearMarker} — this makes AC-4
   * (at-most-once-per-project-open) self-enforcing even across sessions.
   *
   * @see Story PX-060 — Orion decisions D1/D2/D3 (2026-04-24T17:50Z).
   */
  private maybeShowBrandKitToast(projectId: string): void {
    // WHY: guard against re-firing in the same session even before the
    // server round-trip begins.
    if (TOAST_SHOWN_PROJECT_IDS.has(projectId)) return;

    this.apiService
      .getProject(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          const sourceTemplateId = project.source_template_id;
          const appliedAt = project.brand_kit_applied_at;
          const platform = project.platform as PlatformType | null | undefined;
          if (!sourceTemplateId || !appliedAt) return;
          if (this.brandKitService.brandColors().length === 0) return;

          const appliedMs = new Date(appliedAt).getTime();
          if (Number.isNaN(appliedMs)) return;
          if (Date.now() - appliedMs > BRAND_KIT_APPLIED_FRESHNESS_MS) return;

          TOAST_SHOWN_PROJECT_IDS.add(projectId);

          const ref = this.snackBar.open(
            'Applied your Brand Kit colors to this template',
            'Undo',
            {
              duration: 7000,
              politeness: 'polite',
            },
          );
          ref
            .onAction()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              if (platform) {
                void this.brandKitApplyService.revertToTemplateDefaults(
                  projectId,
                  sourceTemplateId,
                  platform,
                );
              }
            });
          // AC-4 self-enforcement: clear the server-side marker on ANY
          // dismissal path (action, swipe, 7s timeout). Undo also clears
          // via revertToTemplateDefaults, so the double-clear is a no-op.
          ref
            .afterDismissed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              void this.brandKitApplyService.clearMarker(projectId);
            });
        },
        error: () => {
          // WHY: network failure should not break the editor — the toast is
          // a courtesy UX.
        },
      });
  }
}
