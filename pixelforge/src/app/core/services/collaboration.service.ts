import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { CanvasService } from './canvas.service';
import { environment } from '../../../environments/environment';

export interface RemoteUser {
  userId: string;
  userName: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
}

const USER_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#7c3aed', '#ec4899'];

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private readonly authService = inject(AuthService);
  private readonly canvasService = inject(CanvasService);

  private socket: WebSocket | null = null;
  private currentProjectId: string | null = null;
  private myUserId: string = crypto.randomUUID();
  private myColor: string = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  private cursorThrottle: any = null;
  private isApplyingRemote = false;

  private readonly _connected = signal(false);
  private readonly _remoteUsers = signal<Map<string, RemoteUser>>(new Map());

  readonly connected = this._connected.asReadonly();
  readonly remoteUsers = computed(() => Array.from(this._remoteUsers().values()));
  readonly remoteUserCount = computed(() => this._remoteUsers().size);

  /**
   * Connect to a project's collaboration room.
   */
  connect(projectId: string): void {
    if (this.currentProjectId === projectId && this.socket?.readyState === WebSocket.OPEN) {
      return;
    }
    this.disconnect();

    this.currentProjectId = projectId;

    const wsUrl = environment.apiUrl
      .replace(/^http/, 'ws')
      .replace(/\/$/, '') + `/api/ws/projects/${projectId}`;

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (e) {
      console.warn('WebSocket connection failed:', e);
      return;
    }

    this.socket.onopen = () => {
      this._connected.set(true);
      const user = this.authService.currentUser();
      this.send({
        type: 'join',
        userId: this.myUserId,
        userName: user?.name || user?.email || 'Guest',
        color: this.myColor,
      });
      this.setupCanvasListeners();
    };

    this.socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch {}
    };

    this.socket.onclose = () => {
      this._connected.set(false);
      this._remoteUsers.set(new Map());
    };

    this.socket.onerror = () => {
      this._connected.set(false);
    };
  }

  disconnect(): void {
    if (this.socket) {
      try { this.socket.close(); } catch {}
      this.socket = null;
    }
    this._connected.set(false);
    this._remoteUsers.set(new Map());
    this.currentProjectId = null;
  }

  /**
   * Send a cursor position update (throttled).
   */
  sendCursor(x: number, y: number): void {
    if (!this._connected()) return;
    if (this.cursorThrottle) return;

    this.cursorThrottle = setTimeout(() => {
      this.cursorThrottle = null;
    }, 60);

    this.send({
      type: 'cursor',
      userId: this.myUserId,
      x, y,
    });
  }

  /**
   * Send a canvas update (full state). Throttled by caller.
   */
  sendCanvasUpdate(canvasJson: string): void {
    if (!this._connected() || this.isApplyingRemote) return;
    this.send({
      type: 'update',
      userId: this.myUserId,
      canvasJson,
    });
  }

  private send(msg: any): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    try {
      this.socket.send(JSON.stringify(msg));
    } catch {}
  }

  private handleMessage(msg: any): void {
    switch (msg.type) {
      case 'join': {
        if (msg.userId === this.myUserId) return;
        this._remoteUsers.update(map => {
          const next = new Map(map);
          next.set(msg.userId, {
            userId: msg.userId,
            userName: msg.userName || 'Guest',
            color: msg.color || '#7c3aed',
          });
          return next;
        });
        break;
      }

      case 'leave': {
        this._remoteUsers.update(map => {
          const next = new Map(map);
          next.delete(msg.userId);
          return next;
        });
        break;
      }

      case 'cursor': {
        if (msg.userId === this.myUserId) return;
        this._remoteUsers.update(map => {
          const existing = map.get(msg.userId);
          if (!existing) return map;
          const next = new Map(map);
          next.set(msg.userId, { ...existing, cursorX: msg.x, cursorY: msg.y });
          return next;
        });
        break;
      }

      case 'update': {
        if (msg.userId === this.myUserId || !msg.canvasJson) return;
        this.isApplyingRemote = true;
        this.canvasService.loadFromJSON(msg.canvasJson).finally(() => {
          this.isApplyingRemote = false;
        });
        break;
      }
    }
  }

  private setupCanvasListeners(): void {
    const canvas = this.canvasService.getCanvas();
    if (!canvas) return;

    let updateTimer: any = null;
    const debouncedSend = () => {
      if (this.isApplyingRemote) return;
      if (updateTimer) clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        const json = this.canvasService.getCanvasJSON();
        this.sendCanvasUpdate(json);
      }, 400);
    };

    canvas.on('object:modified', debouncedSend);
    canvas.on('object:added', debouncedSend);
    canvas.on('object:removed', debouncedSend);

    // Cursor tracking
    canvas.on('mouse:move', (opt) => {
      const pointer = canvas.getViewportPoint(opt.e as MouseEvent);
      this.sendCursor(pointer.x, pointer.y);
    });
  }
}
