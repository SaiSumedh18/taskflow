import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import { useNavigate } from "react-router-dom";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface Project {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    role: string;
    created_at: string;
    updated_at: string;
}

export function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [error, setError] = useState("");

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [projectName, setProjectName] =
        useState("");

    const [projectDescription, setProjectDescription] =
        useState("");

    const [creating, setCreating] =
        useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            setLoadingProjects(true);
            setError("");

            const response = await api.get("/projects");

            setProjects(response.data.projects);
        } catch {
            setError("Unable to load projects.");
        } finally {
            setLoadingProjects(false);
        }
    }

    async function handleCreateProject(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setCreating(true);
            setError("");

            const response = await api.post(
                "/projects",
                {
                    name: projectName,
                    description: projectDescription,
                }
            );

            setProjects((current) => [
                response.data.project,
                ...current,
            ]);

            setProjectName("");
            setProjectDescription("");
            setShowCreateForm(false);
        } catch {
            setError("Unable to create project.");
        } finally {
            setCreating(false);
        }
    }

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <main className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>TaskFlow Dashboard</h1>

                    <p>
                        Welcome, <strong>{user?.name}</strong>
                    </p>

                    <p>{user?.email}</p>
                </div>

                <button onClick={handleLogout}>
                    Log out
                </button>
            </div>

            <section className="dashboard-content">
                <div className="projects-heading">
                    <div>
                        <h2>Your Projects</h2>

                        <p>
                            Manage the projects you own or collaborate on.
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            setShowCreateForm((current) => !current)
                        }
                    >
                        {showCreateForm
                            ? "Cancel"
                            : "Create Project"}
                    </button>
                </div>

                {showCreateForm && (
                    <form
                        className="create-project-form"
                        onSubmit={handleCreateProject}
                    >
                        <label>
                            Project name
                            <input
                                value={projectName}
                                onChange={(event) =>
                                    setProjectName(event.target.value)
                                }
                                required
                                minLength={2}
                                maxLength={150}
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                value={projectDescription}
                                onChange={(event) =>
                                    setProjectDescription(
                                        event.target.value
                                    )
                                }
                                maxLength={1000}
                                rows={4}
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={creating}
                        >
                            {creating
                                ? "Creating..."
                                : "Create Project"}
                        </button>
                    </form>
                )}

                {error && (
                    <p className="error">{error}</p>
                )}

                {loadingProjects ? (
                    <p>Loading projects...</p>
                ) : projects.length === 0 ? (
                    <div className="empty-state">
                        <h3>No projects yet</h3>

                        <p>
                            Create your first TaskFlow project.
                        </p>
                    </div>
                ) : (
                    <div className="project-grid">
                        {projects.map((project) => (
                            <article
                                key={project.id}
                                className="project-card"
                                onClick={() =>
                                    navigate(`/projects/${project.id}`)
                                }
                            >
                                <div className="project-card-top">
                                    <h3>{project.name}</h3>

                                    <span className="role-badge">
                                        {project.role}
                                    </span>
                                </div>

                                <p>
                                    {project.description ||
                                        "No description provided."}
                                </p>

                                <small>
                                    Created{" "}
                                    {new Date(
                                        project.created_at
                                    ).toLocaleDateString()}
                                </small>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}