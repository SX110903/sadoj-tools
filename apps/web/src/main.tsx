import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements, useLocation, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/auth-context";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { RolesPage } from "./pages/admin/RolesPage";
import { SanctionsPage } from "./pages/admin/SanctionsPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { DatalinkPage } from "./pages/datalink/DatalinkPage";
import { DocumentDetailPage } from "./pages/documents/DocumentDetailPage";
import { DocumentEditorPage } from "./pages/documents/DocumentEditorPage";
import { DocumentsListPage } from "./pages/documents/DocumentsListPage";
import { NotFoundPage } from "./pages/errors/NotFoundPage";
import { FiscalCreatePage } from "./pages/fiscales/FiscalCreatePage";
import { FiscalDetailPage } from "./pages/fiscales/FiscalDetailPage";
import { FiscalesListPage } from "./pages/fiscales/FiscalesListPage";
import { InvestigationCreatePage } from "./pages/investigations/InvestigationCreatePage";
import { InvestigationDetailPage } from "./pages/investigations/InvestigationDetailPage";
import { InvestigationsListPage } from "./pages/investigations/InvestigationsListPage";
import { MapPage } from "./pages/map/MapPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { OrganizationDetailPage } from "./pages/organizations/OrganizationDetailPage";
import { OrganizationsListPage } from "./pages/organizations/OrganizationsListPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { PropertyDetailPage } from "./pages/properties/PropertyDetailPage";
import { SubjectCreatePage } from "./pages/subjects/SubjectCreatePage";
import { SubjectDetailPage } from "./pages/subjects/SubjectDetailPage";
import { SubjectsListPage } from "./pages/subjects/SubjectsListPage";
import { WarrantCreatePage } from "./pages/warrants/WarrantCreatePage";
import { WarrantDetailPage } from "./pages/warrants/WarrantDetailPage";
import { WarrantsListPage } from "./pages/warrants/WarrantsListPage";
import "./styles.css";

