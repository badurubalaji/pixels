import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { BrandKitService } from './brand-kit.service';
import { CanvasService } from './canvas.service';
import { HistoryService } from './history.service';
import { TemplateService } from './template.service';
import type { PlatformType } from '../constants/platform-presets';
import type {
  FabricObjectJson,
  PaletteSlot,
  Template,
} from '../models/template.model';

/**
 * Coordinates the Brand-Kit "Undo" path for PX-060.
 *
 * @remarks
 * When the user clicks "Undo" on the editor's Brand-Kit auto-apply toast,
 * this service:
 *
 *   1. Re-fetches the originating seed template (via {@link TemplateService.getById}).
 *   2. Walks the live fabric canvas, comparing every `fill` / `stroke`
 *      against the user's Brand-Kit colors.
 *   3. For each match, substitutes the role-default color from the
 *      template's `palette_slots` (same role-ordering contract PX-023 uses
 *      to compose the canvas in the first place).
 *   4. Pushes the mutation onto `HistoryService` so Redo restores the
 *      Brand-Kit state.
 *   5. Clears `brand_kit_applied_at` on the project via `ApiService` so the
 *      toast does not re-fire on subsequent loads.
 *
 * This is deliberately stateless — a single method with all the plumbing
 * wired up top-of-file. The editor is the only caller today.
 *
 * @see Story PX-060
 */
@Injectable({ providedIn: 'root' })
export class BrandKitApplyService {
  private readonly apiService = inject(ApiService);
  private readonly brandKitService = inject(BrandKitService);
  private readonly canvasService = inject(CanvasService);
  private readonly historyService = inject(HistoryService);
  private readonly templateService = inject(TemplateService);

  /**
   * Revert the current canvas from its Brand-Kit-composed state back to
   * the originating template's default palette.
   *
   * @param projectId - The live project's id (used to clear
   *   `brand_kit_applied_at` server-side once the revert completes).
   * @param sourceTemplateId - The originating seed template's `_id`.
   * @param platform - The project's platform bucket (needed so the template
   *   can be looked up without a dedicated `GET /{id}` endpoint).
   * @returns A promise that resolves once the canvas has been repainted,
   *   the history snapshot has been pushed, and the server ACK has returned.
   *   Resolves silently (no-op) when the template can no longer be located.
   *
   * @remarks
   * Role → index mapping matches PX-023's gallery pre-composition contract:
   * `primary → brandColors[0]`, `secondary → brandColors[1]`, `text → [2]`,
   * `accent → [3]`, `background → [4]`. Missing Brand-Kit slots fall through.
   *
   * Object traversal is shallow-then-recursive: `fill` and `stroke` are
   * inspected on every fabric object, plus on any nested `objects` array
   * (fabric `Group`s expose their children this way in the JSON view).
   *
   * @example
   * ```ts
   * await brandKitApply.revertToTemplateDefaults('p1', 'tpl-1', 'ig-post');
   * ```
   *
   * @see Story PX-060
   */
  async revertToTemplateDefaults(
    projectId: string,
    sourceTemplateId: string,
    platform: PlatformType,
  ): Promise<void> {
    const template = await this.templateService.getById(sourceTemplateId, platform);
    if (!template) return;

    const substitutions = this._buildSubstitutionMap(template);
    if (substitutions.size === 0) {
      // No Brand-Kit colors overlap with template role defaults — nothing to do.
      await this._clearMarkerServerSide(projectId);
      return;
    }

    const canvas = this.canvasService.getCanvas();
    if (canvas) {
      for (const obj of canvas.getObjects() as unknown as FabricObjectJson[]) {
        this._revertObjectColors(obj, substitutions);
      }
      // Request a render so the substituted colors paint immediately.
      (canvas as unknown as { requestRenderAll?: () => void }).requestRenderAll?.();
    }

    // Push a snapshot so the user can Redo the Brand-Kit re-apply.
    this.historyService.saveState();

    await this._clearMarkerServerSide(projectId);
  }

