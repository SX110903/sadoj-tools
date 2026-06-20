import type { DocumentType } from "../../types/documents";
import type { FormDataMap } from "../../hooks/useDocumentForm";
import { DOCUMENT_TYPE_LABELS } from "./documentDefinitions";
import { DocumentHeader } from "./DocumentHeader";
import { ActaAllanamientoTemplate } from "./templates/ActaAllanamientoTemplate";
import { ActaInterrogatorioTemplate } from "./templates/ActaInterrogatorioTemplate";
import { ActaRegistroMovilTemplate } from "./templates/ActaRegistroMovilTemplate";
import { ActaRegistroTelefonicoTemplate } from "./templates/ActaRegistroTelefonicoTemplate";
import { ActaSolicitudInformacionTemplate } from "./templates/ActaSolicitudInformacionTemplate";
import { AcusacionTemplate } from "./templates/AcusacionTemplate";
import { AllanamientoTemplate } from "./templates/AllanamientoTemplate";
import { BuscaCapturaTemplate } from "./templates/BuscaCapturaTemplate";
import { CitacionFiscalTemplate } from "./templates/CitacionFiscalTemplate";
import { InterrogatorioTemplate } from "./templates/InterrogatorioTemplate";
import { OrdenArrestoTemplate } from "./templates/OrdenArrestoTemplate";
import { OrdenExtraccionTelefonicaTemplate } from "./templates/OrdenExtraccionTelefonicaTemplate";
import { PleaBargainTemplate } from "./templates/PleaBargainTemplate";
import { ReconocimientoFacialTemplate } from "./templates/ReconocimientoFacialTemplate";
import { RegistroTelefonicoTemplate } from "./templates/RegistroTelefonicoTemplate";
import { SolicitudInformacionTemplate } from "./templates/SolicitudInformacionTemplate";

type DocumentFormData = FormDataMap[DocumentType];

interface DocumentTemplateRendererProps {
  type: DocumentType;
  data: DocumentFormData;
  onChange: (data: DocumentFormData) => void;
  readOnly?: boolean;
  elementId?: string;
}

export function DocumentTemplateRenderer({ type, data, onChange, readOnly = false, elementId }: DocumentTemplateRendererProps): JSX.Element {
  const content = renderTemplate(type, data, onChange);
  const documentContent = (
    <>
      <DocumentHeader title={DOCUMENT_TYPE_LABELS[type]} />
      {content}
    </>
  );

  if (!readOnly) {
    return <div id={elementId} className="document-template">{documentContent}</div>;
  }

  return (
    <fieldset id={elementId} className="document-template document-readonly" disabled>
      {documentContent}
    </fieldset>
  );
}

function renderTemplate(type: DocumentType, data: DocumentFormData, onChange: (data: DocumentFormData) => void): JSX.Element {
  switch (type) {
    case "interrogatorio":
      return <InterrogatorioTemplate data={data as FormDataMap["interrogatorio"]} onChange={(next) => onChange(next)} />;
    case "allanamiento":
      return <AllanamientoTemplate data={data as FormDataMap["allanamiento"]} onChange={(next) => onChange(next)} />;
    case "busca-captura":
      return <BuscaCapturaTemplate data={data as FormDataMap["busca-captura"]} onChange={(next) => onChange(next)} />;
    case "registro-telefonico":
      return <RegistroTelefonicoTemplate data={data as FormDataMap["registro-telefonico"]} onChange={(next) => onChange(next)} />;
    case "acusacion":
      return <AcusacionTemplate data={data as FormDataMap["acusacion"]} onChange={(next) => onChange(next)} />;
    case "orden-arresto":
      return <OrdenArrestoTemplate data={data as FormDataMap["orden-arresto"]} onChange={(next) => onChange(next)} />;
    case "solicitud-informacion":
      return <SolicitudInformacionTemplate data={data as FormDataMap["solicitud-informacion"]} onChange={(next) => onChange(next)} />;
    case "plea-bargain":
      return <PleaBargainTemplate data={data as FormDataMap["plea-bargain"]} onChange={(next) => onChange(next)} />;
    case "acta-interrogatorio": {
      const templateData = data as FormDataMap["acta-interrogatorio"];
      return (
        <ActaInterrogatorioTemplate
          data={templateData}
          updateField={(field, value) => onChange({ ...templateData, [field]: value })}
        />
      );
    }
    case "acta-allanamiento": {
      const templateData = data as FormDataMap["acta-allanamiento"];
      return (
        <ActaAllanamientoTemplate
          data={templateData}
          updateField={(field, value) => onChange({ ...templateData, [field]: value })}
        />
      );
    }
    case "acta-registro-movil": {
      const templateData = data as FormDataMap["acta-registro-movil"];
      return (
        <ActaRegistroMovilTemplate
          data={templateData}
          updateField={(field, value) => onChange({ ...templateData, [field]: value })}
        />
      );
    }
    case "acta-registro-telefonico": {
      const templateData = data as FormDataMap["acta-registro-telefonico"];
      return (
        <ActaRegistroTelefonicoTemplate
          data={templateData}
          updateField={(field, value) => onChange({ ...templateData, [field]: value })}
        />
      );
    }
    case "acta-solicitud-informacion": {
      const templateData = data as FormDataMap["acta-solicitud-informacion"];
      return (
        <ActaSolicitudInformacionTemplate
          data={templateData}
          updateField={(field, value) => onChange({ ...templateData, [field]: value })}
        />
      );
    }
    case "reconocimiento-facial":
      return <ReconocimientoFacialTemplate data={data as FormDataMap["reconocimiento-facial"]} onChange={(next) => onChange(next)} />;
    case "citacion-fiscal":
      return <CitacionFiscalTemplate data={data as FormDataMap["citacion-fiscal"]} onChange={(next) => onChange(next)} />;
    case "extraccion-telefonica":
      return <OrdenExtraccionTelefonicaTemplate data={data as FormDataMap["extraccion-telefonica"]} onChange={(next) => onChange(next)} />;
  }
}
