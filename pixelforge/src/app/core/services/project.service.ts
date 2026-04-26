import { Injectable, inject, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Project } from '../models/project.model';
import { ApiService, ApiProject } from './api.service';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'pixelforge_projects';
const UPLOADS_KEY = 'pixelforge_uploads';

export interface UploadedImage {
  id: string;
  name: string;
  dataUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly apiService = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly _projects = signal<Project[]>([]);
  private readonly _currentProject = signal<Project | null>(null);
  private readonly _uploadedImages = signal<UploadedImage[]>([]);
  private readonly _isSaving = signal(false);
  private readonly _lastSaved = signal<Date | null>(null);
  private readonly _useBackend = signal(false);

  readonly projects = computed(() => this._projects().filter(p => !p.deletedAt));
  readonly trashedProjects = computed(() => this._projects().filter(p => p.deletedAt));
  readonly currentProject = this._currentProject.asReadonly();
  readonly uploadedImages = this._uploadedImages.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly lastSaved = this._lastSaved.asReadonly();

  constructor() {
    this.loadProjects();
    this.loadUploads();
    this.checkBackend();
    this.purgeOldTrash();
  }

  private checkBackend(): void {
    this.apiService.healthCheck().subscribe({
      next: (res) => {
        // Only enable backend sync when the DB is actually connected.
        // Otherwise the API would accept reads (empty arrays) but reject writes.
        const dbReady = res.database === 'connected';
        this._useBackend.set(dbReady);
        if (dbReady) this.syncFromBackend();
      },
      error: () => this._useBackend.set(false),
    });
  }

  private syncFromBackend(): void {
    this.apiService.listProjects().subscribe(apiProjects => {
      if (apiProjects.length > 0) {
        const merged = this.mergeProjects(apiProjects);
        this._projects.set(merged);
      }
    });
  }

  /**
   * Reconcile the local project store with what the backend returned.
   *
   * PX-139 — last-writer-wins by `updatedAt`. Earlier shape silently
   * skipped any backend project whose id was already in localStorage,
   * which caused a stale resize / canvas-empty class of bug whenever
   * `persistProjects` had failed quietly on a previous session: the
   * backend held the truth, the merge ignored it.
   *
   * @param apiProjects - Backend project DTOs, ISO-string timestamps.
   * @returns The merged project list. New (backend-only) entries are
   *   appended; pre-existing entries are replaced when the backend's
   *   `updated_at` is strictly newer than the local `updatedAt`.
   * @remarks A local entry whose `updatedAt` is newer than backend's
   *   (an unsynced offline edit) is preserved unchanged — saveCanvasState
   *   will eventually reconcile it on the next save.
   */
  private mergeProjects(apiProjects: ApiProject[]): Project[] {
    const local = this._projects();
    const byId = new Map<string, Project>(local.map(p => [p.id, p]));

    for (const ap of apiProjects) {
      const incoming: Project = {
        id: ap.id,
        name: ap.name,
        width: ap.width,
        height: ap.height,
        thumbnail: ap.thumbnail,
        canvasJson: ap.canvas_json,
        createdAt: new Date(ap.created_at),
        updatedAt: new Date(ap.updated_at),
        layers: [],
      };
      const existing = byId.get(ap.id);
      if (!existing) {
        byId.set(ap.id, incoming);
        continue;
      }
      // PX-139 — only overwrite when backend is strictly newer. Equal-time
      // ties keep local (avoids clobbering an in-memory edit whose persist
      // hasn't fired yet). `existing.updatedAt` may be a string after a
      // JSON round-trip from localStorage, so coerce via `new Date(...)`
      // (no-op for an actual Date, parses for a string).
      const existingMs = new Date(existing.updatedAt).getTime();
      if (incoming.updatedAt.getTime() > existingMs) {
        // Preserve any local-only fields (deletedAt, tags) that backend
        // doesn't track, by spreading existing first.
        byId.set(ap.id, { ...existing, ...incoming });
      }
    }

    // Maintain original local order so the recent-projects strip on /hub
    // doesn't reshuffle on every backend sync.
    const merged: Project[] = local.map(p => byId.get(p.id) ?? p);
    for (const ap of apiProjects) {
      if (!local.some(p => p.id === ap.id)) {
        merged.unshift(byId.get(ap.id)!);
      }
    }
    return merged;
  }

