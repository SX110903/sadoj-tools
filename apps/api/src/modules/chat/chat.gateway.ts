import type { FastifyInstance } from "fastify";
import { isAcademyOnly, ROLE_PERMISSIONS, type RoleType } from "@sadoj/shared";
import { Server, type Namespace, type Socket } from "socket.io";
import type { Prisma } from "../../shared/prisma";
import { env } from "../../config/env";
import { verifyAccessToken } from "../../shared/utils/tokens";
import type { AuthenticatedUser } from "../../types/fastify";
import { ChatRoomEventSchema, SocketSendMessageSchema, TypingEventSchema } from "./chat.schema";
import { ChatService } from "./chat.service";

interface ClientToServerEvents {
  "join-room": (payload: unknown) => void;
  "leave-room": (payload: unknown) => void;
  "send-message": (payload: unknown) => void;
  "typing-start": (payload: unknown) => void;
  "typing-stop": (payload: unknown) => void;
}

interface ServerToClientEvents {
  "new-message": (payload: { message: unknown }) => void;
  "user-joined": (payload: { userId: string; displayName: string }) => void;
  "user-left": (payload: { userId: string }) => void;
  typing: (payload: { userId: string; displayName: string; isTyping: boolean }) => void;
  error: (payload: { code: string; message: string }) => void;
}

interface NotificationClientToServerEvents {
  ping: () => void;
}

interface NotificationServerToClientEvents {
  notification: (payload: NotificationSocketPayload) => void;
  "notification-count": (payload: { count: number }) => void;
  error: (payload: { code: string; message: string }) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  user: AuthenticatedUser;
  displayName: string;
}

type ChatSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type NotificationNamespace = Namespace<NotificationClientToServerEvents, NotificationServerToClientEvents, InterServerEvents, SocketData>;
type NotificationSocket = Socket<NotificationClientToServerEvents, NotificationServerToClientEvents, InterServerEvents, SocketData>;

export interface NotificationSocketPayload {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  meta: Prisma.JsonValue | null;
  createdAt: string;
}

let notificationsNamespace: NotificationNamespace | null = null;

export function emitNotificationToUser(recipientId: string, notification: NotificationSocketPayload | undefined, unreadCount: number): void {
  if (notificationsNamespace === null) {
    return;
  }

  const room = `user:${recipientId}`;
  if (notification !== undefined) {
    notificationsNamespace.to(room).emit("notification", notification);
  }
  notificationsNamespace.to(room).emit("notification-count", { count: unreadCount });
}

