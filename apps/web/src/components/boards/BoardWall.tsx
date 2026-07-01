import { FileText, Network, UploadCloud } from "lucide-react";
import { type CSSProperties, useMemo } from "react";
import { Link } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeResizer,
  type Node,
  type NodeDragHandler,
  type NodeMouseHandler,
  type NodeProps,
  type NodeTypes
} from "reactflow";
import "reactflow/dist/style.css";
import type { BoardCard, BoardEntityType } from "../../types/sadoj";
import { SecureImage } from "../common/SecureImage";

export interface BoardCardLayoutChange {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface BoardWallProps {
  cards: readonly BoardCard[];
  selectedCardId: string | null;
  onLayoutChange: (change: BoardCardLayoutChange) => void;
  onSelect: (cardId: string) => void;
}

interface BoardWallNodeData {
  card: BoardCard;
  onResize: (change: BoardCardLayoutChange) => void;
}

const BOARD_NODE_TYPES = { boardCard: BoardWallNode } satisfies NodeTypes;

export function BoardWall({ cards, selectedCardId, onLayoutChange, onSelect }: BoardWallProps): JSX.Element {
  const nodes = useMemo(
    () => cards.map((card) => toWallNode(card, selectedCardId, onLayoutChange)),
    [cards, onLayoutChange, selectedCardId]
  );

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    onSelect(node.id);
  };

  const handleNodeDragStop: NodeDragHandler = (_event, node) => {
    onLayoutChange({ id: node.id, x: node.position.x, y: node.position.y });
  };

  return (
    <section className="planning-board-wall" aria-label="Muro de planificación">
      <ReactFlow
        nodes={nodes}
        edges={[]}
        nodeTypes={BOARD_NODE_TYPES}
        fitView
        minZoom={0.35}
        maxZoom={1.8}
        nodesConnectable={false}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
      >
        <MiniMap pannable zoomable nodeColor={(node) => String(node.style?.background ?? "#d6c49a")} />
        <Controls showInteractive={false} />
        <Background gap={34} size={1.5} color="rgba(214, 196, 154, 0.2)" />
      </ReactFlow>
      {cards.length === 0 ? (
        <div className="planning-board-wall-empty">
          <Network size={38} />
          <h3>Muro vacío</h3>
          <p>Añade imágenes, notas o entidades para preparar la operación.</p>
        </div>
      ) : null}
    </section>
  );
}

function toWallNode(
  card: BoardCard,
  selectedCardId: string | null,
  onResize: (change: BoardCardLayoutChange) => void
): Node<BoardWallNodeData> {
  return {
    id: card.id,
    type: "boardCard",
    data: { card, onResize },
    position: { x: card.x, y: card.y },
    style: {
      width: card.width,
      height: card.height,
      border: selectedCardId === card.id ? "2px solid #f2c94c" : "1px solid rgba(10, 15, 26, 0.32)",
      borderRadius: card.type === "NOTE" ? 2 : 4,
      padding: 0,
      background: card.color,
      boxShadow: "0 18px 34px rgba(0, 0, 0, 0.36)"
    },
    zIndex: card.zIndex,
    selected: selectedCardId === card.id
  };
}

function BoardWallNode({ data, selected }: NodeProps<BoardWallNodeData>): JSX.Element {
  const { card, onResize } = data;
  const innerStyle: CSSProperties = { transform: `rotate(${card.rotation}deg)` };

  return (
    <article className={`planning-wall-card planning-wall-card-${card.type.toLowerCase()}`} style={innerStyle}>
      <NodeResizer
        isVisible={selected && card.type === "EVIDENCE"}
        minWidth={180}
        minHeight={140}
        onResizeEnd={(_event, params) => onResize({ id: card.id, x: params.x, y: params.y, width: params.width, height: params.height })}
      />
      <span className="planning-wall-pin" aria-hidden="true" />
      <header>
        <small>{cardTypeLabel(card.type)}</small>
        <strong>{card.title}</strong>
      </header>
      {card.type === "EVIDENCE" ? <EvidenceMedia card={card} /> : null}
      {card.type === "NOTE" ? <p>{card.text ?? "Sin contenido"}</p> : null}
      {card.type === "ENTITY" ? <EntityBody card={card} /> : null}
    </article>
  );
}

function EvidenceMedia({ card }: { card: BoardCard }): JSX.Element {
  if (card.fileId !== null && card.file?.mimeType.startsWith("image/") === true) {
    return <SecureImage fileId={card.fileId} alt={card.title} className="planning-wall-image" />;
  }

  if (card.imageUrl !== null) {
    return <img className="planning-wall-image" src={card.imageUrl} alt={card.title} />;
  }

  return (
    <div className="planning-wall-file">
      {card.file?.mimeType === "application/pdf" ? <FileText size={24} /> : <UploadCloud size={24} />}
      <span>{card.file?.originalName ?? "Archivo adjunto"}</span>
    </div>
  );
}

function EntityBody({ card }: { card: BoardCard }): JSX.Element {
  const href = entityHref(card);

  return (
    <div className="planning-wall-entity">
      <p>{card.text ?? entityTypeLabel(card.entityType)}</p>
      {href !== null ? <Link className="nodrag" to={href}>Abrir ficha</Link> : null}
    </div>
  );
}

function cardTypeLabel(type: BoardCard["type"]): string {
  if (type === "EVIDENCE") return "Imagen";
  if (type === "NOTE") return "Nota";
  return "Entidad";
}

function entityTypeLabel(type: BoardEntityType | null): string {
  if (type === "subject") return "Sujeto";
  if (type === "investigation") return "Investigación";
  if (type === "property") return "Propiedad";
  if (type === "organization") return "Organización";
  if (type === "document") return "Documento";
  return "Entidad";
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
