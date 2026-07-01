import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { AcademyContentInput } from "../../hooks/useAcademy";
import type { AcademyClass, AcademyContentType } from "../../types/sadoj";
import { FileDropzone } from "../files/FileDropzone";

export function PublishAcademyContentDialog({ classes, onClose, onPublish }: { classes: AcademyClass[]; onClose: () => void; onPublish: (input: AcademyContentInput, file: File | null) => Promise<string | null> }): JSX.Element {
  const [type, setType] = useState<AcademyContentType>("NOTE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [classId, setClassId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const validationError = validateForm(type, title, body, videoUrl, files);
    if (validationError !== null) { setErrorMessage(validationError); return; }
    const input = buildContentInput(type, title, body, videoUrl, classId);
    setIsSubmitting(true);
    const error = await onPublish(input, files[0] ?? null);
    setIsSubmitting(false);
    if (error === null) onClose();
    else setErrorMessage(error);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="publish-academy-title">
      <form className="modal-panel academy-publish-dialog" onSubmit={(event) => void handleSubmit(event)}>
        <div className="actions-row"><div><p className="eyebrow">Biblioteca</p><h2 id="publish-academy-title">Publicar contenido</h2></div><button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button></div>
        <div className="form-grid">
          <label>Tipo<select value={type} onChange={(event) => { setType(event.target.value as AcademyContentType); setFiles([]); }}><option value="NOTE">Nota</option><option value="VIDEO">Vídeo</option><option value="DOCUMENT">Documento</option><option value="REGULATION">Normativa</option></select></label>
          <label>Clase asociada<select value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Material general</option>{classes.map((item) => <option key={item.id} value={item.id}>Clase {item.number}: {item.title}</option>)}</select></label>
        </div>
        <label>Título<input required minLength={3} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        {type === "NOTE" || type === "REGULATION" ? <label>{type === "NOTE" ? "Contenido de la nota" : "Texto de la normativa"}<textarea required rows={8} maxLength={10000} value={body} onChange={(event) => setBody(event.target.value)} /></label> : null}
        {type === "VIDEO" ? <label>Enlace del vídeo<input required type="url" maxLength={2000} value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://..." /></label> : null}
        {type === "DOCUMENT" ? <FileDropzone files={files} onFilesSelected={setFiles} onClear={() => setFiles([])} helperText="PDF o imagen. Máximo 10 MB." /> : null}
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row"><button type="button" className="secondary-link" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button" disabled={isSubmitting}><Send size={16} />{isSubmitting ? "Publicando..." : "Publicar"}</button></div>
      </form>
    </div>
  );
}

function buildContentInput(type: AcademyContentType, title: string, body: string, videoUrl: string, classId: string): AcademyContentInput {
  const input: AcademyContentInput = { type, title: title.trim() };
  if (type === "NOTE" || type === "REGULATION") input.body = body.trim();
  if (type === "VIDEO") input.videoUrl = videoUrl.trim();
  if (classId !== "") input.classId = classId;
  return input;
}

function validateForm(type: AcademyContentType, title: string, body: string, videoUrl: string, files: readonly File[]): string | null {
  if (title.trim().length < 3) return "El título debe tener al menos 3 caracteres.";
  if ((type === "NOTE" || type === "REGULATION") && body.trim() === "") return "Escribe el contenido antes de publicar.";
  if (type === "VIDEO" && videoUrl.trim() === "") return "Indica el enlace del vídeo.";
  if (type === "DOCUMENT" && files.length === 0) return "Selecciona el documento que quieres publicar.";
  return null;
}
