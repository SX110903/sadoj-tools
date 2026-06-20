import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { Subject } from "../../types/sadoj";

export function SubjectsListPage(): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const result = await apiRequest<Subject[]>("/api/subjects?limit=100", {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setSubjects(result.data);
    };

    void load();
  }, [accessToken]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (subjects === null) return <SkeletonBlock height={320} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Personas de interés</p>
          <h1>Sujetos</h1>
        </div>
        {hasPermission("MANAGE_SUBJECTS") ? (
          <Link className="primary-link" to="/sujetos/new">
            <Plus size={18} />
            Nuevo sujeto
          </Link>
        ) : null}
      </div>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Alias</th>
              <th>Estado</th>
              <th>Peligro</th>
              <th>Organización</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>
                  <Link to={`/sujetos/${subject.id}`}>{subject.firstName} {subject.lastName}</Link>
                </td>
                <td>{subject.alias ?? "Sin alias"}</td>
                <td><StatusBadge value={subject.status} /></td>
                <td><StatusBadge value={subject.dangerLevel} kind="danger" /></td>
                <td>{subject.criminalOrganization?.alias ?? subject.criminalOrganization?.name ?? subject.organization ?? "No consta"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
