import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Icon } from "./Icon";
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Icon name="board" />
      </span>
      TaskFlow<span className="brand-period">.</span>
    </span>
  );
}
export function AppShell({
  children,
  board = false,
}: {
  children: ReactNode;
  board?: boolean;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app-shell">
      <a href="#workspace" className="skip-link">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <Link to="/dashboard" className="brand-link" aria-label="TaskFlow home">
          <Brand />
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Workspace navigation">
          <Link
            to="/dashboard"
            className={!board ? "sidebar-link active" : "sidebar-link"}
            aria-current={!board ? "page" : undefined}
          >
            <Icon name="grid" />
            Overview
          </Link>
          {board && (
            <span className="sidebar-link active" aria-current="page">
              <Icon name="board" />
              Project board
            </span>
          )}
        </nav>
        <div className="sidebar-note">
          <span className="sidebar-note-icon">
            <Icon name="check" />
          </span>
          <strong>
            A little structure.
            <br />A lot of momentum.
          </strong>
          <p>Your projects, people, and next steps. Together.</p>
        </div>
        <div className="sidebar-profile">
          <span className="avatar">
            {user?.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <strong>{user?.name}</strong>
            <span>Personal workspace</span>
          </div>
          <button
            className="logout-button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="workspace-topbar">
          <span>
            Workspace <span className="breadcrumb-divider">/</span>{" "}
            <strong>{board ? "Project board" : "Overview"}</strong>
          </span>
          <span className="workspace-date">
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </header>
        <main
          tabIndex={-1}
          id="workspace"
          className={board ? "project-page" : "dashboard-page"}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
