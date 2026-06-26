import { FileText, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { SecureImage } from "../common/SecureImage";
import { RetryButton } from "../ui";
import { apiRequest } from "../../services/api";
import type { CaseFile } from "../../types/sadoj";
import { formatBytes, shortDateTime } from "../../utils/labels";

type FileTargetType = "investigation" | "subject" | "warrant" | "warrantReport" | "propertyIncident" | "note";

interface FileUploadPanelProps {
  targetType: FileTargetType;
  targetId: string;
  initialFiles?: CaseFile[];
}

interface UploadResult {
  file: CaseFile;
  thumbnailUrl?: string;
}

export function FileUploadPanel({ targetType, targetId, initialFiles = [] }: FileUploadPanelProps): JSX.Element {
  const { accessToken, user, hasPermission } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<CaseFile[]>(initialFiles);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFiles = async (): Promise<void> => {
    const result = await apiRequest<CaseFile[]>(`/api/files?targetType=${targetType}&targetId=${targetId}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setErrorMessage(null);
    setFiles(result.data);
  };

  useEffect(() => {
    void loadFiles();
  }, [targetType, targetId, accessToken]);

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];

    if (file === undefined) return;

    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async (): Promise<void> => {
    const file = inputRef.current?.files?.[0];

    if (file === undefined) {
      setErrorMessage("Selecciona un archivo antes de subirlo.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetType", targetType);
    formData.append("targetId", targetId);
    setIsUploading(true);
    setErrorMessage(null);

    const result = await apiRequest<UploadResult>(
      `/api/files/upload?targetType=${targetType}&targetId=${targetId}`,
      {
        method: "POST",
        body: formData
      },
      accessToken
    );

    setIsUploading(false);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setFiles((current) => [result.data.file, ...current]);
    setPreview(result.data.thumbnailUrl ?? null);

    if (inputRef.current !== null) {
      inputRef.current.value = "";
    }
  };

  const handleDelete = async (file: CaseFile): Promise<void> => {
    const confirmed = window.confirm("¿Eliminar este archivo?");

    if (!confirmed) return;

    const result = await apiRequest<{ deleted: boolean }>(`/api/files/${file.id}`, { method: "DELETE" }, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setFiles((current) => current.filter((item) => item.id !== file.id));
  };

  const canDelete = (file: CaseFile): boolean => file.uploadedById === user?.id || hasPermission("MANAGE_USERS");

  return (
    <div className="stack">
      {hasPermission("UPLOAD_FILES") ? (
        <section className="panel file-drop">
          <div>
            <p className="eyebrow">Evidencias</p>
            <h2>Subir archivo</h2>
            <p className="muted">JPG, PNG, WebP, GIF o PDF. Máximo 10 MB.</p>
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={handleSelect} />
          {preview !== null ? <img src={preview} className="upload-preview" alt="Previsualización" /> : null}
          <button type="button" className="primary-button" disabled={isUploading} onClick={() => void handleUpload()}>
            <Upload size={16} />
            {isUploading ? "Subiendo..." : "Subir archivo"}
          </button>
        </section>
      ) : null}
      {errorMessage !== null ? (
        <div className="panel">
          <p className="error-message">{errorMessage}</p>
          <RetryButton onRetry={() => void loadFiles()} />
        </div>
      ) : null}
      <section className="file-grid">
        {files.length === 0 ? <p className="muted">No hay archivos adjuntos.</p> : null}
        {files.map((file) => (
          <article className="file-card" key={file.id}>
            {file.mimeType.startsWith("image/") ? (
              <button type="button" className="file-thumb" aria-label="Abrir imagen" onClick={(event) => event.preventDefault()}>
                <SecureImage fileId={file.id} alt={file.originalName} className="file-thumb-image" onClick={(url) => setLightboxUrl(url)} />
              </button>
            ) : (
              <div className="file-thumb">
                <FileText size={28} />
              </div>
            )}
            <div>
              <strong>{file.originalName}</strong>
              <p className="muted">{formatBytes(file.size)} · {file.uploadedBy?.displayName ?? "Fiscalía"} · {shortDateTime(file.createdAt)}</p>
            </div>
            {canDelete(file) ? (
              <button type="button" className="icon-button" aria-label="Eliminar archivo" onClick={() => void handleDelete(file)}>
                <Trash2 size={16} />
              </button>
            ) : null}
          </article>
        ))}
      </section>
      {lightboxUrl !== null ? (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Evidencia ampliada" />
        </div>
      ) : null}
    </div>
  );
}
