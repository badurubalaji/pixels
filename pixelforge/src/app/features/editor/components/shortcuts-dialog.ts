import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; action: string }[];
}

@Component({
  selector: 'app-shortcuts-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="shortcuts-dialog">
      <div class="dialog-header">
        <h2>Keyboard Shortcuts</h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-body">
        @for (group of groups; track group.title) {
          <div class="shortcut-group">
            <h3>{{ group.title }}</h3>
            @for (s of group.shortcuts; track s.action) {
              <div class="shortcut-row">
                <span class="shortcut-keys">
                  @for (key of s.keys.split('+'); track $index) {
                    <kbd>{{ key.trim() }}</kbd>
                    @if ($index < s.keys.split('+').length - 1) {
                      <span class="plus">+</span>
                    }
                  }
                </span>
                <span class="shortcut-action">{{ s.action }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .shortcuts-dialog {
      width: 560px;
      max-height: 80vh;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 8px;

      h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
      }
    }

    .dialog-body {
      padding: 8px 24px 24px;
      overflow-y: auto;
      max-height: 60vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .shortcut-group {
      h3 {
        margin: 0 0 8px;
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        opacity: 0.5;
      }
    }

    .shortcut-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);

      &:last-child {
        border-bottom: none;
      }
    }

    .shortcut-keys {
      display: flex;
      align-items: center;
      gap: 4px;

      kbd {
        display: inline-block;
        padding: 2px 8px;
        font-family: monospace;
        font-size: 0.78rem;
        background: var(--mat-sys-surface-container-highest);
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 4px;
        min-width: 20px;
        text-align: center;
      }

      .plus {
        font-size: 0.7rem;
        opacity: 0.4;
      }
    }

    .shortcut-action {
      font-size: 0.82rem;
      opacity: 0.7;
    }
  `],
})
export class ShortcutsDialog {
  readonly groups: ShortcutGroup[] = [
    {
      title: 'General',
      shortcuts: [
        { keys: 'Ctrl + S', action: 'Save' },
        { keys: 'Ctrl + Z', action: 'Undo' },
        { keys: 'Ctrl + Y', action: 'Redo' },
        { keys: 'Ctrl + A', action: 'Select All' },
        { keys: 'Escape', action: 'Deselect' },
        { keys: 'Delete', action: 'Delete' },
      ],
    },
    {
      title: 'Clipboard',
      shortcuts: [
        { keys: 'Ctrl + C', action: 'Copy' },
        { keys: 'Ctrl + V', action: 'Paste' },
        { keys: 'Ctrl + D', action: 'Duplicate' },
        { keys: 'Ctrl + Alt + C', action: 'Copy Style' },
        { keys: 'Ctrl + Alt + V', action: 'Paste Style' },
      ],
    },
    {
      title: 'Grouping',
      shortcuts: [
        { keys: 'Ctrl + G', action: 'Group' },
        { keys: 'Ctrl + Shift + G', action: 'Ungroup' },
      ],
    },
    {
      title: 'Canvas',
      shortcuts: [
        { keys: 'Space + Drag', action: 'Pan Canvas' },
        { keys: 'Ctrl + Scroll', action: 'Zoom In/Out' },
        { keys: 'Shift + Rotate', action: 'Snap 15°' },
      ],
    },
    {
      title: 'Transform',
      shortcuts: [
        { keys: '↑ ↓ ← →', action: 'Nudge 1px' },
        { keys: 'Shift + Arrow', action: 'Nudge 10px' },
      ],
    },
  ];
}
