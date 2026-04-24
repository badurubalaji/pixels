/**
 * Plugin/Widget API for Pixelforge.
 *
 * Plugins register a name, icon, and a render() function that receives
 * config and returns either an SVG string or a creator function that
 * adds objects to the canvas via the provided helpers.
 */

import { CanvasService } from '../services/canvas.service';

export interface PluginContext {
  canvas: CanvasService;
  /** Add an SVG string to the canvas as an editable object. */
  addSvg: (svg: string) => Promise<void>;
  /** Add raw text to the canvas. */
  addText: (text: string, options?: any) => void;
  /** Add an image URL to the canvas. */
  addImage: (url: string) => void;
}

export interface PluginConfigField {
  key: string;
  label: string;
  type: 'text' | 'color' | 'number' | 'select';
  default: any;
  options?: { value: string; label: string }[]; // for select
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;        // material icon name
  category: 'widget' | 'embed' | 'utility';
  configFields?: PluginConfigField[];
  /**
   * Called when user clicks the plugin. Receives the configured values
   * and the canvas context. Should add elements to the canvas.
   */
  render: (config: Record<string, any>, ctx: PluginContext) => void | Promise<void>;
}

export class PluginRegistry {
  private static plugins: Plugin[] = [];

  static register(plugin: Plugin): void {
    if (this.plugins.find(p => p.id === plugin.id)) {
      console.warn(`Plugin "${plugin.id}" already registered`);
      return;
    }
    this.plugins.push(plugin);
  }

  static getAll(): Plugin[] {
    return [...this.plugins];
  }

  static getById(id: string): Plugin | undefined {
    return this.plugins.find(p => p.id === id);
  }
}
