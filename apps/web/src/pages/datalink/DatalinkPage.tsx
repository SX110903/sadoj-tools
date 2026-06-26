import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { DatalinkGraph } from "../../components/datalink/DatalinkGraph";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { CriminalOrganization, DatalinkGraph as DatalinkGraphData, InvestigationListItem } from "../../types/sadoj";

export function DatalinkPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [organizations, setOrganizations] = useState<CriminalOrganization[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationListItem[]>([]);
  const [graph, setGraph] = useState<DatalinkGraphData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [optionsErrorMessage, setOptionsErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const subjectId = searchParams.get("subjectId");
  const selectedInvestigationId = searchParams.get("investigationId") ?? "";
  const selectedOrganizationId = searchParams.get("organizationId") ?? "";
  const graphEndpoint = useMemo(() => {
    if (subjectId !== null && subjectId.length > 0) return `/api/datalink?subjectId=${encodeURIComponent(subjectId)}`;
    if (selectedInvestigationId.length > 0) return `/api/investigations/${encodeURIComponent(selectedInvestigationId)}/datalink`;
    if (selectedOrganizationId.length > 0) return `/api/datalink?organizationId=${encodeURIComponent(selectedOrganizationId)}`;
    return "/api/datalink?scope=all";
  }, [selectedInvestigationId, selectedOrganizationId, subjectId]);

  useEffect(() => {
    let isActive = true;

    const loadOrganizations = async (): Promise<void> => {
      setOptionsErrorMessage(null);
      const [organizationResult, investigationResult] = await Promise.all([
        apiRequest<CriminalOrganization[]>("/api/organizations", {}, accessToken),
        apiRequest<InvestigationListItem[]>("/api/investigations?limit=100", {}, accessToken)
      ]);

      if (!isActive) return;

      if (organizationResult.error) {
        setOrganizations([]);
        setOptionsErrorMessage(organizationResult.message);
      } else {
        setOrganizations(organizationResult.data);
      }

      if (investigationResult.error) {
        setInvestigations([]);
        setOptionsErrorMessage((current) => current ?? investigationResult.message);
      } else {
        setInvestigations(investigationResult.data);
      }
    };

    void loadOrganizations();

    return () => {
      isActive = false;
    };
  }, [accessToken, reloadKey]);

  useEffect(() => {
    let isActive = true;

    const loadGraph = async (): Promise<void> => {
      setGraph(null);
      setErrorMessage(null);
      const result = await apiRequest<DatalinkGraphData>(graphEndpoint, {}, accessToken);

      if (!isActive) return;

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setGraph(result.data);
    };

    void loadGraph();

    return () => {
      isActive = false;
    };
  }, [accessToken, graphEndpoint, reloadKey]);

  const retryLoad = (): void => {
    setReloadKey((current) => current + 1);
  };

  const handleOrganizationChange = (organizationId: string): void => {
    if (organizationId.length === 0) {
      setSearchParams({});
      return;
    }

    setSearchParams({ organizationId });
  };

  const handleInvestigationChange = (investigationId: string): void => {
    if (investigationId.length === 0) {
      setSearchParams({});
      return;
    }

    setSearchParams({ investigationId });
  };

  return (
    <div className="page datalink-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Análisis relacional</p>
          <h1>DataLink global</h1>
          <p className="muted">Explora conexiones entre sujetos, organizaciones, vehículos, propiedades, documentos y puntos del mapa.</p>
        </div>
        <div className="datalink-scope-controls">
          {subjectId !== null && subjectId.length > 0 ? (
            <>
              <span className="badge badge-plain">Vista por sujeto</span>
              <button type="button" className="secondary-link compact-button" onClick={() => setSearchParams({})}>
                Ver red global
              </button>
            </>
          ) : (
            <>
              <label>
                Investigación
                <select value={selectedInvestigationId} onChange={(event) => handleInvestigationChange(event.target.value)}>
                  <option value="">Todas las investigaciones</option>
                  {investigations.map((investigation) => (
                    <option key={investigation.id} value={investigation.id}>
                      {investigation.caseNumber} - {investigation.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Organización
                <select value={selectedOrganizationId} onChange={(event) => handleOrganizationChange(event.target.value)}>
                  <option value="">Todas las organizaciones</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.alias ?? organization.name}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <Link className="secondary-link compact-button" to="/sujetos">
            Ver sujetos
          </Link>
        </div>
      </header>
      {optionsErrorMessage !== null ? <p className="error-message">{optionsErrorMessage}</p> : null}
      {errorMessage !== null ? <EmptyState title={errorMessage} action={<RetryButton onRetry={retryLoad} />} /> : graph === null ? <SkeletonBlock height={620} /> : <DatalinkGraph graph={graph} />}
    </div>
  );
}
