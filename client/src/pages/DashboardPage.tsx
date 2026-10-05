import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";
import { AppShell } from "../components/AppShell";
import { Icon } from "../components/Icon";
interface Project {
  id: number;
  name: string;
  description: string;
  role: string;
  created_at: string;
}
interface Task {
  status: string;
}
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]),
    [counts, setCounts] = useState<
      Record<number, { total: number; done: number }>
    >({});
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [showForm, setShowForm] = useState(false),
    [name, setName] = useState(""),
    [description, setDescription] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await api.get("/projects");
        const list: Project[] = response.data.projects;
        if (cancelled) return;
        setProjects(list);
        const results = await Promise.allSettled(
          list.map(async (p) => {
            const r = await api.get(`/projects/${p.id}/tasks`);
            const tasks: Task[] = r.data.tasks;
            return [
              p.id,
              {
                total: tasks.length,
                done: tasks.filter((t) => t.status === "DONE").length,
              },
            ] as const;
          }),
        );
        if (!cancelled)
          setCounts(
            Object.fromEntries(
              results.flatMap((r) =>
                r.status === "fulfilled" ? [r.value] : [],
              ),
            ),
          );
      } catch {
        if (!cancelled)
          setError(
            "Unable to load your workspace. Please refresh and try again.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  async function create(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    try {
      const r = await api.post("/projects", { name, description });
      setProjects((p) => [r.data.project, ...p]);
      setCounts((c) => ({ ...c, [r.data.project.id]: { total: 0, done: 0 } }));
      setName("");
      setDescription("");
      setShowForm(false);
    } catch {
      setError("Unable to create project. Please try again.");
    } finally {
      setCreating(false);
    }
  }
  async function sample() {
    setCreating(true);
    setError("");
    let projectId: number | undefined;
    try {
      const r = await api.post("/projects", {
        name: "Website launch",
        description:
          "A sample workspace to explore TaskFlow. Edit these tasks, invite your team, and make it your own.",
      });
      projectId = r.data.project.id;
      setProjects((p) => [r.data.project, ...p]);
      const examples = [
        [
          "Define the launch goals",
          "Write a clear brief and agree on the next milestone.",
          "DONE",
          "HIGH",
        ],
        [
          "Design the landing page",
          "Review typography, spacing, and the mobile experience.",
          "IN_PROGRESS",
          "HIGH",
        ],
        [
          "Review accessibility",
          "Check keyboard navigation, labels, and color contrast.",
          "TODO",
          "MEDIUM",
        ],
        [
          "Prepare launch checklist",
          "Capture the final steps before sharing the website.",
          "TODO",
          "LOW",
        ],
      ];
      for (const [title, description, status, priority] of examples)
        await api.post(`/projects/${projectId}/tasks`, {
          title,
          description,
          status,
          priority,
          assignedTo: user?.id ?? null,
          dueDate: null,
        });
      navigate(`/projects/${projectId}`);
    } catch {
      setError(
        projectId
          ? "Your sample project was created, but some tasks could not be added. Open it to continue."
          : "Unable to create a sample workspace. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }
  const summaries = Object.values(counts),
    total = summaries.reduce((a, c) => a + c.total, 0),
    done = summaries.reduce((a, c) => a + c.done, 0),
    complete = !loading && projects.every((p) => counts[p.id]);
  return (
    <AppShell>
      <header className="overview-hero">
        <div>
          <p className="eyebrow">YOUR SPACE TO MAKE PROGRESS</p>
          <h1>
            Good work starts
            <br />
            with a clear next step.
          </h1>
          <p>
            Welcome back, {user?.name.split(" ")[0]}. Let’s move your ideas
            forward.
          </p>
          <button onClick={() => setShowForm(!showForm)}>
            <Icon name="plus" />
            New project
          </button>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <span className="orbit-circle" />
          <span className="orbit-card">
            <Icon name="check" />
            One step closer.
          </span>
          <span className="orbit-board">
            <Icon name="board" />
          </span>
        </div>
      </header>
      <section className="summary-grid" aria-label="Workspace summary">
        {[
          [projects.length, "Projects", "board"],
          [complete ? total : "—", "Total tasks", "grid"],
          [complete ? total - done : "—", "Open tasks", "clock"],
          [complete ? done : "—", "Completed", "check"],
        ].map(([value, label, icon]) => (
          <div className="summary-card" key={label}>
            <span className="summary-icon">
              <Icon name={icon as "board"} />
            </span>
            <div>
              <strong>{loading ? "—" : value}</strong>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section>
        <div className="projects-heading">
          <div>
            <p className="eyebrow">MAKE ROOM FOR WHAT MATTERS</p>
            <h2>Your projects</h2>
            <p>A shared place for plans, people, and progress.</p>
          </div>
          <button
            className="secondary-button"
            disabled={creating || loading}
            onClick={sample}
          >
            <Icon name="board" />
            {creating ? "Working…" : "Try a sample workspace"}
          </button>
        </div>
        {showForm && (
          <form className="create-project-form" onSubmit={create}>
            <h3>A fresh start.</h3>
            <label>
              Project name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={150}
                placeholder="What are you working on?"
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Give your team a little context."
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button disabled={creating}>
                {creating ? "Creating…" : "Create project"}
                <Icon name="arrow" />
              </button>
            </div>
          </form>
        )}
        {loading ? (
          <div className="empty-state" role="status">
            Loading your workspace…
          </div>
        ) : !projects.length ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="board" />
            </span>
            <h3>Your next idea belongs here.</h3>
            <p>
              Create a project, or explore a sample workspace to see how it all
              comes together.
            </p>
            <button onClick={() => setShowForm(true)}>
              <Icon name="plus" />
              Create your first project
            </button>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((p) => {
              const c = counts[p.id];
              const progress = c?.total
                ? Math.round((c.done / c.total) * 100)
                : 0;
              return (
                <Link
                  key={p.id}
                  className="project-card"
                  to={`/projects/${p.id}`}
                >
                  <div className="project-card-top">
                    <span className="project-symbol">
                      <Icon name="board" />
                    </span>
                    <span className="role-badge">{p.role.toLowerCase()}</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p>
                    {p.description || "A fresh space for your next big idea."}
                  </p>
                  <div className="project-progress">
                    <span>
                      {c
                        ? `${c.done} of ${c.total} tasks complete`
                        : "Task summary unavailable"}
                    </span>
                    <strong>{c ? `${progress}%` : "—"}</strong>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className="project-card-footer">
                    <span>
                      Created{" "}
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <Icon name="arrow" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
