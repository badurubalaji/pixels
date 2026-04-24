"""
Real-time collaboration via WebSocket.

Each project has a "room". Connected clients exchange messages:
- cursor: { type: 'cursor', x, y, userId, userName, color }
- update: { type: 'update', canvasJson, userId }
- join: { type: 'join', userId, userName, color }
- leave: { type: 'leave', userId }
"""
import json
import logging
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

collab_router = APIRouter(tags=["Collaboration"])


class ConnectionManager:
    """Tracks active websocket connections per project room."""

    def __init__(self) -> None:
        self.rooms: Dict[str, Set[WebSocket]] = {}

    async def join(self, project_id: str, ws: WebSocket) -> None:
        if project_id not in self.rooms:
            self.rooms[project_id] = set()
        self.rooms[project_id].add(ws)

    def leave(self, project_id: str, ws: WebSocket) -> None:
        room = self.rooms.get(project_id)
        if room and ws in room:
            room.remove(ws)
            if not room:
                self.rooms.pop(project_id, None)

    async def broadcast(self, project_id: str, message: dict, exclude: WebSocket | None = None) -> None:
        room = self.rooms.get(project_id, set())
        payload = json.dumps(message)
        dead: list[WebSocket] = []
        for ws in room:
            if ws is exclude:
                continue
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"Send failed, dropping connection: {e}")
                dead.append(ws)
        for ws in dead:
            self.leave(project_id, ws)

    def room_size(self, project_id: str) -> int:
        return len(self.rooms.get(project_id, set()))


manager = ConnectionManager()


@collab_router.websocket("/ws/projects/{project_id}")
async def project_collab_socket(ws: WebSocket, project_id: str):
    await ws.accept()
    await manager.join(project_id, ws)

    user_info = None

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            if msg_type == "join":
                user_info = {
                    "userId": msg.get("userId"),
                    "userName": msg.get("userName", "Guest"),
                    "color": msg.get("color", "#7c3aed"),
                }
                # Broadcast join to others
                await manager.broadcast(project_id, {**msg, "type": "join"}, exclude=ws)

                # Inform new user about room size
                await ws.send_text(json.dumps({
                    "type": "room_info",
                    "size": manager.room_size(project_id),
                }))
            else:
                # Forward any other message to others in the room
                await manager.broadcast(project_id, msg, exclude=ws)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Collab socket error: {e}")
    finally:
        manager.leave(project_id, ws)
        if user_info:
            await manager.broadcast(project_id, {
                "type": "leave",
                "userId": user_info["userId"],
            })
