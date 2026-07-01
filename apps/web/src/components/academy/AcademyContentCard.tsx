import { BookOpenText, ExternalLink, FileText, PlayCircle, Scale, Trash2 } from "lucide-react";
import { SecureImage } from "../common/SecureImage";
import { useSignedUrl } from "../../hooks/useSignedUrl";
import type { AcademyContent, AcademyContentType } from "../../types/sadoj";
import { formatBytes, shortDateTime } from "../../utils/labels";

const TYPE_LABELS: Readonly<Record<AcademyContentType, string>> = {
  NOTE: "Nota",
  VIDEO: "Vídeo",
  DOCUMENT: "Documento",
  REGULATION: "Normativa"
};

export function AcademyContentCard({ content, canDelete, onDelete }: { content: AcademyContent; canDelete: boolean; onDelete: (id: string) => Promise<void> }): JSX.Element {
  const { signedUrl, isLoading } = useSignedUrl(content.fileId);

  return (
    <article className="academy-content-card">
      <div className="academy-content-heading">
        <span className={`academy-type-icon type-${content.type.toLowerCase()}`}>{contentIcon(content.type)}</span>
        <div><span className="eyebrow">{TYPE_LABELS[content.type]}</span><h3>{content.title}</h3></div>
        {canDelete ? <button type="button" className="icon-button" aria-label={`Eliminar ${content.title}`} onClick={() => void onDelete(content.id)}><Trash2 size={15} /></button> : null}
      </div>
      {content.body !== null ? <p className="academy-content-body">{content.body}</p> : null}
      {content.videoUrl !== null ? <a className="secondary-link align-self-start" href={content.videoUrl} target="_blank" rel="noopener noreferrer"><PlayCircle size={16} />Abrir vídeo<ExternalLink size={14} /></a> : null}
      {content.file !== null && content.file.mimeType.startsWith("image/") ? <SecureImage fileId={content.file.id} alt={content.title} className="academy-content-image" /> : null}
      {content.file !== null ? (
        <a className={signedUrl === null ? "secondary-link disabled" : "secondary-link"} href={signedUrl ?? undefined} target="_blank" rel="noopener noreferrer" aria-disabled={signedUrl === null}>
          <FileText size={16} />{isLoading ? "Preparando documento..." : content.file.originalName}<span className="muted">{formatBytes(content.file.size)}</span>
        </a>
      ) : null}
      {content.type === "DOCUMENT" && content.file === null ? <p className="hint">Documento pendiente de adjuntar.</p> : null}
      <footer><span>{content.class === null ? "Material general" : `Clase ${content.class.number}`}</span><span>{content.publishedBy.displayName} · {shortDateTime(content.createdAt)}</span></footer>
    </article>
  );
}

function contentIcon(type: AcademyContentType): JSX.Element {
  if (type === "VIDEO") return <PlayCircle size={18} />;
  if (type === "DOCUMENT") return <FileText size={18} />;
  if (type === "REGULATION") return <Scale size={18} />;
  return <BookOpenText size={18} />;
}
