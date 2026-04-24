import { TestBed } from '@angular/core/testing';
import { AnimationService, ANIMATION_PRESETS } from './animation.service';
import { CanvasService } from './canvas.service';

describe('AnimationService', () => {
  let service: AnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnimationService,
        { provide: CanvasService, useValue: { getCanvas: () => null } },
      ],
    });
    service = TestBed.inject(AnimationService);
  });

  it('has at least 9 animation presets', () => {
    expect(ANIMATION_PRESETS.length).toBeGreaterThanOrEqual(9);
  });

  it('includes a "none" preset', () => {
    expect(ANIMATION_PRESETS.find(p => p.type === 'none')).toBeDefined();
  });

  it('sets and reads an animation on an object', () => {
    const fakeObj: any = {};
    service.setAnimation(fakeObj, { type: 'fade-in', duration: 500, delay: 0 });
    const anim = service.getAnimation(fakeObj);
    expect(anim?.type).toBe('fade-in');
    expect(anim?.duration).toBe(500);
  });

  it('returns null when no animation set', () => {
    expect(service.getAnimation({} as any)).toBeNull();
  });
});
