import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";

interface ImageUrlInputProps {
  value: string | null;
  onChange: (url: string) => void;
  shape?: "circle" | "square";
  label?: string;
}

export function ImageUrlInput({ value, onChange, shape = "circle", label = "Enlace de imagen" }: ImageUrlInputProps): JSX.Element {
  const [draftUrl, setDraftUrl] = useState(value ?? "");
  const [previewUrl, setPreviewUrl] = useState(value ?? "");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setDraftUrl(value ?? "");
    setPreviewUrl(value ?? "");
    setHasError(false);
  }, [value]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmed = draftUrl.trim();
      setPreviewUrl(trimmed);
      setHasError(false);
      onChange(trimmed);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [draftUrl, onChange]);

  return (
    <div className="image-url-input">
      <label>
        {label}
        <input
          value={draftUrl}
          onChange={(event) => setDraftUrl(event.target.value)}
          placeholder="https://i.imgur.com/ejemplo.png"
        />
      </label>
      <div className={`image-url-preview ${shape === "circle" ? "circle" : "square"}`}>
        {previewUrl.length > 0 && !hasError ? (
          <img src={previewUrl} alt="Vista previa" onError={() => setHasError(true)} />
        ) : (
          <div>
            <ImageOff size={22} />
            <span>{previewUrl.length > 0 ? "No se pudo cargar la imagen" : "Sin vista previa"}</span>
          </div>
        )}
      </div>
      <p className="hint">Pega el enlace directo de Imgur. Sube tu imagen a imgur.com y copia el enlace que termina en .png/.jpg.</p>
    </div>
  );
}
