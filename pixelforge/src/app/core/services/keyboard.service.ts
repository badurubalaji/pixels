import { Injectable, inject, NgZone } from '@angular/core';
import { CanvasService } from './canvas.service';
import { HistoryService } from './history.service';
import { ClipboardService } from './clipboard.service';

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private readonly canvasService = inject(CanvasService);
  private readonly historyService = inject(HistoryService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly ngZone = inject(NgZone);

  private handler: ((e: KeyboardEvent) => void) | null = null;

  init(): void {
    this.destroy();

    this.handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Also skip if a text object is being edited on canvas
      const canvas = this.canvasService.getCanvas();
      const activeObj = canvas?.getActiveObject();
      if (activeObj && 'isEditing' in activeObj && (activeObj as any).isEditing) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      this.ngZone.run(() => {
        // Delete / Backspace — remove selected
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          this.canvasService.removeActiveObject();
          return;
        }

        // Ctrl+Z — Undo
        if (ctrl && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          this.historyService.undo();
          return;
        }

        // Ctrl+Shift+Z or Ctrl+Y — Redo
        if ((ctrl && e.key === 'z' && e.shiftKey) || (ctrl && e.key === 'y')) {
          e.preventDefault();
          this.historyService.redo();
          return;
        }

        // Ctrl+Alt+C — Copy Style
        if (ctrl && e.altKey && e.key === 'c') {
          e.preventDefault();
          this.clipboardService.copyStyle();
          return;
        }

        // Ctrl+Alt+V — Paste Style
        if (ctrl && e.altKey && e.key === 'v') {
          e.preventDefault();
          this.clipboardService.pasteStyle();
          return;
        }

        // Ctrl+C — Copy
        if (ctrl && e.key === 'c') {
          e.preventDefault();
          this.clipboardService.copy();
          return;
        }

        // Ctrl+V — Paste
        if (ctrl && e.key === 'v') {
          e.preventDefault();
          this.clipboardService.paste();
          return;
        }

        // Ctrl+D — Duplicate
        if (ctrl && e.key === 'd') {
          e.preventDefault();
          this.clipboardService.duplicate();
          return;
        }

        // Ctrl+G — Group
        if (ctrl && e.key === 'g' && !e.shiftKey) {
          e.preventDefault();
          this.canvasService.groupSelected();
          return;
        }

        // Ctrl+Shift+G — Ungroup
        if (ctrl && e.key === 'g' && e.shiftKey) {
          e.preventDefault();
          this.canvasService.ungroupSelected();
          return;
        }

        // Ctrl+A — Select all
        if (ctrl && e.key === 'a') {
          e.preventDefault();
          if (!canvas) return;
          const objects = canvas.getObjects();
          if (objects.length === 0) return;
          const selection = new (fabric as any).ActiveSelection(objects, { canvas });
          canvas.setActiveObject(selection);
          canvas.renderAll();
          return;
        }

        // Arrow keys — nudge selected object
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          if (!canvas) return;
          const obj = canvas.getActiveObject();
          if (!obj) return;

          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;

          switch (e.key) {
            case 'ArrowUp':    obj.set('top', (obj.top ?? 0) - step); break;
            case 'ArrowDown':  obj.set('top', (obj.top ?? 0) + step); break;
            case 'ArrowLeft':  obj.set('left', (obj.left ?? 0) - step); break;
            case 'ArrowRight': obj.set('left', (obj.left ?? 0) + step); break;
          }

          obj.setCoords();
          canvas.renderAll();
          return;
        }

        // ? — Show shortcuts (dispatch custom event to editor)
        if (e.key === '?' && !ctrl) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('show-shortcuts'));
          return;
        }

        // Escape — deselect
        if (e.key === 'Escape') {
          if (!canvas) return;
          canvas.discardActiveObject();
          canvas.renderAll();
          return;
        }
      });
    };

    document.addEventListener('keydown', this.handler);
  }

  destroy(): void {
    if (this.handler) {
      document.removeEventListener('keydown', this.handler);
      this.handler = null;
    }
  }
}

import * as fabric from 'fabric';
