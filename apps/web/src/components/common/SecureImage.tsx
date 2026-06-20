import { useSignedUrl } from "../../hooks/useSignedUrl";

interface SecureImageProps {
  fileId: string;
  alt?: string;
  className?: string;
  onClick?: (url: string) => void;
}

export function SecureImage({ fileId, alt, className, onClick }: SecureImageProps): JSX.Element {
  const { signedUrl, isLoading } = useSignedUrl(fileId);

  if (isLoading) {
    return <div className={`secure-image-placeholder ${className ?? ""}`} />;
  }

  if (signedUrl === null) {
    return (
      <div className={`secure-image-placeholder secure-image-unavailable ${className ?? ""}`}>
        <span>No disponible</span>
      </div>
    );
  }

  return <img src={signedUrl} alt={alt ?? "Archivo"} className={className} onClick={() => onClick?.(signedUrl)} />;
}
