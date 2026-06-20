export function PlaceholderPage({ title }: { title: string }): JSX.Element {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Módulo pendiente</p>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="panel">
        <p className="muted">Esta sección se completará en las siguientes fases del proyecto.</p>
      </div>
    </div>
  );
}

