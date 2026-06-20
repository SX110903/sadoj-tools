import { Edit3, Pin, PinOff, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { RoleBadge, SkeletonBlock } from "../../components/ui";
import { MentionTextarea } from "../mentions/MentionTextarea";
import { apiRequest } from "../../services/api";
import type { NoteWithAuthor, RoleType } from "../../types/sadoj";
import { relativeDate } from "../../utils/labels";

type NotesTarget = "investigations" | "subjects" | "users";

interface NotesPanelProps {
  target: NotesTarget;
  targetId: string;
}

const ROLE_LEVEL: Readonly<Record<RoleType, number>> = {
  FISCAL_GENERAL: 10,
  FISCAL_ADJUNTO: 9,
  FISCAL_DIVISION: 8,
  FISCAL_SUPERIOR: 7,
  FISCAL_JEFE: 6,
  FISCAL: 5,
  FISCAL_AUXILIAR: 4,
  INVESTIGADOR_SENIOR: 3,
  INVESTIGADOR_JUNIOR: 2,
  PASANTE: 1
};

export function NotesPanel({ target, targetId }: NotesPanelProps): JSX.Element {
  const { accessToken, user, hasPermission } = useAuth();
  const [notes, setNotes] = useState<NoteWithAuthor[] | null>(null);
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState<string[]>([]);
  const [isConfidential, setIsConfidential] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canAddNotes = hasPermission("ADD_NOTES");
  const canUseConfidential = user !== null && ROLE_LEVEL[user.role as RoleType] >= ROLE_LEVEL.FISCAL_JEFE;

  const loadNotes = async (): Promise<void> => {
    const result = await apiRequest<NoteWithAuthor[]>(`/api/${target}/${targetId}/notes`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setNotes(result.data);
  };

  useEffect(() => {
    void loadNotes();
  }, [target, targetId, accessToken]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    const result = await apiRequest<NoteWithAuthor>(
      `/api/${target}/${targetId}/notes`,
      {
        method: "POST",
        body: JSON.stringify({ content, isConfidential, mentions })
      },
      accessToken
    );

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setContent("");
    setMentions([]);
    setIsConfidential(false);
    setNotes((current) => [result.data, ...(current ?? [])].sort(sortNotes));
  };

  const handlePin = async (note: NoteWithAuthor): Promise<void> => {
    const result = await apiRequest<NoteWithAuthor>(
      `/api/notes/${note.id}/pin`,
      { method: "PATCH", body: JSON.stringify({ isPinned: !note.isPinned }) },
      accessToken
    );

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setNotes((current) => (current ?? []).map((item) => (item.id === note.id ? result.data : item)).sort(sortNotes));
  };

  const handleEdit = async (note: NoteWithAuthor): Promise<void> => {
    const nextContent = window.prompt("Editar nota", note.content);

    if (nextContent === null || nextContent.trim().length === 0) {
      return;
    }

    const result = await apiRequest<NoteWithAuthor>(`/api/notes/${note.id}`, { method: "PUT", body: JSON.stringify({ content: nextContent }) }, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setNotes((current) => (current ?? []).map((item) => (item.id === note.id ? result.data : item)).sort(sortNotes));
  };

  const handleDelete = async (note: NoteWithAuthor): Promise<void> => {
    const confirmed = window.confirm("¿Eliminar esta nota?");

    if (!confirmed) return;

    const result = await apiRequest<{ deleted: boolean }>(`/api/notes/${note.id}`, { method: "DELETE" }, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setNotes((current) => (current ?? []).filter((item) => item.id !== note.id));
  };

  if (notes === null) {
    return <SkeletonBlock height={240} />;
  }

  return (
    <div className="stack">
      {canAddNotes ? (
        <form className="panel note-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            Nueva nota
            <MentionTextarea
              value={content}
              mentions={mentions}
              placeholder="Añadir una actualización operativa..."
              onChange={setContent}
              onMentionsChange={setMentions}
            />
          </label>
          <div className="actions-row">
            {canUseConfidential ? (
              <label className="inline-check">
                <input type="checkbox" checked={isConfidential} onChange={(event) => setIsConfidential(event.target.checked)} />
                Confidencial
              </label>
            ) : (
              <span className="muted">Las notas confidenciales requieren rango Fiscal Jefe o superior.</span>
            )}
            <button type="submit" className="primary-button" disabled={content.trim().length < 2}>
              Añadir nota
            </button>
          </div>
        </form>
      ) : null}
      {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
      <div className="compact-list">
        {notes.length === 0 ? <p className="muted">No hay notas registradas.</p> : null}
        {notes.map((note) => (
          <article className={`note-card ${note.isPinned ? "note-pinned" : ""}`} key={note.id}>
            <div className="note-header">
              <div className="person-cell">
                <div className="avatar small">{note.author.displayName.slice(0, 1)}</div>
                <div>
                  <strong>{note.author.displayName}</strong>
                  <div className="note-meta">
                    <RoleBadge role={note.author.role} />
                    <span>{relativeDate(note.createdAt)}</span>
                    {note.isConfidential ? <span className="badge badge-confidential">Confidencial</span> : null}
                    {note.isPinned ? <span className="badge badge-plain">Fijada</span> : null}
                  </div>
                </div>
              </div>
              <div className="toolbar">
                <button type="button" className="icon-button" aria-label={note.isPinned ? "Quitar fijado" : "Fijar nota"} onClick={() => void handlePin(note)}>
                  {note.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
                <button type="button" className="icon-button" aria-label="Editar nota" onClick={() => void handleEdit(note)}>
                  <Edit3 size={16} />
                </button>
                <button type="button" className="icon-button" aria-label="Eliminar nota" onClick={() => void handleDelete(note)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p>{note.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function sortNotes(left: NoteWithAuthor, right: NoteWithAuthor): number {
  if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}
