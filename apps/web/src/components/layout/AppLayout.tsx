import { FileQuestion, FileSearch, FileText, FolderOpen, Gavel, GraduationCap, LayoutDashboard, Lock, LogOut, Map, Menu, Network, Search, Shield, ShieldAlert, StickyNote, UserCircle, UserPlus, Users, X } from "lucide-react";
import { Suspense, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { isAcademyOnly, useAuth, type Permission, type UserSession } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { SearchResultItem, SearchResults } from "../../types/sadoj";
import { ACADEMY_ROUTE, DASHBOARD_ROUTE, LOGIN_ROUTE } from "../../utils/home";
import { roleLabel } from "../../utils/labels";
import { NotificationBell } from "../notifications/NotificationBell";
import { SkeletonBlock } from "../ui";

interface NavigationItem {
  label: string;
  path: string;
  icon: JSX.Element;
  permission?: Permission;
  locked?: boolean;
  separatorAfter?: boolean;
  operational?: boolean;
}

const NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { label: "Dashboard", path: DASHBOARD_ROUTE, icon: <LayoutDashboard size={18} />, operational: true },
  { label: "Investigaciones", path: "/investigaciones", icon: <FolderOpen size={18} />, permission: "VIEW_ASSIGNED_INVESTIGATIONS" },
  { label: "Sujetos", path: "/sujetos", icon: <FileSearch size={18} />, permission: "VIEW_SUBJECTS" },
  { label: "Organizaciones", path: "/organizaciones", icon: <Network size={18} />, permission: "VIEW_SUBJECTS" },
  { label: "Órdenes", path: "/ordenes", icon: <Gavel size={18} />, permission: "MANAGE_WARRANTS" },
  { label: "Documentos", path: "/documentos", icon: <FileText size={18} />, permission: "VIEW_SUBJECTS" },
  { label: "Mapa", path: "/mapa", icon: <Map size={18} />, permission: "VIEW_SUBJECTS" },
  { label: "DataLink", path: "/datalink", icon: <Network size={18} />, permission: "VIEW_SUBJECTS" },
  { label: "Pizarras", path: "/pizarras", icon: <StickyNote size={18} />, permission: "VIEW_ALL_INVESTIGATIONS" },
  { label: "Academia", path: ACADEMY_ROUTE, icon: <GraduationCap size={18} />, permission: "VIEW_ACADEMY" },
  { label: "Exámenes", path: "/examenes", icon: <FileQuestion size={18} />, separatorAfter: true },
  { label: "RRHH", path: "/rrhh", icon: <UserPlus size={18} />, permission: "MANAGE_HR" },
  { label: "Sanciones", path: "/admin/sanciones", icon: <ShieldAlert size={18} />, permission: "MANAGE_SANCTIONS" },
  { label: "Fiscales", path: "/fiscales", icon: <Users size={18} />, permission: "MANAGE_USERS" },
  { label: "Admin", path: "/admin", icon: <Shield size={18} />, permission: "SYSTEM_CONFIG" }
];

const SEARCH_GROUPS = [
  { key: "investigations", title: "Investigaciones" },
  { key: "subjects", title: "Sujetos" },
  { key: "organizations", title: "Organizaciones" },
  { key: "documents", title: "Documentos" },
  { key: "properties", title: "Propiedades" }
] as const satisfies ReadonlyArray<{ key: keyof SearchResults; title: string }>;

function isVisible(hasPermission: (permission: Permission) => boolean, item: NavigationItem, academyOnly: boolean): boolean {
  if (academyOnly && item.operational === true) {
    return false;
  }
  return item.permission === undefined || hasPermission(item.permission);
}

