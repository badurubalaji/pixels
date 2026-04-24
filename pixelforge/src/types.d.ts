declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    repeat?: number;
    background?: string;
    transparent?: string | null;
    dither?: boolean | string;
    debug?: boolean;
  }

  interface AddFrameOptions {
    delay?: number;
    copy?: boolean;
    dispose?: number;
  }

  class GIF {
    constructor(options?: GIFOptions);
    addFrame(image: HTMLImageElement | HTMLCanvasElement | CanvasRenderingContext2D | ImageData, options?: AddFrameOptions): void;
    on(event: 'start' | 'finished' | 'progress' | 'abort', callback: (...args: any[]) => void): void;
    render(): void;
    abort(): void;
  }

  export default GIF;
}
