import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CanvasService } from '../../../core/services/canvas.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import * as fabric from 'fabric';

interface MenuItem {
  label: string;
  icon: string;
  action: string;
  shortcut?: string;
  dividerAfter?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-context-menu',
  imports: [MatIconModule, MatDividerModule],
  template: `
    @if (visible()) {
      <div
        class="context-menu"
        [style.left.px]="posX()"
        [style.top.px]="posY()"
      >
        @for (item of menuItems(); track item.label) {
          <button
            class="menu-item"
            [class.disabled]="item.disabled"
            (click)="onAction(item.action)"
          >
            <mat-icon>{{ item.icon }}</mat-icon>
            <span class="item-label">{{ item.label }}</span>
            @if (item.shortcut) {
              <span class="item-shortcut">{{ item.shortcut }}</span>
            }
          </button>
          @if (item.dividerAfter) {
            <mat-divider />
          }
        }
      </div>
    }
  `,
  styles: [`
    .context-menu {
      position: fixed;
      z-index: 1000;
      background: #1e1e22;
      border: 1px solid #3f3f46;
      border-radius: 10px;
      padding: 6px 0;
      min-width: 220px;
      max-height: calc(100vh - 16px);
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      animation: fadeIn 0.1s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 16px;
      border: none;
      background: none;
      color: #e4e4e7;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.1s;
      text-align: left;

      mat-icon {
        font-size: 18px;
        height: 18px;
        width: 18px;
        opacity: 0.6;
      }

      .item-label { flex: 1; }

      .item-shortcut {
        font-size: 0.72rem;
        color: #71717a;
        font-family: monospace;
      }

      &:hover {
        background: #27272a;
      }

      &.disabled {
        opacity: 0.35;
        pointer-events: none;
      }
    }

    mat-divider {
      margin: 4px 0;
      border-color: #27272a;
    }
  `],
})
export class ContextMenuComponent {
  private readonly canvasService = inject(CanvasService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly elRef = inject(ElementRef);

  /** Sample dominant colors from an image and apply them to shapes on the page. */
  private applyImageColorsToPage(image: fabric.FabricImage, canvas: fabric.Canvas): void {
    const srcEl = image.getElement() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!srcEl) return;

    const tmp = document.createElement('canvas');
    tmp.width = 120;
    tmp.height = 120;
    const ctx = tmp.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(srcEl as any, 0, 0, 120, 120);
    const data = ctx.getImageData(0, 0, 120, 120).data;

    // Bucket colors by quantizing
    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 200) continue;
      const key = `${Math.round(r/48)*48},${Math.round(g/48)*48},${Math.round(b/48)*48}`;
      const e = buckets.get(key);
      if (e) { e.r += r; e.g += g; e.b += b; e.n++; }
      else buckets.set(key, { r, g, b, n: 1 });
    }
    const palette = Array.from(buckets.values())
      .sort((a, b) => b.n - a.n)
      .slice(0, 5)
      .map(e => '#' + [Math.round(e.r/e.n), Math.round(e.g/e.n), Math.round(e.b/e.n)].map(v => v.toString(16).padStart(2, '0')).join(''));

    if (palette.length === 0) return;

    // Apply: shapes get primary colors in rotation, text stays
    let i = 0;
    canvas.getObjects().forEach(o => {
      if (o === image) return;
      if ((o as any)._isGuideline || (o as any)._isGrid) return;
      if (o instanceof fabric.IText || o instanceof fabric.FabricText) return;
      if (o instanceof fabric.FabricImage) return;
      o.set('fill', palette[i % palette.length]);
      i++;
    });
    canvas.renderAll();
  }

  readonly visible = signal(false);
  readonly posX = signal(0);
  readonly posY = signal(0);
  readonly menuItems = signal<MenuItem[]>([]);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.visible()) return;
    // Ignore clicks inside our own menu so action buttons still work
    const menuEl = this.elRef.nativeElement.querySelector('.context-menu') as HTMLElement | null;
    if (menuEl && menuEl.contains(event.target as Node)) return;
    this.visible.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) this.visible.set(false);
  }

  show(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    // If right-click happened over an object, make it active first so the menu
    // reflects the clicked object's state.
    const pointer = canvas.getViewportPoint(event);
    const clickedObj = canvas.getObjects().find(o => {
      if ((o as any)._isGuideline || (o as any)._isGrid) return false;
      return o.containsPoint(pointer);
    });
    if (clickedObj && canvas.getActiveObject() !== clickedObj) {
      canvas.setActiveObject(clickedObj);
      canvas.requestRenderAll();
    }

    const active = canvas.getActiveObject();
    const hasSelection = !!active;
    const isLocked = hasSelection && (active as any)?._locked;

    const isHidden = hasSelection && active?.visible === false;
    const isMultiSelection = active instanceof fabric.ActiveSelection;
    const isGroup = active instanceof fabric.Group && !isMultiSelection;
    const isImage = active instanceof fabric.FabricImage;
    const hasStyle = this.clipboardService.hasStyle();

    // PX-100/102: photo-frame quick actions sit at the top so they're
    // the first thing the user sees when right-clicking a frame.
    // Regular images also get a "Make photo frame" promote action — both
    // for recovery of pre-PX-101 saves whose customType was stripped
    // and for intentionally converting any imported image into a frame.
    const isPhotoFrame = hasSelection && (active as any)?.customType === 'photo-frame';
    const isPlainImage =
      hasSelection &&
      isImage &&
      (active as any)?.customType !== 'photo-frame';

    const frameItems: MenuItem[] = isPhotoFrame
      ? [
          {
            label: 'Replace photo',
            icon: 'swap_horiz',
            action: 'frame-replace',
            disabled: false,
          },
          {
            label: 'Reset crop & zoom',
            icon: 'restart_alt',
            action: 'frame-reset-view',
            disabled: (active as any).fitMode !== 'cover',
            dividerAfter: true,
          },
        ]
      : isPlainImage
        ? [
            {
              label: 'Make photo frame',
              icon: 'collections',
              action: 'image-to-frame',
              disabled: false,
              dividerAfter: true,
            },
          ]
        : [];

    const items: MenuItem[] = [
      ...frameItems,
      // Clipboard
      { label: 'Copy', icon: 'content_copy', action: 'copy', shortcut: 'Ctrl+C', disabled: !hasSelection },
      { label: 'Copy style', icon: 'palette', action: 'copy-style', shortcut: 'Ctrl+Alt+C', disabled: !hasSelection },
      { label: 'Paste', icon: 'content_paste', action: 'paste', shortcut: 'Ctrl+V', disabled: !this.clipboardService.hasContent() },
      { label: 'Paste style', icon: 'colorize', action: 'paste-style', shortcut: 'Ctrl+Alt+V', disabled: !hasSelection || !hasStyle },
      { label: 'Duplicate', icon: 'copy_all', action: 'duplicate', shortcut: 'Ctrl+D', disabled: !hasSelection },
      { label: 'Delete', icon: 'delete', action: 'delete', shortcut: 'DELETE', disabled: !hasSelection, dividerAfter: true },

      // Layer (Canva "Layer >" sub items flattened with section)
      { label: 'Bring to front', icon: 'flip_to_front', action: 'bring-front', disabled: !hasSelection },
      { label: 'Bring forward', icon: 'arrow_upward', action: 'bring-forward', disabled: !hasSelection },
      { label: 'Send backward', icon: 'arrow_downward', action: 'send-backward', disabled: !hasSelection },
      { label: 'Send to back', icon: 'flip_to_back', action: 'send-back', disabled: !hasSelection, dividerAfter: true },

      // Transform
      { label: 'Flip horizontal', icon: 'swap_horiz', action: 'flip-h', disabled: !hasSelection },
      { label: 'Flip vertical', icon: 'swap_vert', action: 'flip-v', disabled: !hasSelection },
      { label: 'Rotate 90° CW', icon: 'rotate_right', action: 'rotate-cw', disabled: !hasSelection },
      { label: 'Rotate 90° CCW', icon: 'rotate_left', action: 'rotate-ccw', disabled: !hasSelection, dividerAfter: true },

      // Align to page (flat — single-click variants)
      { label: 'Align to center', icon: 'center_focus_strong', action: 'align-page-center', disabled: !hasSelection },
      { label: 'Align to left', icon: 'align_horizontal_left', action: 'align-page-left', disabled: !hasSelection },
      { label: 'Align to right', icon: 'align_horizontal_right', action: 'align-page-right', disabled: !hasSelection },
      { label: 'Align to top', icon: 'align_vertical_top', action: 'align-page-top', disabled: !hasSelection },
      { label: 'Align to bottom', icon: 'align_vertical_bottom', action: 'align-page-bottom', disabled: !hasSelection, dividerAfter: true },
    ];

    // Space evenly (multi-selection only)
    if (isMultiSelection) {
      items.push(
        { label: 'Space evenly horizontally', icon: 'horizontal_distribute', action: 'distribute-h', disabled: false },
        { label: 'Space evenly vertically', icon: 'vertical_distribute', action: 'distribute-v', disabled: false, dividerAfter: true },
      );
    }

    // Grouping + visibility + lock
    items.push(
      { label: isMultiSelection ? 'Group' : (isGroup ? 'Ungroup' : 'Group'),
        icon: isGroup ? 'workspaces' : 'group_work',
        action: isGroup ? 'ungroup' : 'group',
        shortcut: isGroup ? 'Ctrl+Shift+G' : 'Ctrl+G',
        disabled: !hasSelection || (!isMultiSelection && !isGroup) },
      { label: isHidden ? 'Show' : 'Hide', icon: isHidden ? 'visibility' : 'visibility_off', action: 'toggle-visibility', disabled: !hasSelection },
      { label: isLocked ? 'Unlock' : 'Lock', icon: isLocked ? 'lock_open' : 'lock', action: 'toggle-lock', shortcut: 'Alt+Shift+L', disabled: !hasSelection, dividerAfter: true },

      // Canva-style extras
      { label: 'Add comment', icon: 'comment', action: 'add-comment', shortcut: 'Ctrl+Alt+N', disabled: !hasSelection },
      { label: 'Add link', icon: 'link', action: 'add-link', shortcut: 'Ctrl+K', disabled: !hasSelection },
      { label: 'Alternative text', icon: 'accessibility_new', action: 'alt-text', disabled: !hasSelection },
    );

    // Image-specific (Canva: Set as background, Apply colours to page)
    if (isImage) {
      items.push(
        { label: 'Set image as background', icon: 'wallpaper', action: 'image-as-bg', disabled: false },
        { label: 'Apply colours to page', icon: 'palette', action: 'apply-colors', disabled: false },
      );
    }

    this.menuItems.set(items);

    // PX-106: estimate menu height from item + divider counts so a long
    // frame menu (image actions + clipboard + layer + transform + align +
    // visibility/lock + comment/link/alt-text + image extras → up to 17+
    // items) doesn't get clipped at the bottom of the viewport.
    const ITEM_PX = 38;
    const DIVIDER_PX = 9;
    const PADDING_PX = 16;
    const dividerCount = items.filter(it => it.dividerAfter).length;
    const estHeight = items.length * ITEM_PX + dividerCount * DIVIDER_PX + PADDING_PX;

    const MENU_W = 240;
    const SAFE = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default origin = the click point. Flip leftward / upward when the
    // menu would overflow the right or bottom edges.
    let x = event.clientX;
    let y = event.clientY;
    if (x + MENU_W + SAFE > vw) x = Math.max(SAFE, vw - MENU_W - SAFE);
    if (y + estHeight + SAFE > vh) y = Math.max(SAFE, vh - estHeight - SAFE);

    this.posX.set(x);
    this.posY.set(y);

    // Delay showing so the document click handler doesn't immediately close it
    setTimeout(() => this.visible.set(true), 0);
  }

  onAction(action: string): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const active = canvas.getActiveObject();

    switch (action) {
      // PX-100 — photo-frame quick actions
      case 'frame-replace':
        // Same path as the property-panel button: editor host listens
        // for this CustomEvent on document and triggers the hidden
        // file input.
        document.dispatchEvent(new CustomEvent('pf:request-frame-replace'));
        break;
      case 'frame-reset-view':
        if (active && (active as any).customType === 'photo-frame') {
          this.canvasService.setFrameView(active, 0, 0, 1);
        }
        break;
      case 'image-to-frame':
        if (active) {
          this.canvasService.convertImageToFrame(active);
        }
        break;
      case 'copy':
        this.clipboardService.copy();
        break;
      case 'paste':
        this.clipboardService.paste();
        break;
      case 'duplicate':
        this.clipboardService.duplicate();
        break;

      case 'bring-front':
        if (active) { canvas.bringObjectToFront(active); this.canvasService.commitChange(active); }
        break;
      case 'bring-forward':
        if (active) { canvas.bringObjectForward(active); this.canvasService.commitChange(active); }
        break;
      case 'send-backward':
        if (active) { canvas.sendObjectBackwards(active); this.canvasService.commitChange(active); }
        break;
      case 'send-back':
        if (active) { canvas.sendObjectToBack(active); this.canvasService.commitChange(active); }
        break;

      case 'flip-h':
        if (active) {
          active.set('flipX', !active.flipX);
          this.canvasService.commitChange(active);
        }
        break;
      case 'flip-v':
        if (active) {
          active.set('flipY', !active.flipY);
          this.canvasService.commitChange(active);
        }
        break;
      case 'rotate-cw':
        if (active) {
          active.rotate((active.angle ?? 0) + 90);
          active.setCoords();
          this.canvasService.commitChange(active);
        }
        break;
      case 'rotate-ccw':
        if (active) {
          active.rotate((active.angle ?? 0) - 90);
          active.setCoords();
          this.canvasService.commitChange(active);
        }
        break;

      case 'toggle-lock':
        if (active) {
          const locked = !(active as any)._locked;
          (active as any)._locked = locked;
          // Keep selectable/evented so the user can re-click to unlock.
          active.set({
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
          canvas.requestRenderAll();
          this.canvasService.commitChange(active);
        }
        break;

      case 'copy-style':
        this.clipboardService.copyStyle();
        break;
      case 'paste-style':
        this.clipboardService.pasteStyle();
        break;

      case 'group':
        this.canvasService.groupSelected();
        break;
      case 'ungroup':
        this.canvasService.ungroupSelected();
        break;

      case 'toggle-visibility':
        if (active) {
          const layerId = (active as any).layerId;
          if (layerId) this.canvasService.toggleLayerVisibility(layerId);
        }
        break;

      case 'align-page-center':
        this.canvasService.alignObjects('center-h', 'canvas');
        this.canvasService.alignObjects('center-v', 'canvas');
        break;
      case 'align-page-left':
        this.canvasService.alignObjects('left', 'canvas');
        break;
      case 'align-page-right':
        this.canvasService.alignObjects('right', 'canvas');
        break;
      case 'align-page-top':
        this.canvasService.alignObjects('top', 'canvas');
        break;
      case 'align-page-bottom':
        this.canvasService.alignObjects('bottom', 'canvas');
        break;

      case 'distribute-h':
        this.canvasService.distributeObjects('horizontal');
        break;
      case 'distribute-v':
        this.canvasService.distributeObjects('vertical');
        break;

      case 'add-comment':
        // Broadcast an event the editor picks up to enter comment mode
        window.dispatchEvent(new CustomEvent('pf:start-comment-mode'));
        break;

      case 'add-link': {
        if (!active) break;
        const existing = (active as any).hyperlink ?? '';
        const url = prompt('Enter URL (e.g. https://example.com):', existing);
        if (url !== null) {
          (active as any).hyperlink = url.trim() || undefined;
        }
        break;
      }

      case 'alt-text': {
        if (!active) break;
        const existing = (active as any).altText ?? '';
        const text = prompt('Alternative text for screen readers:', existing);
        if (text !== null) (active as any).altText = text.trim() || undefined;
        break;
      }

      case 'image-as-bg': {
        if (!(active instanceof fabric.FabricImage)) break;
        const dataUrl = active.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
        this.canvasService.setBackgroundImage(dataUrl, 'cover');
        canvas.remove(active);
        canvas.renderAll();
        break;
      }

      case 'apply-colors': {
        if (!(active instanceof fabric.FabricImage)) break;
        // Extract dominant colors from image and apply to shapes on page
        this.applyImageColorsToPage(active, canvas);
        break;
      }

      case 'delete':
        this.canvasService.removeActiveObject();
        break;
    }

    this.visible.set(false);
  }
}