  createProject(name: string, width: number, height: number): Project {
    const project: Project = {
      id: uuidv4(),
      name,
      width,
      height,
      createdAt: new Date(),
      updatedAt: new Date(),
      layers: [],
    };

    this._projects.update(projects => [project, ...projects]);
    this._currentProject.set(project);
    this.persistProjects();

    // Sync to backend
    if (this._useBackend()) {
      this.apiService.createProject({ name, width, height }).subscribe({
        next: (apiProject) => {
          // Update local ID to match backend
          const backendId = apiProject.id;
          this._projects.update(projects =>
            projects.map(p => p.id === project.id ? { ...p, id: backendId } : p)
          );
          if (this._currentProject()?.id === project.id) {
            this._currentProject.update(p => p ? { ...p, id: backendId } : p);
          }
          project.id = backendId;
        },
      });
    }

    return project;
  }

  /**
   * Open a project by id. Sets `_currentProject` immediately from the
   * local store (optimistic), then — when backend sync is on — always
   * re-fetches and replaces it if the backend version is newer.
   *
   * PX-139 — earlier shape only fetched from backend when the project
   * wasn't local at all, so any post-localStorage-quota stale state
   * lived forever. Now backend is the source of truth whenever it's
   * connected, with `updatedAt` as the tiebreaker so unsynced offline
   * edits aren't clobbered.
   */
  openProject(id: string): Project | null {
    const local = this._projects().find(p => p.id === id) ?? null;
    this._currentProject.set(local);

    if (this._useBackend()) {
      this.apiService.getProject(id).subscribe({
        next: (apiProject) => {
          const loaded: Project = {
            id: apiProject.id,
            name: apiProject.name,
            width: apiProject.width,
            height: apiProject.height,
            thumbnail: apiProject.thumbnail,
            canvasJson: apiProject.canvas_json,
            createdAt: new Date(apiProject.created_at),
            updatedAt: new Date(apiProject.updated_at),
            layers: [],
          };

          const localCopy = this._projects().find(p => p.id === id) ?? null;
          // `localCopy.updatedAt` may be a string post JSON round-trip;
          // coerce defensively.
          const backendIsNewer =
            !localCopy ||
            loaded.updatedAt.getTime() > new Date(localCopy.updatedAt).getTime();

          if (backendIsNewer) {
            this._projects.update(ps => {
              const existing = ps.find(p => p.id === loaded.id);
              if (!existing) return [loaded, ...ps];
              return ps.map(p =>
                p.id === loaded.id ? { ...existing, ...loaded } : p,
              );
            });
            this._currentProject.set(loaded);
            this.persistProjects();
          }
        },
      });
    }

    return local;
  }

  /**
   * Save the canvas state (JSON + thumbnail) to the current project.
   */
  saveCanvasState(projectId: string, canvasJson: string, thumbnail: string): void {
    this._isSaving.set(true);

    this._projects.update(projects =>
      projects.map(p =>
        p.id === projectId
          ? { ...p, canvasJson, thumbnail, updatedAt: new Date() }
          : p
      )
    );

    const current = this._currentProject();
    if (current?.id === projectId) {
      this._currentProject.set({ ...current, canvasJson, thumbnail, updatedAt: new Date() });
    }

    this.persistProjects();

    // Sync to backend
    if (this._useBackend()) {
      this.apiService.updateProject(projectId, {
        canvas_json: canvasJson,
        thumbnail,
      }).subscribe({
        next: () => {},
        error: () => console.warn('Backend save failed, data persisted locally'),
      });
    }

    this._lastSaved.set(new Date());
    this._isSaving.set(false);
  }

  /**
   * Get the saved canvas JSON for a project.
   */
  getCanvasState(projectId: string): string | undefined {
    return this._projects().find(p => p.id === projectId)?.canvasJson;
  }

  updateProject(id: string, updates: Partial<Project>): void {
    this._projects.update(projects =>
      projects.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      )
    );

    const current = this._currentProject();
    if (current?.id === id) {
      this._currentProject.set({ ...current, ...updates, updatedAt: new Date() });
    }

