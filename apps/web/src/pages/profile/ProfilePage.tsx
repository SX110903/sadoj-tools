import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { useAuth, type UserSession } from "../../auth/auth-context";
import { ImageUrlInput } from "../../components/common/ImageUrlInput";
import { RoleBadge } from "../../components/ui";
import { apiRequest } from "../../services/api";

export function ProfilePage(): JSX.Element {
  const { user, accessToken, refreshUser } = useAuth();
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const initial = useMemo(() => user?.displayName.slice(0, 1) ?? "S", [user]);

  if (user === null) {
    return <div className="page"><p>No hay sesión activa.</p></div>;
  }

  const openAvatarDialog = (): void => {
    setAvatarUrl(user.avatar ?? "");
    setAvatarDialogOpen(true);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await apiRequest<UserSession>(
      `/api/users/${user.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          displayName: String(formData.get("displayName") ?? ""),
          email: String(formData.get("email") ?? "") || undefined,
          bio: String(formData.get("bio") ?? "") || undefined,
          division: String(formData.get("division") ?? "") || undefined
        })
      },
      accessToken
    );

    setMessage(result.error ? result.message : "Perfil actualizado correctamente.");
    if (!result.error) await refreshUser();
  };

  const handleAvatarSubmit = async (): Promise<void> => {
    const result = await apiRequest<UserSession>(
      `/api/users/${user.id}/avatar`,
      { method: "PATCH", body: JSON.stringify({ avatarUrl }) },
      accessToken
    );

    setMessage(result.error ? result.message : "Avatar actualizado correctamente.");
    if (!result.error) {
      setAvatarDialogOpen(false);
      await refreshUser();
    }
  };

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Cuenta personal</p>
          <h1>Mi Perfil</h1>
        </div>
      </div>
      <section className="panel profile-panel">
        <button type="button" className="editable-photo" onClick={openAvatarDialog} aria-label="Cambiar foto">
          {user.avatar !== null ? <img className="avatar-preview" src={user.avatar} alt="" /> : <div className="avatar large">{initial}</div>}
          <span><Pencil size={16} /> Cambiar foto</span>
        </button>
        <div>
          <h2>{user.displayName}</h2>
          <RoleBadge role={user.role} />
        </div>
      </section>
      <form className="panel form-grid" onSubmit={(event) => void handleProfileSubmit(event)}>
        <label>Nombre visible<input name="displayName" defaultValue={user.displayName} /></label>
        <label>Email<input name="email" type="email" defaultValue={user.email ?? ""} /></label>
        <label>División<input name="division" defaultValue={user.division ?? ""} /></label>
        <label className="span-full">Bio<textarea name="bio" defaultValue={user.bio ?? ""} /></label>
        {message !== null ? <p className="hint">{message}</p> : null}
        <button className="primary-button" type="submit">Guardar cambios</button>
      </form>
      <section className="panel">
        <h2>Cambiar Contraseña</h2>
        <p className="muted">Esta acción se habilitará cuando el módulo de seguridad de perfil esté completo.</p>
      </section>
      {avatarDialogOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel image-url-dialog">
            <div className="actions-row">
              <div>
                <p className="eyebrow">Foto de perfil</p>
                <h2>Modificar avatar</h2>
              </div>
              <button type="button" className="secondary-link compact-button" onClick={() => setAvatarDialogOpen(false)}>Cerrar</button>
            </div>
            <ImageUrlInput value={avatarUrl} onChange={setAvatarUrl} shape="circle" label="URL del avatar" />
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setAvatarDialogOpen(false)}>Cancelar</button>
              <button type="button" className="primary-button" onClick={() => void handleAvatarSubmit()}>Guardar foto</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