  /**
   * Build a map of `brand-kit-color → role-default-color` substitutions.
   *
   * @param template - The originating seed template.
   * @returns A case-insensitive `Map` whose keys are lower-cased brand-kit
   *   hex strings currently living on the canvas and whose values are the
   *   corresponding template default colors to restore.
   *
   * @remarks
   * The role ordering (`primary`, `secondary`, `text`, `accent`, `background`)
   * must stay in lock-step with PX-023's gallery composition — see
   * `template.model.ts::PaletteRole` for the source of truth.
   */
  private _buildSubstitutionMap(template: Template): Map<string, string> {
    const roleOrder: PaletteSlot['role'][] = [
      'primary',
      'secondary',
      'text',
      'accent',
      'background',
    ];
    const brandColors = this.brandKitService.brandColors();
    const subs = new Map<string, string>();
    for (let i = 0; i < roleOrder.length; i++) {
      const brandColor = brandColors[i];
      if (!brandColor) continue;
      const slot = template.palette_slots.find(s => s.role === roleOrder[i]);
      if (!slot) continue;
      subs.set(brandColor.toLowerCase(), slot.default);
    }
    return subs;
  }

  /**
   * Recursively swap `fill` / `stroke` on a fabric object and its children.
   *
   * @param obj - The fabric object (typed via the JSON-shape alias to keep
   *   this logic independent of the fabric class hierarchy).
   * @param subs - The substitution map from {@link _buildSubstitutionMap}.
   */
  private _revertObjectColors(
    obj: FabricObjectJson & { set?: (key: string, value: unknown) => void },
    subs: Map<string, string>,
  ): void {
    if (typeof obj.fill === 'string') {
      const replacement = subs.get(obj.fill.toLowerCase());
      if (replacement) {
        if (obj.set) obj.set('fill', replacement);
        else obj.fill = replacement;
      }
    }
    if (typeof obj.stroke === 'string') {
      const replacement = subs.get(obj.stroke.toLowerCase());
      if (replacement) {
        if (obj.set) obj.set('stroke', replacement);
        else obj.stroke = replacement;
      }
    }
    const children = obj.objects;
    if (Array.isArray(children)) {
      for (const child of children) {
        this._revertObjectColors(child, subs);
      }
    }
  }

  /**
   * Clear the server-side `brand_kit_applied_at` marker for a project so the
   * Brand-Kit auto-apply toast does not re-fire in a later session.
   *
   * @param projectId - The project id whose marker should be cleared.
   * @returns A promise that resolves once the server has ACKed the update
   *   (or immediately, on network failure — see @remarks).
   *
   * @remarks
   * Public wrapper over the internal best-effort clear. Exposed so the
   * `Editor` component can invoke it from the MatSnackBar `afterDismissed`
   * hook — this makes PX-060 AC-4 (at-most-once-per-project-open)
   * self-enforcing regardless of the dismissal path (Undo, swipe, or 7s
   * auto-timeout). Errors are swallowed (see
   * {@link _clearMarkerServerSide}) so a transient network hiccup never
   * blocks the UI.
   *
   * @example
   * ```ts
   * ref.afterDismissed().subscribe(() => brandKitApply.clearMarker('p1'));
   * ```
   *
   * @see Story PX-060 — Orion decision D2 (2026-04-24T17:50Z).
   */
  async clearMarker(projectId: string): Promise<void> {
    await this._clearMarkerServerSide(projectId);
  }

  /**
   * Best-effort POST to clear `brand_kit_applied_at` on the server so the
   * toast does not re-fire in the next session.
   *
   * @param projectId - The project id to clear.
   *
   * @remarks
   * Errors are swallowed — the in-memory toast-shown flag on the editor
   * side already prevents a double-fire in the current session, so a
   * transient network failure here is not user-visible.
   */
  private async _clearMarkerServerSide(projectId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.apiService.updateProject(projectId, { brand_kit_applied_at: null }),
      );
    } catch {
      // WHY: network failures should not block the UI-visible Undo.
    }
  }
}
