import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { InvestigationListItem, Property, Warrant, WarrantType } from "../../types/sadoj";
import { TYPE_LABELS } from "../../utils/labels";

const WARRANT_TYPES: readonly WarrantType[] = ["ALLANAMIENTO", "DETENCION", "INTERCEPCION", "INCAUTACION"];
const LEGAL_HELPERS: readonly string[] = ["Art. 27 Const. SA", "Art. 28 Const. SA", "Art. 29 Const. SA", "CP Art. 8"];
const PROPERTY_TARGET_TYPES: readonly WarrantType[] = ["ALLANAMIENTO", "INCAUTACION"];

export function WarrantCreatePage(): JSX.Element {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [investigations, setInvestigations] = useState<InvestigationListItem[] | null>(null);
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    investigationId: searchParams.get("investigationId") ?? "",
    type: "ALLANAMIENTO" as WarrantType,
    propertyId: "",
    title: "",
    description: "",
    location: "",
    justification: "",
    legalBasis: "Art. 27 Const. SA"
  });

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      const [investigationsResult, propertiesResult] = await Promise.all([
        apiRequest<InvestigationListItem[]>("/api/investigations?limit=100", {}, accessToken),
        apiRequest<Property[]>("/api/properties?limit=100", {}, accessToken)
      ]);

      if (investigationsResult.error) {
        setErrorMessage(investigationsResult.message);
        return;
      }

      setInvestigations(investigationsResult.data.filter((item) => item.status === "OPEN" || item.status === "ACTIVE"));
      setProperties(propertiesResult.error ? [] : propertiesResult.data);
    };

    void loadData();
  }, [accessToken]);

  const setField = (field: keyof typeof form, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleTypeChange = (value: WarrantType): void => {
    setForm((current) => ({
      ...current,
      type: value,
      propertyId: PROPERTY_TARGET_TYPES.includes(value) ? current.propertyId : ""
    }));
  };

  const handlePropertyChange = (propertyId: string): void => {
    const property = properties?.find((item) => item.id === propertyId);
    setForm((current) => ({
      ...current,
      propertyId,
      location: property === undefined || propertyId.length === 0 ? current.location : property.address
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const { propertyId, ...payload } = form;
    const result = await apiRequest<Warrant>(
      "/api/warrants",
      {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          propertyId: PROPERTY_TARGET_TYPES.includes(form.type) && propertyId.length > 0 ? propertyId : undefined
        })
      },
      accessToken
    );

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    navigate(`/ordenes/${result.data.id}`);
  };

  const isPropertyTarget = PROPERTY_TARGET_TYPES.includes(form.type);

  if ((investigations === null || properties === null) && errorMessage === null) return <SkeletonBlock height={420} />;

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Nueva solicitud</p>
          <h1>Nueva orden judicial</h1>
        </div>
      </div>
      {errorMessage !== null ? <EmptyState title={errorMessage} /> : null}
      <form className="panel form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label className="span-full">
          Investigación
          <select value={form.investigationId} onChange={(event) => setField("investigationId", event.target.value)} required>
            <option value="">Selecciona una investigación abierta o activa</option>
            {(investigations ?? []).map((investigation) => (
              <option key={investigation.id} value={investigation.id}>{investigation.caseNumber} · {investigation.title}</option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select value={form.type} onChange={(event) => handleTypeChange(event.target.value as WarrantType)}>
            {WARRANT_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>)}
          </select>
        </label>
        <label>
          Objetivo o ubicación
          <input value={form.location} onChange={(event) => setField("location", event.target.value)} required />
        </label>
        {isPropertyTarget ? (
          <label className="span-full">
            Propiedad objetivo
            <select value={form.propertyId} onChange={(event) => handlePropertyChange(event.target.value)}>
              <option value="">Sin propiedad vinculada</option>
              {(properties ?? []).map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}{property.zone !== null ? ` · ${property.zone}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="span-full">
          Título
          <input value={form.title} onChange={(event) => setField("title", event.target.value)} required />
        </label>
        <label className="span-full">
          Descripción
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} required />
        </label>
        <label className="span-full">
          Fundamentación fáctica
          <textarea value={form.justification} onChange={(event) => setField("justification", event.target.value)} required />
        </label>
        <label className="span-full">
          Base legal
          <textarea value={form.legalBasis} onChange={(event) => setField("legalBasis", event.target.value)} required />
        </label>
        <div className="legal-helper span-full">
          {LEGAL_HELPERS.map((helper) => (
            <button key={helper} type="button" className="secondary-link" onClick={() => setField("legalBasis", helper)}>
              {helper}
            </button>
          ))}
        </div>
        <button type="submit" className="primary-button span-full">Solicitar orden</button>
      </form>
    </div>
  );
}