export function AppLayout(): JSX.Element {
  const { user, hasPermission, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const academyOnly = isAcademyOnly(user);
  const visibleItems = NAVIGATION_ITEMS.filter((item) => isVisible(hasPermission, item, academyOnly));

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate(LOGIN_ROUTE, { replace: true });
  };

  const closeMobileNav = (): void => {
    setIsMobileNavOpen(false);
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <SidebarContent visibleItems={visibleItems} user={user} onLogout={() => void handleLogout()} onNavigate={closeMobileNav} />
      </aside>
      {isMobileNavOpen ? (
        <div className="mobile-sidebar-backdrop" role="presentation" onClick={closeMobileNav}>
          <aside className="mobile-sidebar-drawer" aria-label="Navegación móvil" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="icon-button mobile-sidebar-close" aria-label="Cerrar menú" onClick={closeMobileNav}>
              <X size={18} />
            </button>
            <SidebarContent visibleItems={visibleItems} user={user} onLogout={() => void handleLogout()} onNavigate={closeMobileNav} />
          </aside>
        </div>
      ) : null}
      <div className="main-column">
        <header className="topbar">
          <button type="button" className="icon-button mobile-menu-button" aria-label="Abrir menú" onClick={() => setIsMobileNavOpen(true)}>
            <Menu size={18} />
          </button>
          <GlobalSearch isMobileOpen={isMobileSearchOpen} />
          <div className="topbar-actions">
            <button type="button" className="icon-button mobile-search-button" aria-label="Buscar" onClick={() => setIsMobileSearchOpen((current) => !current)}>
              <Search size={18} />
            </button>
            <NotificationBell />
            <button type="button" className="profile-chip" onClick={() => navigate("/perfil")}>
              <UserCircle size={18} />
              {user?.displayName ?? "Perfil"}
            </button>
          </div>
        </header>
        <main className="content">
          <Suspense fallback={<SkeletonBlock height={520} />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  visibleItems,
  user,
  onLogout,
  onNavigate
}: {
  visibleItems: NavigationItem[];
  user: UserSession | null;
  onLogout: () => void;
  onNavigate: () => void;
}): JSX.Element {
  return (
    <>
      <div className="brand">
        <img src="/logo.webp" alt="SADOJ Fiscalía" />
        <span>SADOJ Fiscalía</span>
      </div>
      <nav className="nav-list" aria-label="Navegación principal">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => {
              const classes = ["nav-link"];
              if (isActive) classes.push("active");
              if (item.separatorAfter === true) classes.push("section-end");
              return classes.join(" ");
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.locked === true ? <Lock size={13} aria-label="Sección restringida" /> : null}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-profile">
        {user?.avatar !== null && user?.avatar !== undefined ? (
          <img className="avatar avatar-image small" src={user.avatar} alt="" />
        ) : (
          <div className="avatar small">{user?.displayName.slice(0, 1) ?? "S"}</div>
        )}
        <div>
          <strong>{user?.displayName ?? "Fiscal"}</strong>
          <span>{roleLabel(user?.role ?? "PASANTE")}</span>
        </div>
        <button type="button" className="icon-button" aria-label="Cerrar sesión" onClick={onLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </>
  );
}

function GlobalSearch({ isMobileOpen }: { isMobileOpen: boolean }): JSX.Element {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatResults = useMemo(() => flattenSearchResults(results), [results]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      void apiRequest<SearchResults>(`/api/search?q=${encodeURIComponent(query.trim())}`, {}, accessToken).then((result) => {
        if (!result.error) {
          setResults(result.data);
          setIsOpen(true);
          setActiveIndex(0);
        }
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [accessToken, query]);

  const goToResult = (item: SearchResultItem): void => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
    navigate(item.href);
  };

  const goToGroup = (group: keyof SearchResults): void => {
    const path = searchGroupHref(group, query.trim());
    setQuery("");
    setResults(null);
    setIsOpen(false);
    navigate(path);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!isOpen || flatResults.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + flatResults.length) % flatResults.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = flatResults[activeIndex];
      if (selected !== undefined) goToResult(selected);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={isMobileOpen ? "global-search mobile-open" : "global-search"}>
      <Search size={18} />
      <input
        value={query}
        placeholder="Buscar investigaciones, sujetos..."
        aria-label="Buscar investigaciones, sujetos"
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(flatResults.length > 0)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && results !== null ? (
        <div className="global-search-results">
          {flatResults.length === 0 ? (
            <p>Sin resultados</p>
          ) : (
            SEARCH_GROUPS.map((group) => (
              <SearchGroup
                key={group.key}
                title={group.title}
                items={results[group.key]}
                activeItem={flatResults[activeIndex]}
                onSelect={goToResult}
                onViewAll={() => goToGroup(group.key)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({
  title,
  items,
  activeItem,
  onSelect,
  onViewAll
}: {
  title: string;
  items: readonly SearchResultItem[];
  activeItem: SearchResultItem | undefined;
  onSelect: (item: SearchResultItem) => void;
  onViewAll: () => void;
}): JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <section>
      <h3>{title}</h3>
      {items.map((item) => (
        <button key={`${item.type}:${item.id}`} type="button" className={activeItem?.href === item.href ? "active" : ""} onMouseDown={() => onSelect(item)}>
          {iconForSearchResult(item.type)}
          <span>
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </span>
        </button>
      ))}
      <button type="button" className="global-search-view-all" onMouseDown={onViewAll}>
        Ver todos
      </button>
    </section>
  );
}

function flattenSearchResults(results: SearchResults | null): SearchResultItem[] {
  if (results === null) return [];
  return SEARCH_GROUPS.flatMap((group) => results[group.key]);
}

function iconForSearchResult(type: SearchResultItem["type"]): JSX.Element {
  if (type === "investigation") return <FolderOpen size={15} />;
  if (type === "subject") return <FileSearch size={15} />;
  if (type === "organization") return <Network size={15} />;
  if (type === "document") return <FileText size={15} />;
  return <Map size={15} />;
}

function searchGroupHref(group: keyof SearchResults, query: string): string {
  const encoded = encodeURIComponent(query);
  if (group === "investigations") return `/investigaciones?search=${encoded}`;
  if (group === "subjects") return `/sujetos?q=${encoded}`;
  if (group === "organizations") return `/organizaciones?q=${encoded}`;
  if (group === "documents") return `/documentos?q=${encoded}`;
  return `/mapa?q=${encoded}`;
}
