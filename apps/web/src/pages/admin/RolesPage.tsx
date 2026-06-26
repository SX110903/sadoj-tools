import { useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { EmptyState, RetryButton, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { RoleType } from "../../types/sadoj";

interface AdminRoleInfo {
  role: RoleType;
  label: string;
  level: number;
  permissions: string[];
}

export function RolesPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [roles, setRoles] = useState<AdminRoleInfo[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const result = await apiRequest<AdminRoleInfo[]>("/api/admin/roles", {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setRoles(result.data);
    };

    void load();
  }, [accessToken]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} action={<RetryButton />} />;
  if (roles === null) return <SkeletonBlock height={420} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Control de acceso</p>
          <h1>Roles y permisos</h1>
        </div>
      </div>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Nivel</th>
              <th>Permisos</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.role}>
                <td><RoleBadge role={role.role} /></td>
                <td className="case-number">{role.level}</td>
                <td>
                  <div className="permission-chip-list">
                    {role.permissions.map((permission) => <span className="badge badge-plain" key={permission}>{permission}</span>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
