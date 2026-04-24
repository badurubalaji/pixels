import { Injectable, inject } from '@angular/core';
import { CanvasService } from './canvas.service';
import * as fabric from 'fabric';

export type AnimationType = 'none' | 'fade-in' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'scale-in' | 'rotate-in' | 'bounce';

export interface ObjectAnimation {
  type: AnimationType;
  duration: number; // ms
  delay: number;    // ms
}

export const ANIMATION_PRESETS: { type: AnimationType; label: string; icon: string }[] = [
  { type: 'none', label: 'None', icon: 'block' },
  { type: 'fade-in', label: 'Fade In', icon: 'visibility' },
  { type: 'slide-left', label: 'Slide Left', icon: 'arrow_back' },
  { type: 'slide-right', label: 'Slide Right', icon: 'arrow_forward' },
  { type: 'slide-up', label: 'Slide Up', icon: 'arrow_upward' },
  { type: 'slide-down', label: 'Slide Down', icon: 'arrow_downward' },
  { type: 'scale-in', label: 'Scale In', icon: 'zoom_in' },
  { type: 'rotate-in', label: 'Rotate In', icon: 'rotate_right' },
  { type: 'bounce', label: 'Bounce', icon: 'south' },
];

@Injectable({ providedIn: 'root' })
export class AnimationService {
  private readonly canvasService = inject(CanvasService);

  setAnimation(obj: fabric.FabricObject, animation: ObjectAnimation): void {
    (obj as any).animation = animation;
  }

  getAnimation(obj: fabric.FabricObject): ObjectAnimation | null {
    return (obj as any).animation ?? null;
  }

  /**
   * Play all enter animations on the canvas. Returns a promise that resolves when done.
   */
  async playAll(): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    const objects = canvas.getObjects().filter(o => !(o as any)._isGuideline && !(o as any)._isGrid);

    // Save initial state, hide all
    const states = objects.map(obj => ({
      obj,
      animation: this.getAnimation(obj) as ObjectAnimation | null,
      original: this.snapshot(obj),
    }));

    // Hide objects that have animations
    for (const s of states) {
      if (s.animation && s.animation.type !== 'none') {
        this.applyStartState(s.obj, s.animation, s.original);
      }
    }
    canvas.renderAll();

    // Play each animation
    const promises = states
      .filter(s => s.animation && s.animation.type !== 'none')
      .map(s => this.animate(s.obj, s.animation!, s.original));

    await Promise.all(promises);
  }

  /** Reset all animated objects to their final (rendered) state. */
  resetAll(): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;
    canvas.renderAll();
  }

  private snapshot(obj: fabric.FabricObject): Record<string, any> {
    return {
      left: obj.left,
      top: obj.top,
      opacity: obj.opacity,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      angle: obj.angle,
    };
  }

  private applyStartState(obj: fabric.FabricObject, anim: ObjectAnimation, original: any): void {
    switch (anim.type) {
      case 'fade-in':
        obj.set('opacity', 0);
        break;
      case 'slide-left':
        obj.set('left', original.left + 200);
        obj.set('opacity', 0);
        break;
      case 'slide-right':
        obj.set('left', original.left - 200);
        obj.set('opacity', 0);
        break;
      case 'slide-up':
        obj.set('top', original.top + 200);
        obj.set('opacity', 0);
        break;
      case 'slide-down':
        obj.set('top', original.top - 200);
        obj.set('opacity', 0);
        break;
      case 'scale-in':
        obj.set('scaleX', 0);
        obj.set('scaleY', 0);
        obj.set('opacity', 0);
        break;
      case 'rotate-in':
        obj.set('angle', (original.angle ?? 0) - 180);
        obj.set('opacity', 0);
        break;
      case 'bounce':
        obj.set('top', original.top - 300);
        break;
    }
    obj.setCoords();
  }

  private animate(obj: fabric.FabricObject, anim: ObjectAnimation, original: any): Promise<void> {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return Promise.resolve();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const props: Record<string, any> = {};
        const easing = anim.type === 'bounce' ? this.easeOutBounce : this.easeOutCubic;

        switch (anim.type) {
          case 'fade-in':
            props['opacity'] = original.opacity ?? 1;
            break;
          case 'slide-left':
          case 'slide-right':
            props['left'] = original.left;
            props['opacity'] = original.opacity ?? 1;
            break;
          case 'slide-up':
          case 'slide-down':
            props['top'] = original.top;
            props['opacity'] = original.opacity ?? 1;
            break;
          case 'scale-in':
            props['scaleX'] = original.scaleX ?? 1;
            props['scaleY'] = original.scaleY ?? 1;
            props['opacity'] = original.opacity ?? 1;
            break;
          case 'rotate-in':
            props['angle'] = original.angle ?? 0;
            props['opacity'] = original.opacity ?? 1;
            break;
          case 'bounce':
            props['top'] = original.top;
            break;
        }

        const startTime = Date.now();
        const startValues: Record<string, number> = {};
        for (const key in props) {
          startValues[key] = (obj as any)[key];
        }

        const tick = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / anim.duration);
          const eased = easing(t);

          for (const key in props) {
            const start = startValues[key];
            const end = props[key];
            (obj as any)[key] = start + (end - start) * eased;
          }
          obj.setCoords();
          canvas.renderAll();

          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(tick);
      }, anim.delay);
    });
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeOutBounce(t: number): number {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}
