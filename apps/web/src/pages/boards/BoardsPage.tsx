import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../auth/auth-context";
import { EvidenceBoardWorkspace } from "../../components/boards/EvidenceBoardWorkspace";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";

interface GlobalBoardSummary {
  id: string;
  title: string;
  ownerId: string;
  updatedAt: string;
  _count: {
    cards: number;
    steps: number;
  };
}

interface GlobalBoardCreateResponse {
  id: string;
}

export function BoardsPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [boards, setBoards] = useState<GlobalBoardSummary[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const loadBoards = async (): Promise<void> => {
    setIsLoading(true);
    setLoadErrorMessage(null);
    const result = await apiRequest<GlobalBoardSummary[]>("/api/boards/global", {}, accessToken);
    setIsLoading(false);

    if (result.error) {
      setBoards([]);
      setLoadErrorMessage(result.message);
      return;
    }

    setBoards(result.data);
    setSelectedBoardId((current) => current ?? result.data[0]?.id ?? null);
  };

  useEffect(() => {
    void loadBoards();
  }, [accessToken]);

  const handleCreateBoard = async (): Promise<void> => {
    const title = newBoardTitle.trim();
    if (title.length === 0) {
      setCreateErrorMessage("Escribe un nombre para crear la pizarra.");
      return;
    }

    setIsCreating(true);
    setCreateErrorMessage(null);
    const result = await apiRequest<GlobalBoardCreateResponse>("/api/boards/global", { method: "POST", body: JSON.stringify({ title }) }, accessToken);
    setIsCreating(false);

    if (result.error) {
      setCreateErrorMessage(result.message);
      return;
    }

    setNewBoardTitle("");
    setSelectedBoardId(result.data.id);
    await loadBoards();
  };

  const handleDeleteBoard = async (boardId: string): Promise<void> => {
    setActionErrorMessage(null);
    const result = await apiRequest<{ deleted: boolean }>(`/api/boards/global/${boardId}`, { method: "DELETE" }, accessToken);

    if (result.error) {
      setActionErrorMessage(result.message);
      return;
    }

    setSelectedBoardId((current) => (current === boardId ? null : current));
    await loadBoards();
  };

  if (isLoading) {
    return <SkeletonBlock height={620} />;
  }

  if (loadErrorMessage !== null && boards.length === 0) {
    return <EmptyState title={loadErrorMessage} action={<RetryButton onRetry={() => void loadBoards()} />} />;
  }

  return (
    <div className="page boards-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Análisis de evidencia</p>
          <h1>Pizarras globales</h1>
          <p className="muted">Organiza fases, imágenes y notas de varias investigaciones en un muro compartido.</p>
        </div>
        <form className="boards-create-form" onSubmit={(event) => { event.preventDefault(); void handleCreateBoard(); }}>
          <div className="boards-create-field">
            <input
              value={newBoardTitle}
              placeholder="Nombre de la pizarra"
              maxLength={120}
              aria-label="Nombre de la pizarra"
              aria-invalid={createErrorMessage !== null}
              aria-describedby={createErrorMessage !== null ? "board-create-error" : undefined}
              onChange={(event) => {
                setNewBoardTitle(event.target.value);
                setCreateErrorMessage(null);
              }}
            />
            {createErrorMessage !== null ? <span id="board-create-error" className="field-error" role="alert">{createErrorMessage}</span> : null}
          </div>
          <button type="submit" className="primary-button" disabled={isCreating}>
            <Plus size={16} />
            {isCreating ? "Creando..." : "Crear pizarra"}
          </button>
        </form>
      </header>
      {actionErrorMessage !== null ? <p className="error-message">{actionErrorMessage}</p> : null}
      <div className="boards-global-layout">
        <aside className="boards-list-panel">
          <h2>Pizarras</h2>
          {boards.length === 0 ? <p className="muted">Todavía no hay pizarras globales.</p> : null}
          {boards.map((board) => (
            <div key={board.id} className={`boards-list-item ${board.id === selectedBoardId ? "active" : ""}`}>
              <button type="button" onClick={() => setSelectedBoardId(board.id)}>
                <strong>{board.title}</strong>
                <span>{board._count.steps} pasos · {board._count.cards} elementos</span>
              </button>
              <button type="button" className="boards-delete-action" aria-label="Eliminar pizarra" onClick={() => void handleDeleteBoard(board.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </aside>
        <EvidenceBoardWorkspace scope="global" boardId={selectedBoardId} />
      </div>
    </div>
  );
}
