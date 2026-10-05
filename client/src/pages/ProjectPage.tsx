import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { AppShell } from "../components/AppShell";
import { Icon } from "../components/Icon";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { EditTaskModal } from "../components/EditTaskModal";
import { ManageMembersModal } from "../components/ManageMembersModal";
interface Project {
  id: number;
  name: string;
  description: string;
  role: string;
}
interface Task {
  id: number;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  due_date: string | null;
  assigned_to: number | null;
  creator_name: string;
  assignee_name: string | null;
}
interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
}
const columns = [
  ["TODO", "To do"],
  ["IN_PROGRESS", "In progress"],
  ["DONE", "Done"],
] as const;
export function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null),
    [tasks, setTasks] = useState<Task[]>([]),
    [members, setMembers] = useState<Member[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [createStatus, setCreateStatus] = useState<Task["status"]>("TODO");
  const [showCreate, setShowCreate] = useState(false),
    [showMembers, setShowMembers] = useState(false),
    [selected, setSelected] = useState<Task | null>(null),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("ALL"),
    [priority, setPriority] = useState("ALL"),
    [assignee, setAssignee] = useState("ALL");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [p, t, m] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/projects/${id}/tasks`),
          api.get(`/projects/${id}/members`),
        ]);
        if (!cancelled) {
          setProject(p.data.project);
          setTasks(t.data.tasks);
          setMembers(m.data.members);
          setError("");
        }
      } catch {
        if (!cancelled)
          setError("Unable to load this project. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);
  async function loadTasks() {
    try {
      const r = await api.get(`/projects/${id}/tasks`);
      setTasks(r.data.tasks);
      setError("");
    } catch {
      setError(
        "Unable to refresh tasks. Your last loaded board is still shown.",
      );
      throw new Error("Refresh failed");
    }
  }
  async function loadMembers() {
    try {
      const r = await api.get(`/projects/${id}/members`);
      setMembers(r.data.members);
      await loadTasks();
    } catch {
      setError("Unable to refresh project members. Please reload.");
      throw new Error("Refresh failed");
    }
  }
  const filtered = tasks.filter(
    (t) =>
      `${t.title} ${t.description}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&
      (status === "ALL" || t.status === status) &&
      (priority === "ALL" || t.priority === priority) &&
      (assignee === "ALL" ||
        (assignee === "UNASSIGNED"
          ? t.assigned_to === null
          : t.assigned_to === Number(assignee))),
  );
  const done = tasks.filter((t) => t.status === "DONE").length;
  const active =
    search || status !== "ALL" || priority !== "ALL" || assignee !== "ALL";
  return (
    <AppShell board>
      <Link className="back-link" to="/dashboard">
        ← All projects
      </Link>
      {loading ? (
        <div className="empty-state" role="status">
          Loading your project…
        </div>
      ) : !project ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : (
        <>
          <header className="project-header">
            <div>
              <div className="project-title-row">
                <span className="project-symbol">
                  <Icon name="board" />
                </span>
                <span className="role-badge">{project.role.toLowerCase()}</span>
              </div>
              <h1>{project.name}</h1>
              <p>
                {project.description || "Give every task a clear next step."}
              </p>
              <div className="board-meta">
                <span>
                  <Icon name="users" />
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>
                <span>
                  <Icon name="check" />
                  {done} of {tasks.length} complete
                </span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="secondary-button"
                onClick={() => setShowMembers(true)}
              >
                <Icon name="users" />
                Members
              </button>
              <button
                onClick={() => {
                  setCreateStatus("TODO");
                  setShowCreate(true);
                }}
              >
                <Icon name="plus" />
                New task
              </button>
            </div>
          </header>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <section className="board-toolbar" aria-label="Filter tasks">
            <div className="filter-grid">
              <label>
                Search tasks
                <input
                  type="search"
                  placeholder="Find a task…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <label>
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  {columns.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="ALL">All priorities</option>
                  {["LOW", "MEDIUM", "HIGH"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Assignee
                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <option value="ALL">Everyone</option>
                  <option value="UNASSIGNED">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="secondary-button"
                disabled={!active}
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                  setPriority("ALL");
                  setAssignee("ALL");
                }}
              >
                Clear
              </button>
            </div>
            <p className="filter-summary">
              Showing {filtered.length} of {tasks.length} tasks{" "}
              <span>Click a task to edit its details or status.</span>
            </p>
          </section>
          <section className="kanban-board" aria-label="Project task board">
            {columns.map(([value, label]) => {
              const list = filtered.filter((t) => t.status === value);
              return (
                <div
                  key={value}
                  className={`kanban-column column-${value.toLowerCase()}`}
                >
                  <div className="column-heading">
                    <h2>
                      <i />
                      {label}
                      <span>{list.length}</span>
                    </h2>
                    <button
                      className="column-add"
                      aria-label={`Create task in ${label} column`}
                      onClick={() => {
                        setCreateStatus(value);
                        setShowCreate(true);
                      }}
                    >
                      <Icon name="plus" />
                    </button>
                  </div>
                  <div className="task-list">
                    {list.map((t) => (
                      <button
                        key={t.id}
                        className="task-card"
                        onClick={() => setSelected(t)}
                      >
                        <div className="task-card-header">
                          <span
                            className={`priority priority-${t.priority.toLowerCase()}`}
                          >
                            {t.priority.toLowerCase()} priority
                          </span>
                          <span className="task-id">TF-{t.id}</span>
                        </div>
                        <h3>{t.title}</h3>
                        {t.description && <p>{t.description}</p>}
                        <div className="task-card-footer">
                          <span className="task-assignee">
                            <span className="mini-avatar">
                              {t.assignee_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("") || "–"}
                            </span>
                            {t.assignee_name || "Unassigned"}
                          </span>
                          {t.due_date && (
                            <span className="task-date">
                              <Icon name="clock" />
                              {new Date(t.due_date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    {!list.length && (
                      <div className="empty-column">
                        <Icon name={value === "DONE" ? "check" : "board"} />
                        <p>
                          {active
                            ? "No matching tasks"
                            : "A little room for progress."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
          {showCreate && (
            <CreateTaskModal
              initialStatus={createStatus}
              projectId={Number(id)}
              members={members}
              onClose={() => setShowCreate(false)}
              onCreated={loadTasks}
            />
          )}{" "}
          {selected && (
            <EditTaskModal
              task={selected}
              members={members}
              onClose={() => setSelected(null)}
              onUpdated={loadTasks}
            />
          )}{" "}
          {showMembers && (
            <ManageMembersModal
              projectId={Number(id)}
              projectRole={project.role}
              members={members}
              onClose={() => setShowMembers(false)}
              onMembersChanged={loadMembers}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
