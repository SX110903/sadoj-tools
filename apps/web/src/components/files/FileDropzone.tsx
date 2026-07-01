import { FileText, UploadCloud, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { formatBytes } from "../../utils/labels";

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,application/pdf";
const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"] as const;

interface FilePreview {
  name: string;
  size: number;
  url: string | null;
}

interface FileDropzoneProps {
  files: readonly File[];
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  allowedTypes?: readonly string[];
  helperText?: string;
  isUploading?: boolean;
  maxSizeBytes?: number;
  multiple?: boolean;
  onClear?: () => void;
  progressPercent?: number;
  capturePaste?: boolean;
}

export function FileDropzone({
  files,
  onFilesSelected,
  accept = DEFAULT_ACCEPT,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  helperText = "JPG, PNG, WebP, GIF o PDF. Máximo 10 MB.",
  isUploading = false,
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE,
  multiple = false,
  onClear,
  progressPercent,
  capturePaste = false
}: FileDropzoneProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const allowedTypeSet = useMemo(() => new Set(allowedTypes), [allowedTypes]);
  const previews = useFilePreviews(files);

  const selectFiles = useCallback((selectedFiles: File[]): void => {
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      const validationMessage = validateFile(file, allowedTypeSet, maxSizeBytes);
      if (validationMessage !== null) {
        setErrorMessage(validationMessage);
        return;
      }
      validFiles.push(file);
    }

    setErrorMessage(null);
    onFilesSelected(multiple ? validFiles : validFiles.slice(0, 1));
  }, [allowedTypeSet, maxSizeBytes, multiple, onFilesSelected]);

  useEffect(() => {
    if (!capturePaste) return;

    const handlePaste = (event: ClipboardEvent): void => {
      if (isEditableTarget(event.target)) return;
      const clipboardFiles = Array.from(event.clipboardData?.files ?? []);
      if (clipboardFiles.length === 0) return;
      event.preventDefault();
      selectFiles(clipboardFiles);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [capturePaste, selectFiles]);

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);
    selectFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div className="file-dropzone-shell">
      <div
        className={isDragging ? "file-dropzone drag-active" : "file-dropzone"}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={handleDrop}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <UploadCloud size={30} />
        <strong>{capturePaste ? "Arrastra, pega con Ctrl+V o haz clic para seleccionar" : "Arrastra archivos aquí o haz clic para seleccionar"}</strong>
        <span>{helperText}</span>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            selectFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
      {previews.length > 0 ? <FilePreviewGrid previews={previews} {...(onClear === undefined ? {} : { onClear })} /> : null}
      {isUploading ? <UploadProgress {...(progressPercent === undefined ? {} : { percent: progressPercent })} /> : null}
    </div>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches("input, textarea, [contenteditable='true']") || target.closest("[contenteditable='true']") !== null;
}

function FilePreviewGrid({ previews, onClear }: { previews: readonly FilePreview[]; onClear?: () => void }): JSX.Element {
  return (
    <div className="file-dropzone-preview-grid">
      {previews.map((preview) => (
        <article className="file-dropzone-preview" key={`${preview.name}:${preview.size}`}>
          {preview.url !== null ? <img src={preview.url} alt={preview.name} /> : <FileText size={24} />}
          <span>
            <strong>{preview.name}</strong>
            <small>{formatBytes(preview.size)}</small>
          </span>
        </article>
      ))}
      {onClear !== undefined ? (
        <button type="button" className="icon-button" aria-label="Quitar selección" onClick={onClear}>
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

function UploadProgress({ percent }: { percent?: number }): JSX.Element {
  const width = percent === undefined ? "100%" : `${Math.max(0, Math.min(100, percent))}%`;

  return (
    <div className="upload-progress" aria-label="Progreso de subida">
      <span style={{ width }} />
    </div>
  );
}

function useFilePreviews(files: readonly File[]): FilePreview[] {
  const [previews, setPreviews] = useState<FilePreview[]>([]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      name: file.name,
      size: file.size,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach((preview) => {
        if (preview.url !== null) URL.revokeObjectURL(preview.url);
      });
    };
  }, [files]);

  return previews;
}

function validateFile(file: File, allowedTypes: ReadonlySet<string>, maxSizeBytes: number): string | null {
  if (!allowedTypes.has(file.type)) {
    return "Tipo de archivo no permitido. Usa JPG, PNG, WebP, GIF o PDF.";
  }

  if (file.size > maxSizeBytes) {
    return `El archivo supera el límite de ${formatBytes(maxSizeBytes)}.`;
  }

  return null;
}
