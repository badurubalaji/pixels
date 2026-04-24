import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export type BgRemovalStatus = 'idle' | 'loading-model' | 'processing' | 'done' | 'error';

@Injectable({ providedIn: 'root' })
export class BackgroundRemovalService {
  private readonly apiService = inject(ApiService);

  private readonly _status = signal<BgRemovalStatus>('idle');
  private readonly _progress = signal(0);
  private readonly _errorMessage = signal('');

  readonly status = this._status.asReadonly();
  readonly progress = this._progress.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  /**
   * Remove background client-side using @imgly/background-removal (WebAssembly).
   * Falls back to server-side if client fails.
   */
  async removeBackground(imageSource: string | File | Blob): Promise<Blob | null> {
    this._status.set('loading-model');
    this._progress.set(0);
    this._errorMessage.set('');

    try {
      // Try client-side first (no server needed)
      const result = await this.removeClientSide(imageSource);
      this._status.set('done');
      this._progress.set(100);
      return result;
    } catch (clientError) {
      console.warn('Client-side BG removal failed, trying server...', clientError);

      // Fallback to server
      try {
        this._status.set('processing');
        this._progress.set(50);
        const result = await this.removeServerSide(imageSource);
        this._status.set('done');
        this._progress.set(100);
        return result;
      } catch (serverError) {
        console.error('Server-side BG removal also failed:', serverError);
        this._status.set('error');
        this._errorMessage.set(
          'Background removal failed. Make sure the backend server is running, or try a smaller image.'
        );
        return null;
      }
    }
  }

  /**
   * Remove background from a canvas object's data URL.
   * Returns a new data URL with transparent background.
   */
  async removeFromDataURL(dataUrl: string): Promise<string | null> {
    const blob = this.dataURLToBlob(dataUrl);
    const result = await this.removeBackground(blob);
    if (!result) return null;
    return URL.createObjectURL(result);
  }

  reset(): void {
    this._status.set('idle');
    this._progress.set(0);
    this._errorMessage.set('');
  }

  private async removeClientSide(source: string | File | Blob): Promise<Blob> {
    // Dynamic import to keep initial bundle small
    const { removeBackground } = await import('@imgly/background-removal');

    this._status.set('processing');

    let input: string | Blob;
    if (source instanceof File || source instanceof Blob) {
      input = source;
    } else if (source.startsWith('data:')) {
      input = this.dataURLToBlob(source);
    } else {
      input = source;
    }

    const result = await removeBackground(input, {
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          this._progress.set(Math.round((current / total) * 100));
        }
        if (key === 'compute:inference') {
          this._status.set('processing');
        }
      },
    });

    return result;
  }

  private removeServerSide(source: string | File | Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      let file: File;

      if (source instanceof File) {
        file = source;
      } else if (source instanceof Blob) {
        file = new File([source], 'image.png', { type: source.type || 'image/png' });
      } else {
        // data URL or regular URL
        const blob = this.dataURLToBlob(source);
        file = new File([blob], 'image.png', { type: 'image/png' });
      }

      this.apiService.removeBackground(file).subscribe({
        next: (blob) => resolve(blob),
        error: (err) => reject(err),
      });
    });
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
}