function RedirectWithSearch({ to }: { to: string }): JSX.Element {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

function RedirectEntityWithSearch({ toBase, suffix = "" }: { toBase: string; suffix?: string }): JSX.Element {
  const { id } = useParams();
  const location = useLocation();

  if (id === undefined) {
    return <NotFoundPage />;
  }

  return <Navigate to={`${toBase}/${id}${suffix}${location.search}`} replace />;
}

function CriticalPageBoundary({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return <ErrorBoundary title={title}>{children}</ErrorBoundary>;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<ProtectedRoute permission="MANAGE_USERS" />}>
            <Route path="/fiscales" element={<FiscalesListPage />} />
            <Route path="/fiscales/nuevo" element={<FiscalCreatePage />} />
            <Route path="/fiscales/new" element={<RedirectWithSearch to="/fiscales/nuevo" />} />
          </Route>
          <Route path="/fiscales/:id" element={<FiscalDetailPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/notificaciones" element={<NotificationsPage />} />
          <Route path="/investigaciones" element={<InvestigationsListPage />} />
          <Route element={<ProtectedRoute permission="CREATE_INVESTIGATION" />}>
            <Route path="/investigaciones/nueva" element={<InvestigationCreatePage />} />
          </Route>
          <Route path="/investigaciones/new" element={<RedirectWithSearch to="/investigaciones/nueva" />} />
          <Route path="/investigaciones/:id" element={<InvestigationDetailPage />} />
          <Route path="/investigations" element={<Navigate to="/investigaciones" replace />} />
          <Route path="/investigations/new" element={<RedirectWithSearch to="/investigaciones/nueva" />} />
          <Route path="/investigations/:id" element={<RedirectEntityWithSearch toBase="/investigaciones" />} />
          <Route path="/sujetos" element={<SubjectsListPage />} />
          <Route element={<ProtectedRoute permission="MANAGE_SUBJECTS" />}>
            <Route path="/sujetos/nuevo" element={<SubjectCreatePage />} />
            <Route path="/sujetos/new" element={<RedirectWithSearch to="/sujetos/nuevo" />} />
          </Route>
          <Route path="/sujetos/:id" element={<SubjectDetailPage />} />
          <Route path="/subjects" element={<Navigate to="/sujetos" replace />} />
          <Route path="/subjects/new" element={<RedirectWithSearch to="/sujetos/nuevo" />} />
          <Route path="/subjects/:id" element={<RedirectEntityWithSearch toBase="/sujetos" />} />
          <Route path="/organizaciones" element={<OrganizationsListPage />} />
          <Route path="/organizaciones/:id" element={<OrganizationDetailPage />} />
          <Route path="/organizations" element={<Navigate to="/organizaciones" replace />} />
          <Route path="/organizations/:id" element={<RedirectEntityWithSearch toBase="/organizaciones" />} />
          <Route element={<ProtectedRoute permission="MANAGE_WARRANTS" />}>
            <Route path="/ordenes" element={<WarrantsListPage />} />
            <Route path="/ordenes/nueva" element={<WarrantCreatePage />} />
            <Route path="/ordenes/new" element={<RedirectWithSearch to="/ordenes/nueva" />} />
            <Route path="/ordenes/:id" element={<WarrantDetailPage />} />
            <Route path="/warrants" element={<Navigate to="/ordenes" replace />} />
            <Route path="/warrants/new" element={<RedirectWithSearch to="/ordenes/nueva" />} />
            <Route path="/warrants/:id" element={<RedirectEntityWithSearch toBase="/ordenes" />} />
          </Route>
          <Route path="/mapa" element={<CriticalPageBoundary title="Algo salió mal al cargar el mapa"><MapPage /></CriticalPageBoundary>} />
          <Route path="/map" element={<Navigate to="/mapa" replace />} />
          <Route path="/propiedades/:id" element={<PropertyDetailPage />} />
          <Route path="/properties/:id" element={<RedirectEntityWithSearch toBase="/propiedades" />} />
          <Route element={<ProtectedRoute permission="VIEW_SUBJECTS" />}>
            <Route path="/datalink" element={<CriticalPageBoundary title="Algo salió mal al cargar DataLink"><DatalinkPage /></CriticalPageBoundary>} />
          </Route>
          <Route element={<ProtectedRoute permission="VIEW_SUBJECTS" />}>
            <Route path="/documentos" element={<DocumentsListPage />} />
            <Route path="/documentos/nuevo" element={<CriticalPageBoundary title="Algo salió mal al cargar el editor de documentos"><DocumentEditorPage /></CriticalPageBoundary>} />
            <Route path="/documentos/:id" element={<CriticalPageBoundary title="Algo salió mal al cargar el documento"><DocumentDetailPage /></CriticalPageBoundary>} />
            <Route path="/documentos/:id/editar" element={<CriticalPageBoundary title="Algo salió mal al cargar el editor de documentos"><DocumentEditorPage /></CriticalPageBoundary>} />
            <Route path="/documents" element={<Navigate to="/documentos" replace />} />
            <Route path="/documents/new" element={<RedirectWithSearch to="/documentos/nuevo" />} />
            <Route path="/documents/:id" element={<RedirectEntityWithSearch toBase="/documentos" />} />
            <Route path="/documents/:id/edit" element={<RedirectEntityWithSearch toBase="/documentos" suffix="/editar" />} />
          </Route>
          <Route element={<ProtectedRoute permission="MANAGE_SANCTIONS" />}>
            <Route path="/admin/sanciones" element={<SanctionsPage />} />
            <Route path="/sanciones" element={<SanctionsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="SYSTEM_CONFIG" />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="MANAGE_ROLES" />}>
            <Route path="/admin/roles" element={<RolesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="VIEW_AUDIT_LOG" />}>
            <Route path="/admin/auditoria" element={<AuditLogPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </>
  )
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary title="La aplicación encontró un error inesperado">
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" theme="dark" />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