export function setupChatGateway(app: FastifyInstance): void {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(app.server, {
    cors: {
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true
    }
  });

  const namespace = io.of("/chat");
  const notificationNamespace: NotificationNamespace = io.of("/notifications");
  notificationsNamespace = notificationNamespace;

  namespace.use(async (socket, next) => {
    try {
      const tokenValue = socket.handshake.auth.token;

      if (typeof tokenValue !== "string") {
        next(new Error("TOKEN_REQUIRED"));
        return;
      }

      const payload = verifyAccessToken(tokenValue);
      const isBlacklisted = await app.redis.exists(`blacklist:access:${payload.tokenId}`);

      if (isBlacklisted === 1) {
        next(new Error("TOKEN_REVOKED"));
        return;
      }

      const user = await app.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, displayName: true, active: true } });

      if (user === null || !user.active) {
        next(new Error("USER_INACTIVE"));
        return;
      }

      const role = payload.role as RoleType;
      if (isAcademyOnly(role)) {
        next(new Error("OPERATIONAL_ACCESS_REQUIRED"));
        return;
      }

      socket.data.user = {
        id: user.id,
        role,
        tokenId: payload.tokenId,
        permissions: ROLE_PERMISSIONS[role]
      };
      socket.data.displayName = user.displayName;
      next();
    } catch {
      next(new Error("TOKEN_INVALID"));
    }
  });

  namespace.on("connection", (socket: ChatSocket) => {
    const service = new ChatService(app.prisma, app.redis);

    socket.on("join-room", (rawPayload) => {
      void handleJoinRoom(socket, service, rawPayload);
    });

    socket.on("leave-room", (rawPayload) => {
      const payload = ChatRoomEventSchema.safeParse(rawPayload);

      if (!payload.success) {
        emitSocketError(socket, "VALIDATION_ERROR", "Datos de sala inválidos.");
        return;
      }

      socket.leave(payload.data.roomId);
      socket.to(payload.data.roomId).emit("user-left", { userId: socket.data.user.id });
    });

    socket.on("send-message", (rawPayload) => {
      void handleSendMessage(socket, service, rawPayload);
    });

    socket.on("typing-start", (rawPayload) => {
      handleTyping(socket, rawPayload, true);
    });

    socket.on("typing-stop", (rawPayload) => {
      handleTyping(socket, rawPayload, false);
    });
  });

  notificationNamespace.use(async (socket, next) => {
    try {
      const tokenValue = socket.handshake.auth.token;

      if (typeof tokenValue !== "string") {
        next(new Error("TOKEN_REQUIRED"));
        return;
      }

      const payload = verifyAccessToken(tokenValue);
      const isBlacklisted = await app.redis.exists(`blacklist:access:${payload.tokenId}`);

      if (isBlacklisted === 1) {
        next(new Error("TOKEN_REVOKED"));
        return;
      }

      const user = await app.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, displayName: true, active: true } });

      if (user === null || !user.active) {
        next(new Error("USER_INACTIVE"));
        return;
      }

      const role = payload.role as RoleType;
      socket.data.user = {
        id: user.id,
        role,
        tokenId: payload.tokenId,
        permissions: ROLE_PERMISSIONS[role]
      };
      socket.data.displayName = user.displayName;
      next();
    } catch {
      next(new Error("TOKEN_INVALID"));
    }
  });

  notificationNamespace.on("connection", (socket: NotificationSocket) => {
    void socket.join(`user:${socket.data.user.id}`);
  });
}

async function handleJoinRoom(socket: ChatSocket, service: ChatService, rawPayload: unknown): Promise<void> {
  const payload = ChatRoomEventSchema.safeParse(rawPayload);

  if (!payload.success) {
    emitSocketError(socket, "VALIDATION_ERROR", "Datos de sala inválidos.");
    return;
  }

  try {
    await service.ensureParticipant(payload.data.roomId, socket.data.user.id);
    await socket.join(payload.data.roomId);
    socket.to(payload.data.roomId).emit("user-joined", { userId: socket.data.user.id, displayName: socket.data.displayName });
  } catch {
    emitSocketError(socket, "CHAT_ACCESS_DENIED", "No tienes acceso a esta sala.");
  }
}

async function handleSendMessage(socket: ChatSocket, service: ChatService, rawPayload: unknown): Promise<void> {
  const payload = SocketSendMessageSchema.safeParse(rawPayload);

  if (!payload.success) {
    emitSocketError(socket, "VALIDATION_ERROR", "El mensaje no es válido.");
    return;
  }

  try {
    const message = await service.sendMessage(payload.data.roomId, payload.data, socket.data.user);
    socket.nsp.to(payload.data.roomId).emit("new-message", { message });
  } catch {
    emitSocketError(socket, "CHAT_SEND_FAILED", "No se pudo enviar el mensaje.");
  }
}

function handleTyping(socket: ChatSocket, rawPayload: unknown, isTyping: boolean): void {
  const payload = TypingEventSchema.safeParse(rawPayload);

  if (!payload.success) {
    emitSocketError(socket, "VALIDATION_ERROR", "Datos de escritura inválidos.");
    return;
  }

  // Only emit if socket is actually in the room (joined via join-room which verifies membership)
  if (!socket.rooms.has(payload.data.roomId)) {
    emitSocketError(socket, "CHAT_ACCESS_DENIED", "No formas parte de esta sala de chat.");
    return;
  }

  socket.to(payload.data.roomId).emit("typing", { userId: socket.data.user.id, displayName: socket.data.displayName, isTyping });
}

function emitSocketError(socket: ChatSocket, code: string, message: string): void {
  socket.emit("error", { code, message });
}
