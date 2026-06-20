import { Building2, Car, FileText, Home, MapPin, Network, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MarkerType, MiniMap, Position, type Edge, type Node, type NodeMouseHandler } from "reactflow";
import "reactflow/dist/style.css";
import type { DatalinkGraph as DatalinkGraphData, DatalinkNode, DatalinkNodeType } from "../../types/sadoj";

const NODE_TYPES: readonly DatalinkNodeType[] = ["subject", "organization", "property", "vehicle", "document", "mapElement"];

const NODE_LABELS: Readonly<Record<DatalinkNodeType, string>> = {
  subject: "Sujetos",
  organization: "Organizaciones",
  property: "Propiedades",
  vehicle: "Vehículos",
  document: "Documentos",
  mapElement: "Mapa"
};

interface DatalinkGraphProps {
  graph: DatalinkGraphData;
}

export function DatalinkGraph({ graph }: DatalinkGraphProps): JSX.Element {
  const [visibleTypes, setVisibleTypes] = useState<readonly DatalinkNodeType[]>(NODE_TYPES);
  const [selectedNode, setSelectedNode] = useState<DatalinkNode | null>(null);
  const visibleNodeIds = useMemo(() => new Set(graph.nodes.filter((node) => visibleTypes.includes(node.type)).map((node) => node.id)), [graph.nodes, visibleTypes]);
  const flowNodes = useMemo(() => toFlowNodes(graph.nodes.filter((node) => visibleTypes.includes(node.type))), [graph.nodes, visibleTypes]);
  const flowEdges = useMemo(
    () => toFlowEdges(graph.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))),
    [graph.edges, visibleNodeIds]
  );

  const toggleType = (type: DatalinkNodeType): void => {
    setVisibleTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
  };

  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedNode(node.data as DatalinkNode);
  };

  return (
    <div className="datalink-shell">
      <aside className="datalink-toolbar">
        <div>
          <p className="eyebrow">Filtros</p>
          <h2>DataLink</h2>
        </div>
        <div className="datalink-filter-list">
          {NODE_TYPES.map((type) => (
            <button key={type} type="button" className={visibleTypes.includes(type) ? "active" : ""} onClick={() => toggleType(type)}>
              {iconForType(type)}
              {NODE_LABELS[type]}
            </button>
          ))}
        </div>
        <div className="datalink-legend">
          <span><i className="legend-subject" /> Sujeto</span>
          <span><i className="legend-organization" /> Organización</span>
          <span><i className="legend-property" /> Propiedad</span>
          <span><i className="legend-document" /> Documento</span>
        </div>
      </aside>
      <section className="datalink-canvas">
        {flowNodes.length === 0 ? (
          <div className="datalink-empty">
            <Network size={42} />
            <h3>Sin conexiones para mostrar</h3>
            <p>Añade sujetos, propiedades, documentos o elementos de mapa a esta investigación.</p>
          </div>
        ) : (
          <ReactFlow nodes={flowNodes} edges={flowEdges} fitView onNodeClick={handleNodeClick}>
            <MiniMap pannable zoomable nodeColor={(node) => String(node.style?.background ?? "#8b9db5")} />
            <Controls />
            <Background gap={18} color="rgba(139,157,181,0.16)" />
          </ReactFlow>
        )}
      </section>
      <aside className="datalink-detail">
        {selectedNode === null ? (
          <div className="empty-side-panel">
            <Network size={34} />
            <h3>Selecciona un nodo</h3>
            <p>Haz clic sobre cualquier entidad del grafo para ver su información y abrir su ficha.</p>
          </div>
        ) : (
          <NodeDetail node={selectedNode} />
        )}
      </aside>
    </div>
  );
}

function toFlowNodes(nodes: readonly DatalinkNode[]): Array<Node<DatalinkNode>> {
  const radius = Math.max(260, nodes.length * 38);
  const centerX = 420;
  const centerY = 320;

  return nodes.map((node, index) => {
    const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2;
    return {
      id: node.id,
      data: node,
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      },
      style: {
        minWidth: 170,
        border: `1px solid ${borderColorForNode(node)}`,
        borderRadius: node.type === "subject" ? 999 : 8,
        padding: "10px 12px",
        background: colorForNode(node),
        color: "#f8fafc",
        boxShadow: "0 12px 28px rgba(0,0,0,0.34)"
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
  });
}

function toFlowEdges(edges: readonly DatalinkGraphData["edges"][number][]): Array<Edge> {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: edge.type === "related" || edge.type === "documented_in",
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: edgeColor(edge.type), strokeWidth: 2 },
    labelStyle: { fill: "#e2e8f0", fontWeight: 700 },
    labelBgStyle: { fill: "#111827", fillOpacity: 0.88 }
  }));
}

function NodeDetail({ node }: { node: DatalinkNode }): JSX.Element {
  const entries = Object.entries(node.meta).filter(([, value]) => value !== null && value !== "");

  return (
    <div className="datalink-node-detail">
      <div className="node-detail-icon">{iconForType(node.type)}</div>
      <p className="eyebrow">{NODE_LABELS[node.type]}</p>
      <h2>{node.label}</h2>
      <dl>
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt>{metaLabel(key)}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
      <a className="primary-link" href={node.href}>Ir a ficha</a>
    </div>
  );
}

function iconForType(type: DatalinkNodeType): JSX.Element {
  if (type === "subject") return <UserRound size={16} />;
  if (type === "organization") return <Building2 size={16} />;
  if (type === "property") return <Home size={16} />;
  if (type === "vehicle") return <Car size={16} />;
  if (type === "document") return <FileText size={16} />;
  return <MapPin size={16} />;
}

function colorForNode(node: DatalinkNode): string {
  if (node.type === "subject") {
    const danger = node.meta.dangerLevel;
    if (danger === "EXTREME") return "#7f1d1d";
    if (danger === "HIGH") return "#92400e";
    if (danger === "MEDIUM") return "#365314";
    return "#1c2537";
  }
  if (node.type === "organization") return typeof node.meta.color === "string" ? node.meta.color : "#374151";
  if (node.type === "property") return "#3f4a5f";
  if (node.type === "vehicle") return "#45556c";
  if (node.type === "document") return "#5c6e82";
  return "#263044";
}

function borderColorForNode(node: DatalinkNode): string {
  if (node.type === "organization" && typeof node.meta.color === "string") return node.meta.color;
  return "#8b9db5";
}

function edgeColor(type: string): string {
  if (type === "member_of") return "#8b9db5";
  if (type === "owns") return "#60a5fa";
  if (type === "related") return "#f59e0b";
  if (type === "documented_in") return "#a78bfa";
  if (type === "mapped_in") return "#34d399";
  return "#94a3b8";
}

function metaLabel(key: string): string {
  const labels: Readonly<Record<string, string>> = {
    alias: "Alias",
    dangerLevel: "Peligrosidad",
    status: "Estado",
    role: "Rol",
    color: "Color",
    type: "Tipo",
    relation: "Relación",
    plate: "Matrícula",
    brand: "Marca",
    model: "Modelo",
    documentNumber: "Número",
    elementType: "Tipo de elemento",
    legendNumber: "Leyenda",
    zone: "Zona"
  };

  return labels[key] ?? key;
}