    this.persistProjects();
  }

  setTags(projectId: string, tags: string[]): void {
    this._projects.update(projects =>
      projects.map(p => p.id === projectId ? { ...p, tags, updatedAt: new Date() } : p)
    );

    const current = this._currentProject();
    if (current?.id === projectId) {
      this._currentProject.update(p => p ? { ...p, tags, updatedAt: new Date() } : p);
    }

    this.persistProjects();
  }

  duplicateProject(id: string): Project | null {
    const original = this._projects().find(p => p.id === id);
    if (!original) return null;

    const dup: Project = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this._projects.update(projects => [dup, ...projects]);
    this.persistProjects();

    if (this._useBackend()) {
      this.apiService.createProject({ name: dup.name, width: dup.width, height: dup.height })
        .subscribe(apiProject => {
          const backendId = apiProject.id;
          this._projects.update(projects =>
            projects.map(p => p.id === dup.id ? { ...p, id: backendId } : p)
          );
          // Push canvas state
          if (dup.canvasJson) {
            this.apiService.updateProject(backendId, {
              canvas_json: dup.canvasJson,
              thumbnail: dup.thumbnail,
            }).subscribe();
          }
        });
    }

    return dup;
  }

  /** Soft delete: move to trash. */
  deleteProject(id: string): void {
    this._projects.update(projects =>
      projects.map(p => p.id === id ? { ...p, deletedAt: new Date() } : p)
    );

    if (this._currentProject()?.id === id) {
      this._currentProject.set(null);
    }

    this.persistProjects();
    // Note: backend deletion happens at permanent delete
  }

  /** Restore a project from trash. */
  restoreProject(id: string): void {
    this._projects.update(projects =>
      projects.map(p => p.id === id ? { ...p, deletedAt: null } : p)
    );
    this.persistProjects();
  }

  /** Permanently delete a project. */
  permanentlyDelete(id: string): void {
    this._projects.update(projects => projects.filter(p => p.id !== id));
    this.persistProjects();

    if (this._useBackend()) {
      this.apiService.deleteProject(id).subscribe({ error: () => {} });
    }
  }

  /** Empty all items in trash permanently. */
  emptyTrash(): void {
    const trashed = this._projects().filter(p => p.deletedAt);
    for (const p of trashed) {
      this.permanentlyDelete(p.id);
    }
  }

  /** Auto-purge items deleted more than 30 days ago. */
  purgeOldTrash(): void {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const toDelete = this._projects()
      .filter(p => p.deletedAt && new Date(p.deletedAt).getTime() < cutoff);
    for (const p of toDelete) {
      this.permanentlyDelete(p.id);
    }
  }

  // ============================
  // Uploaded images persistence
  // ============================

  getUploadedImages(): UploadedImage[] {
    return this._uploadedImages();
  }

  addUploadedImage(name: string, dataUrl: string): UploadedImage {
    const img: UploadedImage = { id: uuidv4(), name, dataUrl };
    this._uploadedImages.update(imgs => [...imgs, img]);
    this.persistUploads();
    return img;
  }

  removeUploadedImage(id: string): void {
    this._uploadedImages.update(imgs => imgs.filter(img => img.id !== id));
    this.persistUploads();
  }

  // ============================
  // Persistence
  // ============================

  private loadProjects(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this._projects.set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  }

  private persistProjects(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._projects()));
    } catch (e) {
      console.error('Failed to save projects:', e);
      // localStorage might be full — try to save without thumbnails
      try {
        const slim = this._projects().map(p => ({ ...p, thumbnail: undefined }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      } catch {
        // PX-139 — second-tier failure. Previously this was a silent
        // console.error which let users keep editing while their state
        // existed only in this tab; refreshing then quietly lost work.
        // Surface a snackbar so they can act before they navigate away.
        console.error('localStorage is full');
        this.snackBar.open(
          'Local storage full — your latest changes only exist in this tab. Refreshing may lose them.',
          'OK',
          { duration: 8000 },
        );
      }
    }
  }

  private loadUploads(): void {
    try {
      const stored = localStorage.getItem(UPLOADS_KEY);
      if (stored) {
        this._uploadedImages.set(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load uploads:', e);
    }
  }

  private persistUploads(): void {
    try {
      localStorage.setItem(UPLOADS_KEY, JSON.stringify(this._uploadedImages()));
    } catch (e) {
      console.error('Failed to save uploads:', e);
    }
  }
}
