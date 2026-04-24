import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getPlatformPreset, type PlatformType } from '../constants/platform-presets';
import type { Template } from '../models/template.model';

/** Shape of a project returned by the backend (`/api/projects`). */
export interface ApiProject {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail?: string;
  canvas_json?: string;
  created_at: string;
  updated_at: string;
  /**
   * Originating seed-template `_id` if this project was created from a
   * starter template, else `null`/absent (PX-060 T-0).
   */
  source_template_id?: string | null;
  /**
   * ISO 8601 UTC timestamp of the most recent Brand-Kit auto-apply pass.
   * Cleared (set to `null`) by the editor Undo action so the toast does
   * not re-fire on subsequent opens (PX-060 T-0).
   */
  brand_kit_applied_at?: string | null;
  /**
   * Platform preset id (`'ig-post'`, `'yt-thumb'`, …) or `'custom'`. May be
   * absent on pre-migration rows (PX-060 T-0).
   */
  platform?: string | null;
}

/** Shape of an asset returned by `/api/assets`. */
export interface ApiAsset {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  project_id?: string;
  created_at: string;
  url: string;
}

/**
 * HTTP gateway to the FastAPI backend.
 *
 * @remarks
 * Thin wrapper that owns URL construction + error-swallowing fallbacks for
 * read endpoints (`list*`, `getBrandKit`, …). Write endpoints propagate
 * errors to the caller unchanged. Auth headers are attached centrally by
 * an HTTP interceptor — see `app.config.ts`.
 *
 * @see PX-001
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // --- Image Processing ---

  /**
   * POST an image to the backend background-removal endpoint.
   *
   * @param imageFile - The source image (any browser-readable image type).
   * @returns Observable emitting the processed PNG as a Blob.
   */
  removeBackground(imageFile: File): Observable<Blob> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post(`${this.baseUrl}/api/remove-background`, formData, {
      responseType: 'blob',
    });
  }

  /**
   * GET the backend liveness endpoint.
   *
   * @returns Observable emitting `{ status, database? }`.
   */
  healthCheck(): Observable<{ status: string; database?: string }> {
    return this.http.get<{ status: string; database?: string }>(`${this.baseUrl}/api/health`);
  }

  // --- Projects ---

  /**
   * Create a new project.
   *
   * @param data - Initial project fields (`name`, `width`, `height`).
   * @returns Observable emitting the persisted {@link ApiProject}.
   */
  createProject(data: { name: string; width: number; height: number }): Observable<ApiProject> {
    return this.http.post<ApiProject>(`${this.baseUrl}/api/projects`, data);
  }

  /**
   * List all projects the current user owns.
   *
   * @returns Observable emitting an array of {@link ApiProject}. On any HTTP
   * error the observable resolves to `[]` (not an error) so UI can render
   * an empty state without special-casing offline/auth failures.
   */
  listProjects(): Observable<ApiProject[]> {
    return this.http.get<ApiProject[]>(`${this.baseUrl}/api/projects`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * GET a single project by id.
   *
   * @param id - Project identifier.
   * @returns Observable emitting the {@link ApiProject}.
   */
  getProject(id: string): Observable<ApiProject> {
    return this.http.get<ApiProject>(`${this.baseUrl}/api/projects/${id}`);
  }

  /**
   * PUT a partial update to a project.
   *
   * @param id - Project identifier.
   * @param data - Any subset of mutable project fields.
   * @returns Observable emitting the updated {@link ApiProject}.
   */
  updateProject(id: string, data: Partial<{
    name: string;
    width: number;
    height: number;
    canvas_json: string;
    thumbnail: string;
    /** PX-060 T-0 — clearing this (set to `null`) marks the project as reverted. */
    brand_kit_applied_at: string | null;
    platform: string | null;
    source_template_id: string | null;
  }>): Observable<ApiProject> {
    return this.http.put<ApiProject>(`${this.baseUrl}/api/projects/${id}`, data);
  }

  /**
   * DELETE a project.
   *
   * @param id - Project identifier.
   * @returns Observable emitting the backend response.
   */
  deleteProject(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/projects/${id}`);
  }

  // --- Sharing ---

  /**
   * Create a public share link for a project.
   *
   * @param id - Project identifier.
   * @returns Observable emitting `{ share_token, project_id }`.
   */
  createShareLink(id: string): Observable<{ share_token: string; project_id: string }> {
    return this.http.post<{ share_token: string; project_id: string }>(
      `${this.baseUrl}/api/projects/${id}/share`, {}
    );
  }

  /**
   * Revoke a previously-issued share token.
   *
   * @param id - Project identifier.
   */
  revokeShareLink(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/projects/${id}/share`);
  }

  /**
   * Fetch the project behind a share token (public endpoint).
   *
   * @param token - Share token issued via {@link createShareLink}.
   */
  getSharedProject(token: string): Observable<ApiProject> {
    return this.http.get<ApiProject>(`${this.baseUrl}/api/projects/shared/${token}`);
  }

  // --- Versions ---

  /**
   * List every saved version of a project.
   *
   * @param projectId - Project identifier.
   */
  listVersions(projectId: string): Observable<{ id: string; project_id: string; thumbnail?: string; created_at: string; note?: string }[]> {
    return this.http.get<any>(`${this.baseUrl}/api/projects/${projectId}/versions`);
  }

  /**
   * Create a new version snapshot of the given project.
   *
   * @param projectId - Project identifier.
   * @param note - Optional human-readable note; encoded onto the querystring.
   */
  createVersion(projectId: string, note?: string): Observable<any> {
    const url = note ? `${this.baseUrl}/api/projects/${projectId}/versions?note=${encodeURIComponent(note)}`
                     : `${this.baseUrl}/api/projects/${projectId}/versions`;
    return this.http.post(url, {});
  }

  /**
   * Restore a project to the given version.
   *
   * @param projectId - Project identifier.
   * @param versionId - Version snapshot id.
   */
  restoreVersion(projectId: string, versionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/projects/${projectId}/versions/${versionId}/restore`, {});
  }

  // --- Assets ---

  /**
   * Upload an asset file, optionally scoped to a project.
   *
   * @param file - The browser `File` to upload.
   * @param projectId - Optional project scope; appended as `?project_id=...`.
   * @returns Observable emitting the persisted {@link ApiAsset}.
   */
  uploadAsset(file: File, projectId?: string): Observable<ApiAsset> {
    const formData = new FormData();
    formData.append('file', file);

    let url = `${this.baseUrl}/api/assets/upload`;
    if (projectId) {
      url += `?project_id=${projectId}`;
    }

    return this.http.post<ApiAsset>(url, formData);
  }

  /**
   * List assets, optionally scoped to a project.
   *
   * @param projectId - Optional project scope.
   * @returns Observable emitting an array of {@link ApiAsset}; `[]` on error.
   */
  listAssets(projectId?: string): Observable<ApiAsset[]> {
    let url = `${this.baseUrl}/api/assets`;
    if (projectId) {
      url += `?project_id=${projectId}`;
    }
    return this.http.get<ApiAsset[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Delete an asset by id.
   *
   * @param id - Asset identifier.
   */
  deleteAsset(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/assets/${id}`);
  }

  /**
   * Compose a public download URL for an asset (synchronous — no HTTP).
   *
   * @param id - Asset identifier.
   * @returns Absolute URL to the asset resource.
   */
  getAssetUrl(id: string): string {
    return `${this.baseUrl}/api/assets/${id}`;
  }

  // --- Brand Kit ---

  /**
   * GET the user's brand kit (colors, fonts, logos).
   *
   * @returns Observable emitting the brand-kit payload; an empty shape on error.
   */
  getBrandKit(): Observable<{ colors: string[]; fonts: string[]; logos: { id: string; name: string; dataUrl: string }[] }> {
    return this.http.get<any>(`${this.baseUrl}/api/brand-kit`).pipe(
      catchError(() => of({ colors: [], fonts: [], logos: [] }))
    );
  }

  /**
   * PUT (replace) the user's brand kit.
   *
   * @param data - Full brand-kit payload.
   */
  saveBrandKit(data: { colors: string[]; fonts: string[]; logos: { id: string; name: string; dataUrl: string }[] }): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/brand-kit`, data);
  }

  // --- Comments ---

  /**
   * List all comments for a project.
   *
   * @param projectId - Project identifier.
   * @returns Observable emitting comments; `[]` on error.
   */
  listComments(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/projects/${projectId}/comments`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Create a new comment anchored to a canvas position.
   *
   * @param projectId - Project identifier.
   * @param data - Anchor + text + optional author name.
   */
  createComment(projectId: string, data: { x: number; y: number; text: string; author?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/projects/${projectId}/comments`, data);
  }

  /**
   * PATCH an existing comment (e.g. mark resolved, edit text).
   *
   * @param projectId - Project identifier.
   * @param commentId - Comment identifier.
   * @param data - Fields to update.
   */
  updateComment(projectId: string, commentId: string, data: { text?: string; resolved?: boolean }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/api/projects/${projectId}/comments/${commentId}`, data);
  }

  /**
   * Delete a comment from the backend.
   *
   * @param projectId - Project identifier.
   * @param commentId - Comment identifier.
   * @remarks Suffixed `Remote` to distinguish from local-state removals.
   */
  deleteCommentRemote(projectId: string, commentId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/projects/${projectId}/comments/${commentId}`);
  }

  /**
   * Append a reply to an existing comment thread.
   *
   * @param projectId - Project identifier.
   * @param commentId - Parent comment identifier.
   * @param data - Reply text + optional author.
   */
  addReply(projectId: string, commentId: string, data: { text: string; author?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/projects/${projectId}/comments/${commentId}/replies`, data);
  }

  // --- Public Templates ---

  /**
   * List public templates, optionally filtered by category + search query.
   *
   * @param category - Category slug; `'all'` (or undefined) means no filter.
   * @param search - Free-text search; URL-encoded onto the querystring.
   * @returns Observable emitting templates; `[]` on error.
   */
  listPublicTemplates(category?: string, search?: string): Observable<any[]> {
    let url = `${this.baseUrl}/api/public-templates`;
    const params: string[] = [];
    if (category && category !== 'all') params.push(`category=${encodeURIComponent(category)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<any[]>(url).pipe(catchError(() => of([])));
  }

  /**
   * GET a single public template by id.
   *
   * @param id - Template identifier.
   */
  getPublicTemplate(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/public-templates/${id}`);
  }

  /**
   * Publish a project as a public template.
   *
   * @param data - Metadata + serialized canvas JSON + optional thumbnail.
   */
  publishTemplate(data: { name: string; category: string; description?: string; canvas_json: string; thumbnail?: string; width: number; height: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/public-templates`, data);
  }

  // --- Seed Templates (PX-022a / PX-023) ---

  /**
   * List seed starter templates for a platform, optionally narrowed by tags.
   *
   * @param platform - Concrete platform id (never `'custom'`).
   * @param tags - Optional filter tags. Empty / omitted = no filter. Multiple
   *   tags join with OR semantics on the backend (see `seed_template_router`).
   * @returns Observable emitting the list of {@link Template} documents for
   *   the requested platform. Resolves to `[]` on any HTTP error so the gallery
   *   can render an empty state without special-casing network failures.
   *
   * @remarks
   * URL: `GET {baseUrl}/api/v1/templates?platform=<id>[&tags=<csv>]`.
   * Shipped under PX-022a; consumed by the gallery in PX-023.
   *
   * @example
   * ```ts
   * api.listTemplates('ig-post', ['Bold', 'Festive']).subscribe(ts => ...)
   * ```
   *
   * @see Story PX-022a
   * @see Story PX-023
   */
  listTemplates(platform: PlatformType, tags?: string[]): Observable<Template[]> {
    let url = `${this.baseUrl}/api/v1/templates?platform=${encodeURIComponent(platform)}`;
    if (tags && tags.length > 0) {
      // WHY: backend expects a comma-separated list, not repeated ?tags= keys.
      url += `&tags=${encodeURIComponent(tags.join(','))}`;
    }
    return this.http.get<Template[]>(url).pipe(catchError(() => of([] as Template[])));
  }

  /**
   * Create a new project pre-seeded from a template's canvas + Brand-Kit-
   * composed thumbnail.
   *
   * @param opts - Creation payload.
   * @param opts.source_template_id - Originating template `_id`. Persisted
   *   on the project document (PX-060 T-0) so the editor can load the
   *   original template for the Undo revert path.
   * @param opts.canvas_json - Serialized fabric scene (already composed with
   *   the user's Brand-Kit colors if any existed).
   * @param opts.platform - Target platform id — used to look up width/height
   *   from {@link PLATFORM_PRESETS} and to pass through `?platform=` on the
   *   editor navigation (PX-020's query-param contract). Also persisted on
   *   the project document (PX-060 T-0).
   * @param opts.thumbnail_data_url - Pre-rendered thumbnail data URL
   *   (≤ 300×300).
   * @returns Observable emitting the persisted {@link ApiProject}.
   *
   * @remarks
   * PX-060 T-0 extends the wire shape so `source_template_id`, `platform`,
   * and `brand_kit_applied_at` are persisted server-side — replacing the
   * PX-023 wire-level drop. The `brand_kit_applied_at` timestamp is set
   * here (server-received time is good enough) so the editor's toast
   * heuristic can detect "just-applied" projects within 5 minutes of load.
   *
   * @see Story PX-023
   * @see Story PX-060
   */
  createProjectFromTemplate(opts: {
    source_template_id: string;
    canvas_json: FabricJsonLike;
    platform: PlatformType;
    thumbnail_data_url: string;
    name?: string;
  }): Observable<ApiProject> {
    const preset = getPlatformPreset(opts.platform);
    const body = {
      name: opts.name ?? 'Untitled',
      width: preset?.width ?? 0,
      height: preset?.height ?? 0,
      canvas_json: JSON.stringify(opts.canvas_json),
      thumbnail: opts.thumbnail_data_url,
      // PX-060 T-0 — persist traceability + auto-apply marker server-side.
      source_template_id: opts.source_template_id,
      platform: opts.platform,
      brand_kit_applied_at: new Date().toISOString(),
    };
    return this.http.post<ApiProject>(`${this.baseUrl}/api/projects`, body);
  }
}

/**
 * Narrow structural alias so `createProjectFromTemplate`'s signature does not
 * pull in the full {@link Template} graph.
 *
 * @remarks
 * Structural equivalent of `FabricJson` from `template.model.ts`. Kept
 * co-located with the caller to avoid an import cycle if the models module
 * ever needs API types.
 */
type FabricJsonLike = { objects?: unknown[]; [key: string]: unknown };
