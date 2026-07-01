import { Network, Plus, Search, StickyNote, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import {
  useEvidenceBoard,
  type CreateBoardStepPayload,
  type UseEvidenceBoardOptions
} from "../../hooks/useEvidenceBoard";
import { apiRequest } from "../../services/api";
import type { BoardCard, BoardEntityType, BoardStep, CaseFile } from "../../types/sadoj";
import { BoardPlanningPanel } from "./BoardPlanningPanel";
import { BoardStepDialog } from "./BoardStepDialog";
import { BoardWall, type BoardCardLayoutChange } from "./BoardWall";
import { FileDropzone } from "../files/FileDropzone";
import { EmptyState, RetryButton, SkeletonBlock } from "../ui";

type EvidenceBoardWorkspaceProps =
  | {
      scope: "subject" | "investigation";
      targetId: string;
      title?: string;
    }
  | {
      scope: "global";
      boardId: string | null;
      title?: string;
    };

type BoardTool = "image" | "note" | "entity";

interface FileUploadResponse {
  file: CaseFile;
  thumbnailUrl?: string;
}

interface SearchResultItem {
  id: string;
  type: BoardEntityType;
  label: string;
  description: string;
  href: string;
}

interface SearchResults {
  investigations: SearchResultItem[];
  subjects: SearchResultItem[];
  organizations: SearchResultItem[];
  documents: SearchResultItem[];
  properties: SearchResultItem[];
}

const SEARCH_RESULT_KEYS: readonly (keyof SearchResults)[] = ["investigations", "subjects", "organizations", "documents", "properties"];
const BOARD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const NOTE_COLORS = ["#f6e7a1", "#b8d8c0", "#b9d7ea", "#e7c0d3"] as const;

export function EvidenceBoardWorkspace(props: EvidenceBoardWorkspaceProps): JSX.Element {
  const { accessToken } = useAuth();
  const boardOptions: UseEvidenceBoardOptions = props.scope === "global"
    ? { scope: "global", boardId: props.boardId }
    : { scope: props.scope, targetId: props.targetId };
  const boardState = useEvidenceBoard(boardOptions);
  const {
    board,
    isLoading,
    isMutating,
    loadErrorMessage,
    actionErrorMessage,
    refresh,
    createCard,
    updateCard,
    updatePositions,
    deleteCard,
    createStep,
    updateStep,
    reorderSteps,
    deleteStep,
    uploadStepImage
  } = boardState;
  const [activeTool, setActiveTool] = useState<BoardTool>("image");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [noteColor, setNoteColor] = useState<string>(NOTE_COLORS[0]);
  const [entityQuery, setEntityQuery] = useState("");
  const [entityResults, setEntityResults] = useState<SearchResultItem[]>([]);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editColor, setEditColor] = useState("#f6e7a1");
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<BoardStep | null>(null);
  const selectedCard = useMemo(
    () => board?.cards.find((card) => card.id === selectedCardId) ?? null,
    [board?.cards, selectedCardId]
  );

  useEffect(() => {
    if (selectedCard === null) {
      setEditTitle("");
      setEditText("");
      return;
    }

    setEditTitle(selectedCard.title);
    setEditText(selectedCard.text ?? "");
    setEditColor(selectedCard.color);
  }, [selectedCard]);

  useEffect(() => {
    if (activeTool !== "entity" || entityQuery.trim().length < 2) {
      setEntityResults([]);
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      void apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(entityQuery.trim())}`, { suppressToast: true }, accessToken).then((result) => {
        if (!isActive) return;
        setEntityResults(result.error ? [] : SEARCH_RESULT_KEYS.flatMap((key) => result.data[key]));
      });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [accessToken, activeTool, entityQuery]);

  const handleLayoutChange = useCallback((change: BoardCardLayoutChange): void => {
    void updatePositions([change]);
  }, [updatePositions]);

  const handleUploadImages = async (): Promise<void> => {
    if (board === null || selectedFiles.length === 0) return;

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      if (file === undefined) continue;
      const formData = new FormData();
      formData.append("file", file);
      setUploadProgress(Math.round((index / selectedFiles.length) * 100));
      const uploadPath = `/api/files/upload?targetType=evidenceBoard&targetId=${encodeURIComponent(board.id)}`;
      const result = await apiRequest<FileUploadResponse>(uploadPath, { method: "POST", body: formData }, accessToken);

      if (result.error) {
        setUploadProgress(0);
        return;
      }

      const created = await createCard({
        type: "EVIDENCE",
        title: result.data.file.originalName,
        fileId: result.data.file.id,
        x: 110 + index * 34,
        y: 110 + index * 30,
        width: 270,
        height: 220,
        rotation: index % 2 === 0 ? -1.4 : 1.4
      });

      if (!created) {
        setUploadProgress(0);
        return;
      }
    }

    setSelectedFiles([]);
    setUploadProgress(0);
  };

  const handleCreateNote = async (): Promise<void> => {
    const text = noteText.trim();
    const created = await createCard({
      type: "NOTE",
      title: "Nota",
      text: text.length > 0 ? text : "Nota sin contenido",
      color: noteColor,
      x: 180,
      y: 180,
      width: 220,
      height: 180,
      rotation: -1
    });

    if (created) {
      setNoteText("");
      setActiveTool("image");
    }
  };

  const handleCreateEntity = async (item: SearchResultItem): Promise<void> => {
    const created = await createCard({
      type: "ENTITY",
      title: item.label,
      text: item.description,
      entityType: item.type,
      entityId: item.id,
      color: "#c7d9e8",
      x: 220,
      y: 220,
      width: 240,
      height: 170,
      rotation: 1
    });

    if (created) {
      setEntityQuery("");
      setEntityResults([]);
      setActiveTool("image");
    }
  };

  const handleSaveSelectedCard = async (): Promise<void> => {
    if (selectedCard === null) return;
    await updateCard(selectedCard.id, {
      title: editTitle.trim(),
      text: editText.trim().length > 0 ? editText.trim() : null,
      color: editColor
    });
  };

  const handleDeleteSelectedCard = async (): Promise<void> => {
    if (selectedCard === null || !window.confirm(`¿Eliminar "${selectedCard.title}" del muro?`)) return;
    const deleted = await deleteCard(selectedCard.id);
    if (deleted) setSelectedCardId(null);
  };

  const handleMoveStep = (stepId: string, direction: -1 | 1): void => {
    if (board === null) return;
    const currentIndex = board.steps.findIndex((step) => step.id === stepId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= board.steps.length) return;
    const orderedIds = board.steps.map((step) => step.id);
    const targetId = orderedIds[targetIndex];
    if (targetId === undefined) return;
    orderedIds[targetIndex] = stepId;
    orderedIds[currentIndex] = targetId;
    void reorderSteps(orderedIds);
  };

  const handleDeleteStep = async (step: BoardStep): Promise<void> => {
    if (!window.confirm(`¿Eliminar el paso #${step.order} "${step.title}"?`)) return;
    await deleteStep(step.id);
  };

  const handleSaveStep = async (payload: CreateBoardStepPayload, image: File | null): Promise<boolean> => {
    if (editingStep !== null) {
      const updated = await updateStep(editingStep.id, payload);
      if (!updated) return false;
      return image === null ? true : uploadStepImage(editingStep.id, image);
    }

    const createdStep = await createStep(payload);
    if (createdStep === null) return false;
    if (image === null) return true;
    const uploaded = await uploadStepImage(createdStep.id, image);
    if (!uploaded) setEditingStep(createdStep);
    return uploaded;
  };

  const openNewStep = (): void => {
    setEditingStep(null);
    setIsStepDialogOpen(true);
  };

  const openEditStep = (step: BoardStep): void => {
    setEditingStep(step);
    setIsStepDialogOpen(true);
  };

  if (props.scope === "global" && props.boardId === null) {
    return <EmptyState title="Selecciona o crea una pizarra global." description="Las pizarras globales agrupan planes y material de varias investigaciones." />;
  }

  if (isLoading) return <SkeletonBlock height={700} />;
  if (loadErrorMessage !== null) return <EmptyState title={loadErrorMessage} action={<RetryButton onRetry={() => void refresh()} />} />;
  if (board === null) return <EmptyState title="No se pudo cargar la pizarra." action={<RetryButton onRetry={() => void refresh()} />} />;

  return (
    <section className="planning-board-shell">
      <header className="planning-board-header">
        <div>
          <p className="eyebrow">{props.title ?? scopeLabel(board.scope)}</p>
          <h2>{board.title}</h2>
          <p className="muted">{board.steps.length} pasos · {board.cards.length} elementos en el muro</p>
        </div>
        <div className="planning-board-legend" aria-label="Leyenda">
          <span><i className="legend-pending" />Pendiente</span>
          <span><i className="legend-progress" />En curso</span>
          <span><i className="legend-done" />Hecho</span>
        </div>
      </header>
      {actionErrorMessage !== null ? <p className="error-message planning-board-action-error" role="alert">{actionErrorMessage}</p> : null}
      <div className="planning-board-layout">
        <aside className="planning-board-tools">
          <BoardToolTabs activeTool={activeTool} onChange={setActiveTool} />
          {activeTool === "image" ? (
            <div className="board-tool-section">
              <h3>Añadir imagen</h3>
              <FileDropzone
                files={selectedFiles}
                accept="image/jpeg,image/png,image/webp,image/gif"
                allowedTypes={BOARD_IMAGE_TYPES}
                helperText="JPG, PNG, WebP o GIF. Máximo 10 MB."
                isUploading={isMutating || uploadProgress > 0}
                progressPercent={uploadProgress}
                multiple
                capturePaste
                onFilesSelected={setSelectedFiles}
                onClear={() => setSelectedFiles([])}
              />
              <button type="button" className="primary-button" disabled={selectedFiles.length === 0 || isMutating} onClick={() => void handleUploadImages()}>
                <Plus size={16} />Pegar en el muro
              </button>
            </div>
          ) : null}
          {activeTool === "note" ? (
            <div className="board-tool-section">
              <h3>Nueva nota</h3>
              <textarea value={noteText} rows={5} placeholder="Escribe una indicación para el equipo" onChange={(event) => setNoteText(event.target.value)} />
              <div className="board-note-colors" aria-label="Color de la nota">
                {NOTE_COLORS.map((color) => (
                  <button key={color} type="button" className={noteColor === color ? "active" : ""} style={{ background: color }} aria-label={`Color ${color}`} onClick={() => setNoteColor(color)} />
                ))}
              </div>
              <button type="button" className="primary-button" disabled={isMutating} onClick={() => void handleCreateNote()}>
                <Plus size={16} />Pegar nota
              </button>
            </div>
          ) : null}
          {activeTool === "entity" ? (
            <div className="board-tool-section">
              <h3>Vincular entidad</h3>
              <label className="board-search-field">
                <Search size={16} />
                <input value={entityQuery} placeholder="Buscar sujeto, investigación..." onChange={(event) => setEntityQuery(event.target.value)} />
              </label>
              <div className="board-search-results">
                {entityResults.map((item) => (
                  <button key={`${item.type}:${item.id}`} type="button" disabled={isMutating} onClick={() => void handleCreateEntity(item)}>
                    <strong>{item.label}</strong>
                    <span>{entityTypeLabel(item.type)} · {item.description}</span>
                  </button>
                ))}
                {entityQuery.trim().length >= 2 && entityResults.length === 0 ? <p className="muted">Sin resultados.</p> : null}
              </div>
            </div>
          ) : null}
          <BoardCardEditor
            card={selectedCard}
            title={editTitle}
            text={editText}
            color={editColor}
            isMutating={isMutating}
            onTitleChange={setEditTitle}
            onTextChange={setEditText}
            onColorChange={setEditColor}
            onSave={() => void handleSaveSelectedCard()}
            onDelete={() => void handleDeleteSelectedCard()}
          />
        </aside>
        <BoardWall cards={board.cards} selectedCardId={selectedCardId} onLayoutChange={handleLayoutChange} onSelect={setSelectedCardId} />
        <BoardPlanningPanel
          steps={board.steps}
          isMutating={isMutating}
          onAdd={openNewStep}
          onEdit={openEditStep}
          onMove={handleMoveStep}
          onDelete={(step) => void handleDeleteStep(step)}
        />
      </div>
      {isStepDialogOpen ? (
        <BoardStepDialog
          step={editingStep}
          isMutating={isMutating}
          onClose={() => setIsStepDialogOpen(false)}
          onSave={handleSaveStep}
        />
      ) : null}
    </section>
  );
}

function BoardToolTabs({ activeTool, onChange }: { activeTool: BoardTool; onChange: (tool: BoardTool) => void }): JSX.Element {
  return (
    <div className="planning-board-tool-tabs" role="tablist" aria-label="Elementos del muro">
      <button type="button" className={activeTool === "image" ? "active" : ""} title="Añadir imagen" onClick={() => onChange("image")}><UploadCloud size={16} /><span>Imagen</span></button>
      <button type="button" className={activeTool === "note" ? "active" : ""} title="Añadir nota" onClick={() => onChange("note")}><StickyNote size={16} /><span>Nota</span></button>
      <button type="button" className={activeTool === "entity" ? "active" : ""} title="Vincular entidad" onClick={() => onChange("entity")}><Network size={16} /><span>Entidad</span></button>
    </div>
  );
}

function BoardCardEditor({
  card,
  title,
  text,
  color,
  isMutating,
  onTitleChange,
  onTextChange,
  onColorChange,
  onSave,
  onDelete
}: {
  card: BoardCard | null;
  title: string;
  text: string;
  color: string;
  isMutating: boolean;
  onTitleChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
}): JSX.Element {
  if (card === null) {
    return <div className="planning-card-editor-empty"><span>Selecciona un recorte para editarlo.</span></div>;
  }

  const href = entityHref(card);

  return (
    <div className="planning-card-editor">
      <p className="eyebrow">Elemento seleccionado</p>
      <label>Título<input value={title} onChange={(event) => onTitleChange(event.target.value)} /></label>
      <label>Texto<textarea value={text} rows={4} onChange={(event) => onTextChange(event.target.value)} /></label>
      {card.type === "NOTE" ? <label>Color<input type="color" value={color} onChange={(event) => onColorChange(event.target.value)} /></label> : null}
      {href !== null ? <Link className="secondary-link compact-button" to={href}>Abrir ficha vinculada</Link> : null}
      <div className="actions-row">
        <button type="button" className="primary-button" disabled={isMutating || title.trim().length === 0} onClick={onSave}>Guardar</button>
        <button type="button" className="danger-link compact-button" disabled={isMutating} onClick={onDelete}><Trash2 size={15} />Eliminar</button>
      </div>
    </div>
  );
}

function scopeLabel(scope: "SUBJECT" | "INVESTIGATION" | "GLOBAL"): string {
  if (scope === "GLOBAL") return "Pizarra global";
  if (scope === "SUBJECT") return "Planificación del sujeto";
  return "Planificación de la investigación";
}

function entityTypeLabel(type: BoardEntityType): string {
  if (type === "subject") return "Sujeto";
  if (type === "investigation") return "Investigación";
  if (type === "property") return "Propiedad";
  if (type === "organization") return "Organización";
  return "Documento";
}

function entityHref(card: BoardCard): string | null {
  if (card.entityType === null || card.entityId === null) return null;
  if (card.entityType === "subject") return `/sujetos/${card.entityId}`;
  if (card.entityType === "investigation") return `/investigaciones/${card.entityId}`;
  if (card.entityType === "property") return `/propiedades/${card.entityId}`;
  if (card.entityType === "organization") return `/organizaciones/${card.entityId}`;
  if (card.entityType === "document") return `/documentos/${card.entityId}`;
  return null;
}
