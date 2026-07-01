import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AcademyContent, AcademyContentType } from "../../types/sadoj";
import { EmptyState } from "../ui";
import { AcademyContentCard } from "./AcademyContentCard";

const FILTERS: ReadonlyArray<{ value: AcademyContentType | ""; label: string }> = [
  { value: "", label: "Todo" },
  { value: "NOTE", label: "Notas" },
  { value: "VIDEO", label: "Vídeos" },
  { value: "DOCUMENT", label: "Documentos" },
  { value: "REGULATION", label: "Normativa" }
];

export function AcademyLibrary({ content, currentUserId, canPublish, onDelete }: { content: AcademyContent[]; currentUserId: string | null; canPublish: boolean; onDelete: (id: string) => Promise<void> }): JSX.Element {
  const [type, setType] = useState<AcademyContentType | "">("");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return content.filter((item) => (type === "" || item.type === type) && (query === "" || `${item.title} ${item.body ?? ""}`.toLowerCase().includes(query)));
  }, [content, search, type]);

  return (
    <section className="stack">
      <div className="academy-library-toolbar">
        <label className="search-field">Buscar material<span className="input-with-icon"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título o contenido" /></span></label>
        <div className="tab-list" aria-label="Filtrar material">
          {FILTERS.map((filter) => <button key={filter.value || "all"} type="button" className={filter.value === type ? "active" : ""} onClick={() => setType(filter.value)}>{filter.label}</button>)}
        </div>
      </div>
      {filtered.length === 0 ? <EmptyState title="No hay material para este filtro." /> : (
        <div className="academy-content-grid">
          {filtered.map((item) => <AcademyContentCard key={item.id} content={item} canDelete={canPublish && item.publishedById === currentUserId} onDelete={onDelete} />)}
        </div>
      )}
    </section>
  );
}
