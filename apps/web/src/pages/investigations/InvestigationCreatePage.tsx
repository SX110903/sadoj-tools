import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { InvestigationDetail, InvestigationPriority, InvestigationType } from "../../types/sadoj";
import { PRIORITY_LABELS, TYPE_LABELS } from "../../utils/labels";

const TYPES: readonly InvestigationType[] = ["CRIMINAL", "FINANCIAL", "CORRUPTION", "ORGANIZED_CRIME", "NARCOTICS", "WEAPONS", "CIVIL", "MIXED"];
const PRIORITIES: readonly InvestigationPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function InvestigationCreatePage(): JSX.Element {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "CRIMINAL" as InvestigationType,
    priority: "MEDIUM" as InvestigationPriority,
    legalBasis: ""
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: keyof typeof form, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await apiRequest<InvestigationDetail>(
      "/api/investigations",
      {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          priority: form.priority,
          legalBasis: form.legalBasis.trim().length > 0 ? form.legalBasis : undefined
        })
      },
      accessToken
    );

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    navigate(`/investigaciones/${result.data.id}`);
  };

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Nuevo expediente</p>
          <h1>Nueva investigación</h1>
        </div>
        <Link className="secondary-link" to="/investigaciones">Cancelar</Link>
      </div>
      <form className="panel form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label className="span-full">
          Título
          <input value={form.title} onChange={(event) => setField("title", event.target.value)} minLength={3} required />
        </label>
        <label>
          Tipo
          <select value={form.type} onChange={(event) => setField("type", event.target.value as InvestigationType)}>
            {TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>)}
          </select>
        </label>
        <label>
          Prioridad
          <select value={form.priority} onChange={(event) => setField("priority", event.target.value as InvestigationPriority)}>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority] ?? priority}</option>)}
          </select>
        </label>
        <label className="span-full">
          Descripción operativa
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} minLength={10} required />
        </label>
        <label className="span-full">
          Base legal
          <textarea value={form.legalBasis} onChange={(event) => setField("legalBasis", event.target.value)} placeholder="Fundamento legal o diligencias iniciales" />
        </label>
        {errorMessage !== null ? <p className="error-message span-full">{errorMessage}</p> : null}
        <button className="primary-button span-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Crear investigación"}
        </button>
      </form>
    </div>
  );
}
