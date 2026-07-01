import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "../../auth/auth-context";
import { MentionTextarea } from "../mentions/MentionTextarea";
import { SecureImage } from "../common/SecureImage";
import { FileDropzone } from "../files/FileDropzone";
import { apiRequest } from "../../services/api";
import type { CaseFile, ChatMessage } from "../../types/sadoj";
import { shortDateTime } from "../../utils/labels";

interface ChatPanelProps {
  roomId: string;
  investigationId?: string;
}

interface UploadResult {
  file: CaseFile;
  thumbnailUrl?: string;
}

interface ServerToClientEvents {
  "new-message": (payload: { message: ChatMessage }) => void;
  "user-joined": (payload: { userId: string; displayName: string }) => void;
  "user-left": (payload: { userId: string }) => void;
  typing: (payload: { userId: string; displayName: string; isTyping: boolean }) => void;
  error: (payload: { code: string; message: string }) => void;
}

interface ClientToServerEvents {
  "join-room": (payload: { roomId: string }) => void;
  "leave-room": (payload: { roomId: string }) => void;
  "send-message": (payload: { roomId: string; content: string; fileId?: string; fileName?: string; mentions?: string[] }) => void;
  "typing-start": (payload: { roomId: string }) => void;
  "typing-stop": (payload: { roomId: string }) => void;
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = "http://127.0.0.1:3000/chat";

export function ChatPanel({ roomId, investigationId }: ChatPanelProps): JSX.Element {
  const { accessToken, refreshUser, user } = useAuth();
  const socketRef = useRef<ChatSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const loadMessages = async (before?: string): Promise<void> => {
    const cursor = before === undefined ? "" : `&before=${before}`;
    const result = await apiRequest<ChatMessage[]>(`/api/chat/${roomId}/messages?limit=50${cursor}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setMessages((current) => (before === undefined ? result.data : [...result.data, ...current]));
  };

  useEffect(() => {
    if (accessToken === null) return;

    void loadMessages();
    const socket: ChatSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelayMax: 10_000
    });

    socketRef.current = socket;
    socket.io.on("reconnect_attempt", () => {
      socket.auth = { token: accessToken };
    });
    socket.on("connect", () => {
      setErrorMessage(null);
      socket.emit("join-room", { roomId });
    });
    socket.on("disconnect", (reason) => {
      if (reason !== "io client disconnect") {
        setErrorMessage("Chat reconectando...");
      }
    });
    socket.on("new-message", (payload) => {
      setMessages((current) => (current.some((message) => message.id === payload.message.id) ? current : [...current, payload.message]));
    });
    socket.on("typing", (payload) => {
      if (payload.userId === user?.id) return;
      setTypingLabel(payload.isTyping ? `${payload.displayName} está escribiendo...` : null);
    });
    socket.on("error", (payload) => setErrorMessage(payload.message));
    socket.on("connect_error", () => {
      setErrorMessage("No se pudo conectar el chat. Reintentando...");
      void refreshUser();
    });

    return () => {
      socket.emit("leave-room", { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, roomId]);

  const handleSelectFile = (files: File[]): void => {
    setSelectedFile(files[0] ?? null);
  };

  const uploadSelectedFile = async (): Promise<{ fileId?: string; fileName?: string }> => {
    if (selectedFile === null || investigationId === undefined) return {};

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("targetType", "investigation");
    formData.append("targetId", investigationId);
    const result = await apiRequest<UploadResult>(
      `/api/files/upload?targetType=investigation&targetId=${investigationId}`,
      { method: "POST", body: formData },
      accessToken
    );

    if (result.error) {
      setErrorMessage(result.message);
      return {};
    }

    return { fileId: result.data.file.id, fileName: result.data.file.originalName };
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (content.trim().length === 0 && selectedFile === null) return;

    setIsSending(true);
    setErrorMessage(null);
    const uploadedFile = await uploadSelectedFile();
    const text = content.trim().length === 0 ? "Imagen adjunta" : content.trim();
    socketRef.current?.emit("send-message", { roomId, content: text, mentions, ...uploadedFile });
    setContent("");
    setMentions([]);
    setSelectedFile(null);
    setIsSending(false);
  };

  const oldestMessage = messages[0];

  return (
    <section className="chat-panel">
      <div className="chat-history">
        {oldestMessage !== undefined ? (
          <button type="button" className="secondary-link compact-button" onClick={() => void loadMessages(oldestMessage.id)}>
            Cargar anteriores
          </button>
        ) : null}
        {messages.length === 0 ? <p className="muted">Aún no hay mensajes en esta sala.</p> : null}
        {messages.map((message) => {
          const isMine = message.authorId === user?.id;

          return (
            <article className={isMine ? "message-row mine" : "message-row"} key={message.id}>
              <div className="message-bubble">
                <div className="message-meta">
                  <strong>{isMine ? "Yo" : message.author.displayName}</strong>
                  <span>{shortDateTime(message.createdAt)}</span>
                </div>
                <p>{message.content}</p>
                {message.fileId !== null ? (
                  <button type="button" className="chat-image-button" onClick={(event) => event.preventDefault()}>
                    <SecureImage fileId={message.fileId} alt={message.fileName ?? "Imagen adjunta"} className="chat-message-image" onClick={(url) => setLightboxUrl(url)} />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        {typingLabel !== null ? <p className="typing-indicator">{typingLabel}</p> : null}
      </div>
      {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
      {investigationId !== undefined ? (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,image/gif"
          allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif"]}
          files={selectedFile === null ? [] : [selectedFile]}
          helperText="JPG, PNG, WebP o GIF. Máximo 10 MB."
          isUploading={isSending && selectedFile !== null}
          onClear={() => setSelectedFile(null)}
          onFilesSelected={handleSelectFile}
        />
      ) : null}
      <form className="chat-form" onSubmit={(event) => void handleSend(event)}>
        <MentionTextarea
          value={content}
          mentions={mentions}
          rows={1}
          className="chat-mention-input"
          placeholder="Escribe un mensaje..."
          onBlur={() => socketRef.current?.emit("typing-stop", { roomId })}
          onChange={(value) => {
            setContent(value);
            socketRef.current?.emit("typing-start", { roomId });
          }}
          onMentionsChange={setMentions}
        />
        <button type="submit" className="primary-button" disabled={isSending}>
          <Send size={16} />
          Enviar
        </button>
      </form>
      {lightboxUrl !== null ? (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Imagen ampliada" />
        </div>
      ) : null}
    </section>
  );
}
