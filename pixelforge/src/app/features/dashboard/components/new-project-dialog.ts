import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-new-project-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>New Project</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Project Name</mat-label>
        <input matInput [(ngModel)]="name" placeholder="My Logo" />
      </mat-form-field>
      <div class="size-fields">
        <mat-form-field appearance="outline">
          <mat-label>Width (px)</mat-label>
          <input matInput type="number" [(ngModel)]="width" min="1" max="7680" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Height (px)</mat-label>
          <input matInput type="number" [(ngModel)]="height" min="1" max="4320" />
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button (click)="create()" [disabled]="!name || !width || !height">
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }

    .size-fields {
      display: flex;
      gap: 16px;

      mat-form-field {
        flex: 1;
      }
    }
  `],
})
export class NewProjectDialog {
  name = '';
  width = 1000;
  height = 1000;

  constructor(private readonly dialogRef: MatDialogRef<NewProjectDialog>) {}

  create(): void {
    this.dialogRef.close({
      name: this.name,
      width: this.width,
      height: this.height,
    });
  }
}
