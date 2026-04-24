import { Component, inject, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CanvasService, ShapeType } from '../../../core/services/canvas.service';
import { HistoryService } from '../../../core/services/history.service';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { ProjectService } from '../../../core/services/project.service';

interface Command {
  id: string;
  title: string;
  hint?: string;
  icon: string;
  category: string;
  keywords?: string[];
  shortcut?: string;
  action: () => void;
}

@Component({
  selector: 'app-command-palette',
  imports: [FormsModule, MatIconModule],
  template: `
    @if (open()) {
      <div class="palette-backdrop" (click)="close()">
        <div class="palette" (click)="$event.stopPropagation()">
          <div class="palette-search">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              #searchInput
              type="text"
              placeholder="Type a command or search..."
              [value]="query()"
              (input)="onQueryChange($any($event.target).value)"
              (keydown)="onKeyDown($event)"
            />
            <kbd class="esc-hint">ESC</kbd>
          </div>

          <div class="palette-results" #resultsList>
            @if (filteredCommands().length === 0) {
              <div class="no-results">
                <mat-icon>search_off</mat-icon>
                <p>No commands match "{{ query() }}"</p>
              </div>
            } @else {
              @for (cmd of filteredCommands(); track cmd.id; let i = $index) {
                <button
                  class="palette-item"
                  [class.active]="i === activeIndex()"
                  (click)="execute(cmd)"
                  (mouseenter)="activeIndex.set(i)"
                >
                  <mat-icon class="cmd-icon">{{ cmd.icon }}</mat-icon>
                  <div class="cmd-text">
                    <span class="cmd-title">{{ cmd.title }}</span>
                    @if (cmd.hint) {
                      <span class="cmd-hint">{{ cmd.hint }}</span>
                    }
                  </div>
                  <span class="cmd-cat">{{ cmd.category }}</span>
                  @if (cmd.shortcut) {
                    <kbd class="cmd-kbd">{{ cmd.shortcut }}</kbd>
                  }
                </button>
              }
            }
          </div>

          <div class="palette-footer">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Run</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .palette-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 12vh;
      backdrop-filter: blur(4px);
    }

    .palette {
      width: 600px;
      max-width: 90vw;
      max-height: 60vh;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .palette-search {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      .search-icon {
        opacity: 0.5;
        font-size: 22px;
        height: 22px;
        width: 22px;
      }

      input {
        flex: 1;
        background: none;
        border: none;
        color: inherit;
        font-size: 1rem;
        outline: none;

        &::placeholder { opacity: 0.4; }
      }
    }

    .palette-results {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0;
    }

    .palette-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 16px;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      text-align: left;

      &.active {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }

      .cmd-icon {
        font-size: 20px;
        height: 20px;
        width: 20px;
        opacity: 0.7;
      }

      .cmd-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1px;
        overflow: hidden;

        .cmd-title { font-size: 0.9rem; }
        .cmd-hint { font-size: 0.72rem; opacity: 0.55; }
      }

      .cmd-cat {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.4;
        padding: 2px 8px;
        background: var(--mat-sys-surface-container-highest);
        border-radius: 4px;
      }
    }

    .no-results {
      padding: 40px 16px;
      text-align: center;
      opacity: 0.4;

      mat-icon {
        font-size: 36px;
        height: 36px;
        width: 36px;
        margin-bottom: 8px;
      }

      p { margin: 0; font-size: 0.85rem; }
    }

    .palette-footer {
      display: flex;
      gap: 16px;
      padding: 8px 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font-size: 0.72rem;
      opacity: 0.5;
    }

    kbd {
      display: inline-block;
      padding: 1px 6px;
      font-family: monospace;
      font-size: 0.72rem;
      background: var(--mat-sys-surface-container-highest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 4px;
    }

    .esc-hint { opacity: 0.4; }
    .cmd-kbd { opacity: 0.5; }
  `],
})
export class CommandPalette implements OnInit, OnDestroy, AfterViewInit {
  private readonly canvasService = inject(CanvasService);
  private readonly historyService = inject(HistoryService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('resultsList') resultsListRef?: ElementRef<HTMLDivElement>;

  readonly open = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);

