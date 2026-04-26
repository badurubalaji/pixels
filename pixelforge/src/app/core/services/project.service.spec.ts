/**
 * PX-139 — coverage for the project-sync regressions:
 *   - mergeProjects: backend-fresh-wins by updatedAt
 *   - openProject: always-fetch-when-backend-on, replaces local on newer backend
 *   - persistProjects: surfaces a snackbar when localStorage is full
 *
 * Earlier failure mode (no spec): silent precedence of stale local state
 * over a strictly-newer backend canvas_json caused image-resize regressions
 * across refreshes.
 */

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProjectService } from './project.service';
import { ApiService, ApiProject } from './api.service';

const STORAGE_KEY = 'pixelforge_projects';

describe('ProjectService — PX-139 backend-fresh-wins sync', () => {
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let api: {
    healthCheck: ReturnType<typeof vi.fn>;
    listProjects: ReturnType<typeof vi.fn>;
    getProject: ReturnType<typeof vi.fn>;
    updateProject: ReturnType<typeof vi.fn>;
    createProject: ReturnType<typeof vi.fn>;
  };

  const setup = () => {
    snackBar = { open: vi.fn() };
    api = {
      // Default to db-disconnected so tests opt in to backend explicitly.
      healthCheck: vi.fn().mockReturnValue(of({ status: 'ok', database: 'disconnected' })),
      listProjects: vi.fn().mockReturnValue(of([])),
      getProject: vi.fn(),
      updateProject: vi.fn().mockReturnValue(of({})),
      createProject: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ProjectService,
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ApiService, useValue: api },
      ],
    });
  };

  beforeEach(() => {
    localStorage.clear();
    setup();
  });

  // --- AC-1: mergeProjects last-writer-wins ----------------------------------

  describe('mergeProjects (AC-1)', () => {
    const localProj = (id: string, updatedAtIso: string, canvasJson = 'OLD') => ({
      id,
      name: 'P',
      width: 800,
      height: 600,
      thumbnail: '',
      canvasJson,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date(updatedAtIso),
      layers: [],
    });

    const apiProj = (id: string, updatedAtIso: string, canvas_json = 'NEW'): ApiProject => ({
      id,
      name: 'P',
      width: 800,
      height: 600,
      thumbnail: '',
      canvas_json,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: updatedAtIso,
    });

    it('updates existing entry when backend.updated_at > local.updatedAt', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([localProj('p1', '2026-04-26T10:00:00.000Z')]),
      );
      api.healthCheck.mockReturnValue(of({ status: 'ok', database: 'connected' }));
      api.listProjects.mockReturnValue(of([apiProj('p1', '2026-04-26T11:00:00Z', 'NEW')]));

      const svc = TestBed.inject(ProjectService);
      const found = svc.projects().find(p => p.id === 'p1');
      expect(found?.canvasJson).toBe('NEW');
    });

    it('keeps local entry when local.updatedAt > backend.updated_at (offline-edit safe)', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([localProj('p1', '2026-04-26T12:00:00.000Z', 'LOCAL_NEW')]),
      );
      api.healthCheck.mockReturnValue(of({ status: 'ok', database: 'connected' }));
      api.listProjects.mockReturnValue(of([apiProj('p1', '2026-04-26T11:00:00Z', 'BACKEND_OLD')]));

      const svc = TestBed.inject(ProjectService);
      const found = svc.projects().find(p => p.id === 'p1');
      expect(found?.canvasJson).toBe('LOCAL_NEW');
    });

    it('PX-147: preserves local canvasJson when backend list-response lacks it', () => {
      // GET /api/projects strips canvas_json for performance.
      // Backend updated_at is reliably newer than local (clock drift /
      // network latency), so the merge fires every boot. Without the
      // nullish-preserve guard, this wipes the user's saved canvas.
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([localProj('p1', '2026-04-26T10:00:00.000Z', 'GOOD_CANVAS')]),
      );
      api.healthCheck.mockReturnValue(of({ status: 'ok', database: 'connected' }));
      // List endpoint with NO canvas_json field.
      api.listProjects.mockReturnValue(
        of([{
          id: 'p1',
          name: 'P',
          width: 800,
          height: 600,
          thumbnail: '',
          // canvas_json intentionally omitted (the bug surface).
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-04-26T11:00:00Z',
        }]),
      );

      const svc = TestBed.inject(ProjectService);
      const found = svc.projects().find(p => p.id === 'p1');
      // The user's edit must survive the boot-time merge.
      expect(found?.canvasJson).toBe('GOOD_CANVAS');
    });

    it('appends backend-only entries (preserves new behavior)', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([localProj('p1', '2026-04-26T10:00:00.000Z')]),
      );
      api.healthCheck.mockReturnValue(of({ status: 'ok', database: 'connected' }));
      api.listProjects.mockReturnValue(
        of([apiProj('p2', '2026-04-26T11:00:00Z', 'NEW_REMOTE')]),
      );

      const svc = TestBed.inject(ProjectService);
      const ids = svc.projects().map(p => p.id);
      expect(ids).toContain('p1');
      expect(ids).toContain('p2');
    });
  });

  // --- AC-2: openProject always re-fetches when backend on -------------------

  describe('openProject (AC-2)', () => {
    it('replaces local project with backend version when backend is newer', () => {
      const local = {
        id: 'p1',
        name: 'P',
        width: 800,
        height: 600,
        thumbnail: '',
        canvasJson: 'STALE',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-04-26T10:00:00.000Z'),
        layers: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([local]));
      api.healthCheck.mockReturnValue(of({ status: 'ok', database: 'connected' }));
      api.getProject.mockReturnValue(
        of({
          id: 'p1',
          name: 'P',
          width: 800,
          height: 600,
          thumbnail: '',
          canvas_json: 'FRESH',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-04-26T11:00:00Z',
        }),
      );

      const svc = TestBed.inject(ProjectService);
      svc.openProject('p1');

      expect(api.getProject).toHaveBeenCalledWith('p1');
      expect(svc.currentProject()?.canvasJson).toBe('FRESH');
    });

    it('keeps local project when local is newer than backend', () => {
      const local = {
        id: 'p1',
        name: 'P',
        width: 800,
        height: 600,
        thumbnail: '',
        canvasJson: 'LOCAL_NEW',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-04-26T12:00:00.000Z'),
        layers: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([local]));
      api.healthCheck.mockReturnValue(of({ status: 'ok', database: 'connected' }));
      api.getProject.mockReturnValue(
        of({
          id: 'p1',
          name: 'P',
          width: 800,
          height: 600,
          thumbnail: '',
          canvas_json: 'BACKEND_OLD',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-04-26T11:00:00Z',
        }),
      );

      const svc = TestBed.inject(ProjectService);
      svc.openProject('p1');

      expect(svc.currentProject()?.canvasJson).toBe('LOCAL_NEW');
    });
  });

  // --- AC-4: persistProjects surfaces snackbar on hard quota failure ---------

  describe('persistProjects (AC-4)', () => {
    it('opens a snackbar when both setItem attempts throw', () => {
      const setItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      const svc = TestBed.inject(ProjectService);
      // Trigger persistProjects via a save that doesn't need a real project.
      svc.createProject('test', 100, 100);

      expect(snackBar.open).toHaveBeenCalledTimes(1);
      const [msg] = snackBar.open.mock.calls[0];
      expect(msg).toMatch(/Local storage full/i);

      setItem.mockRestore();
    });
  });
});
