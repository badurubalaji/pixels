import { Injectable, inject, signal, computed } from '@angular/core';
import { CanvasService } from './canvas.service';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly canvasService = inject(CanvasService);

  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private readonly maxHistory = 50;
  private isPaused = false;

  private readonly _undoCount = signal(0);
  private readonly _redoCount = signal(0);

  readonly canUndo = computed(() => this._undoCount() > 0);
  readonly canRedo = computed(() => this._redoCount() > 0);
  readonly undoCount = this._undoCount.asReadonly();
  readonly redoCount = this._redoCount.asReadonly();

  /** Call once after canvas is initialized to save the initial state and wire up auto-save */
  init(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.saveState();

    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    canvas.on('object:modified', () => this.saveState());
    canvas.on('object:added', () => this.saveState());
    canvas.on('object:removed', () => this.saveState());
  }

  saveState(): void {
    if (this.isPaused) return;
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());

    // Don't push duplicate consecutive states
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === json) {
      return;
    }

    this.undoStack.push(json);

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    // Any new action clears the redo stack
    this.redoStack = [];
    this.updateCounts();
  }

  undo(): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas || this.undoStack.length <= 1) return;

    // Move current state to redo stack
    const currentState = this.undoStack.pop()!;
    this.redoStack.push(currentState);

    // Restore previous state
    const previousState = this.undoStack[this.undoStack.length - 1];
    this.restoreState(previousState);
    this.updateCounts();
  }

  redo(): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas || this.redoStack.length === 0) return;

    const nextState = this.redoStack.pop()!;
    this.undoStack.push(nextState);

    this.restoreState(nextState);
    this.updateCounts();
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateCounts();
  }

  private restoreState(stateJson: string): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    this.isPaused = true;
    // Preserve current zoom so loadFromJSON doesn't leave the canvas at
    // whatever viewport transform was baked into the saved JSON.
    const currentZoom = this.canvasService.zoom();
    canvas.loadFromJSON(JSON.parse(stateJson)).then(() => {
      // Re-apply zoom so canvas DOM dimensions and viewport transform
      // match the current editor state (not the state at save time).
      this.canvasService.setZoom(currentZoom);
      canvas.renderAll();
      this.isPaused = false;
    });
  }

  private updateCounts(): void {
    // undoStack always has at least the "current" state at top; undo needs > 1
    this._undoCount.set(Math.max(0, this.undoStack.length - 1));
    this._redoCount.set(this.redoStack.length);
  }
}