  readonly commands: Command[] = [
    // Add elements
    { id: 'add-rect', title: 'Add Rectangle', icon: 'rectangle', category: 'Add', keywords: ['shape', 'box'], action: () => this.canvasService.addShape('rect') },
    { id: 'add-circle', title: 'Add Circle', icon: 'circle', category: 'Add', keywords: ['shape', 'oval'], action: () => this.canvasService.addShape('circle') },
    { id: 'add-triangle', title: 'Add Triangle', icon: 'change_history', category: 'Add', keywords: ['shape'], action: () => this.canvasService.addShape('triangle') },
    { id: 'add-star', title: 'Add Star', icon: 'star', category: 'Add', keywords: ['shape'], action: () => this.canvasService.addShape('star') },
    { id: 'add-line', title: 'Add Line', icon: 'horizontal_rule', category: 'Add', action: () => this.canvasService.addShape('line') },
    { id: 'add-arrow', title: 'Add Arrow', icon: 'arrow_right_alt', category: 'Add', action: () => this.canvasService.addShape('arrow') },
    { id: 'add-heading', title: 'Add Heading', icon: 'title', category: 'Add', keywords: ['text', 'h1'], action: () => this.canvasService.addText('Heading', { fontSize: 64, fontWeight: 'bold' }) },
    { id: 'add-text', title: 'Add Text', icon: 'text_fields', category: 'Add', action: () => this.canvasService.addText('Add text here') },

    // Edit
    { id: 'undo', title: 'Undo', icon: 'undo', category: 'Edit', shortcut: 'Ctrl+Z', action: () => this.historyService.undo() },
    { id: 'redo', title: 'Redo', icon: 'redo', category: 'Edit', shortcut: 'Ctrl+Y', action: () => this.historyService.redo() },
    { id: 'copy', title: 'Copy', icon: 'content_copy', category: 'Edit', shortcut: 'Ctrl+C', action: () => this.clipboardService.copy() },
    { id: 'paste', title: 'Paste', icon: 'content_paste', category: 'Edit', shortcut: 'Ctrl+V', action: () => this.clipboardService.paste() },
    { id: 'duplicate', title: 'Duplicate', icon: 'control_point_duplicate', category: 'Edit', shortcut: 'Ctrl+D', action: () => this.clipboardService.duplicate() },
    { id: 'delete', title: 'Delete', icon: 'delete', category: 'Edit', shortcut: 'Del', action: () => this.canvasService.removeActiveObject() },
    { id: 'group', title: 'Group Selected', icon: 'group_work', category: 'Edit', shortcut: 'Ctrl+G', action: () => this.canvasService.groupSelected() },
    { id: 'ungroup', title: 'Ungroup Selected', icon: 'workspaces', category: 'Edit', shortcut: 'Ctrl+Shift+G', action: () => this.canvasService.ungroupSelected() },

    // Tools
    { id: 'draw', title: 'Toggle Drawing Mode', icon: 'edit', category: 'Tools', keywords: ['pen', 'brush'], action: () => this.canvasService.toggleDrawingMode() },
    { id: 'grid', title: 'Toggle Grid', icon: 'grid_on', category: 'Tools', action: () => this.canvasService.toggleGrid() },
    { id: 'snap', title: 'Toggle Snap to Grid', icon: 'grid_4x4', category: 'Tools', action: () => this.canvasService.toggleSnapToGrid() },
    { id: 'eyedropper', title: 'Pick Color (Eyedropper)', icon: 'colorize', category: 'Tools', action: () => this.canvasService.startEyedropper(() => {}) },

    // Align
    { id: 'align-left', title: 'Align Left', icon: 'align_horizontal_left', category: 'Align', action: () => this.canvasService.alignObjects('left') },
    { id: 'align-center-h', title: 'Align Center Horizontally', icon: 'align_horizontal_center', category: 'Align', action: () => this.canvasService.alignObjects('center-h') },
    { id: 'align-right', title: 'Align Right', icon: 'align_horizontal_right', category: 'Align', action: () => this.canvasService.alignObjects('right') },
    { id: 'align-top', title: 'Align Top', icon: 'align_vertical_top', category: 'Align', action: () => this.canvasService.alignObjects('top') },
    { id: 'align-center-v', title: 'Align Center Vertically', icon: 'align_vertical_center', category: 'Align', action: () => this.canvasService.alignObjects('center-v') },
    { id: 'align-bottom', title: 'Align Bottom', icon: 'align_vertical_bottom', category: 'Align', action: () => this.canvasService.alignObjects('bottom') },
    { id: 'distribute-h', title: 'Distribute Horizontally', icon: 'horizontal_distribute', category: 'Align', action: () => this.canvasService.distributeObjects('horizontal') },
    { id: 'distribute-v', title: 'Distribute Vertically', icon: 'vertical_distribute', category: 'Align', action: () => this.canvasService.distributeObjects('vertical') },

    // Navigation
    { id: 'home', title: 'Go to Dashboard', icon: 'home', category: 'Navigate', action: () => this.router.navigate(['/']) },
  ];

  readonly filteredCommands = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.commands;
    return this.commands.filter(c => {
      if (c.title.toLowerCase().includes(q)) return true;
      if (c.category.toLowerCase().includes(q)) return true;
      if (c.keywords?.some(k => k.toLowerCase().includes(q))) return true;
      return false;
    });
  });

  private keyHandler = (e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'k') {
      e.preventDefault();
      this.toggle();
    }
  };

  ngOnInit(): void {
    document.addEventListener('keydown', this.keyHandler);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keyHandler);
  }

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openPalette();
    }
  }

  openPalette(): void {
    this.open.set(true);
    this.query.set('');
    this.activeIndex.set(0);
    setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 50);
  }

  close(): void {
    this.open.set(false);
  }

  onQueryChange(q: string): void {
    this.query.set(q);
    this.activeIndex.set(0);
  }

  onKeyDown(e: KeyboardEvent): void {
    const list = this.filteredCommands();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.activeIndex.update(i => Math.min(list.length - 1, i + 1));
      this.scrollToActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activeIndex.update(i => Math.max(0, i - 1));
      this.scrollToActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = list[this.activeIndex()];
      if (cmd) this.execute(cmd);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  execute(cmd: Command): void {
    this.close();
    setTimeout(() => cmd.action(), 50);
  }

  private scrollToActive(): void {
    setTimeout(() => {
      const list = this.resultsListRef?.nativeElement;
      const active = list?.querySelector('.palette-item.active') as HTMLElement;
      active?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }
}
