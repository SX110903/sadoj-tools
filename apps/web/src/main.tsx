import React, { lazy } from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, RouterProvider, createBrowserRouter, createRoutesFromElements, useLocation, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./auth/auth-context";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { RolesPage } from "./pages/admin/RolesPage";
import { SanctionsPage } from "./pages/admin/SanctionsPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { DocumentsListPage } from "./pages/documents/DocumentsListPage";
import { NotFoundPage } from "./pages/errors/NotFoundPage";
import { FiscalCreatePage } from "./pages/fiscales/FiscalCreatePage";
import { FiscalDetailPage } from "./pages/fiscales/FiscalDetailPage";
import { FiscalesListPage } from "./pages/fiscales/FiscalesListPage";
import { InvestigationCreatePage } from "./pages/investigations/InvestigationCreatePage";
import { InvestigationsListPage } from "./pages/investigations/InvestigationsListPage";
import { NotificationsPage } from "./pages/notifications/NotificationsPage";
import { OrganizationDetailPage } from "./pages/organizations/OrganizationDetailPage";
import { OrganizationsListPage } from "./pages/organizations/OrganizationsListPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { PropertyDetailPage } from "./pages/properties/PropertyDetailPage";
import { SubjectCreatePage } from "./pages/subjects/SubjectCreatePage";
import { SubjectsListPage } from "./pages/subjects/SubjectsListPage";
import { WarrantCreatePage } from "./pages/warrants/WarrantCreatePage";
import { WarrantDetailPage } from "./pages/warrants/WarrantDetailPage";
import { WarrantsListPage } from "./pages/warrants/WarrantsListPage";
import { ACADEMY_ROUTE, DASHBOARD_ROUTE, getHomeRoute, LOGIN_ROUTE } from "./utils/home";
import "./styles.css";

// Heavy routes (Leaflet, ReactFlow, document templates) are code-split to shrink the
// initial bundle. The Suspense fallback lives in AppLayout's content area.
const BoardsPage = lazy(() => import("./pages/boards/BoardsPage").then((m) => ({ default: m.BoardsPage })));
const DatalinkPage = lazy(() => import("./pages/datalink/DatalinkPage").then((m) => ({ default: m.DatalinkPage })));
const MapPage = lazy(() => import("./pages/map/MapPage").then((m) => ({ default: m.MapPage })));
const InvestigationDetailPage = lazy(() => import("./pages/investigations/InvestigationDetailPage").then((m) => ({ default: m.InvestigationDetailPage })));
const SubjectDetailPage = lazy(() => import("./pages/subjects/SubjectDetailPage").then((m) => ({ default: m.SubjectDetailPage })));
const DocumentDetailPage = lazy(() => import("./pages/documents/DocumentDetailPage").then((m) => ({ default: m.DocumentDetailPage })));
const DocumentEditorPage = lazy(() => import("./pages/documents/DocumentEditorPage").then((m) => ({ default: m.DocumentEditorPage })));
const ExamsPage = lazy(() => import("./pages/exams/ExamsPage").then((m) => ({ default: m.ExamsPage })));
const HrPage = lazy(() => import("./pages/hr/HrPage").then((m) => ({ default: m.HrPage })));
const CandidateDetailPage = lazy(() => import("./pages/hr/CandidateDetailPage").then((m) => ({ default: m.CandidateDetailPage })));
const AcademyPage = lazy(() => import("./pages/academy/AcademyPage").then((m) => ({ default: m.AcademyPage })));

function HomeRedirect(): JSX.Element {
  const { user } = useAuth();

  if (user === null) {
    return <Navigate to={LOGIN_ROUTE} replace />;
  }

  return <Navigate to={getHomeRoute(user)} replace />;
}

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
      <Route path={LOGIN_ROUTE} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path={DASHBOARD_ROUTE} element={<DashboardPage />} />
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
          <Route element={<ProtectedRoute permission="VIEW_ALL_INVESTIGATIONS" />}>
            <Route path="/pizarras" element={<CriticalPageBoundary title="Algo salió mal al cargar las pizarras"><BoardsPage /></CriticalPageBoundary>} />
          </Route>
          <Route path="/examenes" element={<CriticalPageBoundary title="Algo salió mal al cargar los exámenes"><ExamsPage /></CriticalPageBoundary>} />
          <Route path="/exams" element={<Navigate to="/examenes" replace />} />
          <Route element={<ProtectedRoute permission="VIEW_ACADEMY" />}>
            <Route path={ACADEMY_ROUTE} element={<AcademyPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="MANAGE_HR" />}>
            <Route path="/rrhh" element={<HrPage />} />
            <Route path="/rrhh/:id" element={<CandidateDetailPage />} />
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
