import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import { api } from "../api/client";

import { CreateTaskModal } from "../components/CreateTaskModal";
import { EditTaskModal } from "../components/EditTaskModal";
import { ManageMembersModal } from "../components/ManageMembersModal";

interface Project {
    id: number;
    name: string;
    description: string;
    owner_id: number;
    role: string;
}

interface Task {
    id: number;
    title: string;
    description: string;

    status:
    | "TODO"
    | "IN_PROGRESS"
    | "DONE";

    priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

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

type StatusFilter =
    | "ALL"
    | "TODO"
    | "IN_PROGRESS"
    | "DONE";

type PriorityFilter =
    | "ALL"
    | "LOW"
    | "MEDIUM"
    | "HIGH";

export function ProjectPage() {
    const { id } = useParams();

    const navigate =
        useNavigate();

    const [project, setProject] =
        useState<Project | null>(
            null
        );

    const [tasks, setTasks] =
        useState<Task[]>([]);

    const [members, setMembers] =
        useState<Member[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [
        showCreateTask,
        setShowCreateTask,
    ] = useState(false);

    const [
        showMembers,
        setShowMembers,
    ] = useState(false);

    const [
        selectedTask,
        setSelectedTask,
    ] = useState<Task | null>(
        null
    );

    const [
        searchQuery,
        setSearchQuery,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<StatusFilter>(
        "ALL"
    );

    const [
        priorityFilter,
        setPriorityFilter,
    ] = useState<PriorityFilter>(
        "ALL"
    );

    const [
        assigneeFilter,
        setAssigneeFilter,
    ] = useState("ALL");

    useEffect(() => {
        async function loadProject() {
            try {
                setLoading(true);
                setError("");

                const [
                    projectResponse,
                    tasksResponse,
                    membersResponse,
                ] = await Promise.all([
                    api.get(
                        `/projects/${id}`
                    ),

                    api.get(
                        `/projects/${id}/tasks`
                    ),

                    api.get(
                        `/projects/${id}/members`
                    ),
                ]);

                setProject(
                    projectResponse.data
                        .project
                );

                setTasks(
                    tasksResponse.data.tasks
                );

                setMembers(
                    membersResponse.data
                        .members
                );
            } catch {
                setError(
                    "Unable to load project."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProject();
    }, [id]);

    async function loadTasks() {
        try {
            const response =
                await api.get(
                    `/projects/${id}/tasks`
                );

            setTasks(
                response.data.tasks
            );
        } catch {
            setError(
                "Unable to refresh tasks."
            );
        }
    }

    async function loadMembers() {
        try {
            const response =
                await api.get(
                    `/projects/${id}/members`
                );

            setMembers(
                response.data.members
            );

            await loadTasks();
        } catch {
            setError(
                "Unable to refresh members."
            );
        }
    }

    function clearFilters() {
        setSearchQuery("");
        setStatusFilter("ALL");
        setPriorityFilter("ALL");
        setAssigneeFilter("ALL");
    }

    if (loading) {
        return (
            <main className="project-page">
                <p>
                    Loading project...
                </p>
            </main>
        );
    }

    if (
        error ||
        !project
    ) {
        return (
            <main className="project-page">
                <p className="error">
                    {error ||
                        "Project not found."}
                </p>

                <button
                    onClick={() =>
                        navigate(
                            "/dashboard"
                        )
                    }
                >
                    Back to Dashboard
                </button>
            </main>
        );
    }

    const normalizedSearch =
        searchQuery
            .trim()
            .toLowerCase();

    const filteredTasks =
        tasks.filter((task) => {
            const matchesSearch =
                normalizedSearch === "" ||
                task.title
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    ) ||
                task.description
                    .toLowerCase()
                    .includes(
                        normalizedSearch
                    );

            const matchesStatus =
                statusFilter === "ALL" ||
                task.status ===
                statusFilter;

            const matchesPriority =
                priorityFilter ===
                "ALL" ||
                task.priority ===
                priorityFilter;

            let matchesAssignee =
                true;

            if (
                assigneeFilter ===
                "UNASSIGNED"
            ) {
                matchesAssignee =
                    task.assigned_to ===
                    null;
            } else if (
                assigneeFilter !==
                "ALL"
            ) {
                matchesAssignee =
                    task.assigned_to ===
                    Number(
                        assigneeFilter
                    );
            }

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesAssignee
            );
        });

    const todoTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "TODO"
        );

    const progressTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "IN_PROGRESS"
        );

    const doneTasks =
        filteredTasks.filter(
            (task) =>
                task.status ===
                "DONE"
        );

    const filtersActive =
        searchQuery !== "" ||
        statusFilter !== "ALL" ||
        priorityFilter !== "ALL" ||
        assigneeFilter !== "ALL";

    function renderTask(
        task: Task
    ) {
        return (
            <article
                key={task.id}
                className="task-card"
                onClick={() =>
                    setSelectedTask(task)
                }
                style={{
                    cursor: "pointer",
                }}
            >
                <div className="task-card-header">
                    <h4>
                        {task.title}
                    </h4>

                    <span
                        className={`priority priority-${task.priority.toLowerCase()}`}
                    >
                        {task.priority}
                    </span>
                </div>

                {task.description && (
                    <p>
                        {
                            task.description
                        }
                    </p>
                )}

                {task.assignee_name ? (
                    <small>
                        Assigned to{" "}
                        <strong>
                            {
                                task.assignee_name
                            }
                        </strong>
                    </small>
                ) : (
                    <small>
                        Unassigned
                    </small>
                )}

                {task.due_date && (
                    <small>
                        Due{" "}
                        {new Date(
                            task.due_date
                        ).toLocaleDateString()}
                    </small>
                )}
            </article>
        );
    }

    return (
        <main className="project-page">
            <div className="project-navigation">
                <Link to="/dashboard">
                    ← Dashboard
                </Link>
            </div>

            <header className="project-header">
                <div>
                    <div className="project-title-row">
                        <h1>
                            {project.name}
                        </h1>

                        <span className="role-badge">
                            {
                                project.role
                            }
                        </span>
                    </div>

                    <p>
                        {
                            project.description
                        }
                    </p>

                    <p className="member-count">
                        {members.length}{" "}
                        {members.length === 1
                            ? "member"
                            : "members"}
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={() =>
                            setShowMembers(
                                true
                            )
                        }
                    >
                        Manage Members
                    </button>

                    <button
                        onClick={() =>
                            setShowCreateTask(
                                true
                            )
                        }
                    >
                        + New Task
                    </button>
                </div>
            </header>

            <section
                style={{
                    background: "white",
                    border:
                        "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "18px",
                    marginBottom: "24px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "minmax(220px, 2fr) repeat(3, minmax(150px, 1fr)) auto",
                        gap: "12px",
                        alignItems: "end",
                    }}
                >
                    <label
                        style={{
                            display: "flex",
                            flexDirection:
                                "column",
                            gap: "6px",
                            fontWeight: 600,
                        }}
                    >
                        Search tasks

                        <input
                            type="search"
                            placeholder="Search title or description..."
                            value={
                                searchQuery
                            }
                            onChange={(
                                event
                            ) =>
                                setSearchQuery(
                                    event.target
                                        .value
                                )
                            }
                            style={{
                                padding:
                                    "10px 12px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius:
                                    "8px",
                            }}
                        />
                    </label>

                    <label
                        style={{
                            display: "flex",
                            flexDirection:
                                "column",
                            gap: "6px",
                            fontWeight: 600,
                        }}
                    >
                        Status

                        <select
                            value={
                                statusFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setStatusFilter(
                                    event.target
                                        .value as StatusFilter
                                )
                            }
                            style={{
                                padding:
                                    "10px 12px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius:
                                    "8px",
                                background:
                                    "white",
                            }}
                        >
                            <option value="ALL">
                                All
                            </option>

                            <option value="TODO">
                                Todo
                            </option>

                            <option value="IN_PROGRESS">
                                In Progress
                            </option>

                            <option value="DONE">
                                Done
                            </option>
                        </select>
                    </label>

                    <label
                        style={{
                            display: "flex",
                            flexDirection:
                                "column",
                            gap: "6px",
                            fontWeight: 600,
                        }}
                    >
                        Priority

                        <select
                            value={
                                priorityFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setPriorityFilter(
                                    event.target
                                        .value as PriorityFilter
                                )
                            }
                            style={{
                                padding:
                                    "10px 12px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius:
                                    "8px",
                                background:
                                    "white",
                            }}
                        >
                            <option value="ALL">
                                All
                            </option>

                            <option value="LOW">
                                Low
                            </option>

                            <option value="MEDIUM">
                                Medium
                            </option>

                            <option value="HIGH">
                                High
                            </option>
                        </select>
                    </label>

                    <label
                        style={{
                            display: "flex",
                            flexDirection:
                                "column",
                            gap: "6px",
                            fontWeight: 600,
                        }}
                    >
                        Assignee

                        <select
                            value={
                                assigneeFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setAssigneeFilter(
                                    event.target
                                        .value
                                )
                            }
                            style={{
                                padding:
                                    "10px 12px",
                                border:
                                    "1px solid #d1d5db",
                                borderRadius:
                                    "8px",
                                background:
                                    "white",
                            }}
                        >
                            <option value="ALL">
                                All
                            </option>

                            <option value="UNASSIGNED">
                                Unassigned
                            </option>

                            {members.map(
                                (member) => (
                                    <option
                                        key={
                                            member.id
                                        }
                                        value={
                                            member.id
                                        }
                                    >
                                        {
                                            member.name
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={
                            clearFilters
                        }
                        disabled={
                            !filtersActive
                        }
                        style={{
                            padding:
                                "10px 14px",
                            border: 0,
                            borderRadius:
                                "8px",
                            background:
                                filtersActive
                                    ? "#e5e7eb"
                                    : "#f3f4f6",
                            color:
                                filtersActive
                                    ? "#111827"
                                    : "#9ca3af",
                            fontWeight: 600,
                            cursor:
                                filtersActive
                                    ? "pointer"
                                    : "not-allowed",
                        }}
                    >
                        Clear
                    </button>
                </div>

                <div
                    style={{
                        marginTop: "12px",
                        color: "#6b7280",
                        fontSize: "14px",
                    }}
                >
                    Showing{" "}
                    <strong>
                        {
                            filteredTasks.length
                        }
                    </strong>{" "}
                    of{" "}
                    <strong>
                        {tasks.length}
                    </strong>{" "}
                    tasks
                </div>
            </section>

            <section className="kanban-board">
                <div className="kanban-column">
                    <div className="column-heading">
                        <h3>
                            TODO
                        </h3>

                        <span>
                            {
                                todoTasks.length
                            }
                        </span>
                    </div>

                    <div className="task-list">
                        {todoTasks.map(
                            renderTask
                        )}

                        {todoTasks.length ===
                            0 && (
                                <p className="empty-column">
                                    No matching tasks
                                </p>
                            )}
                    </div>
                </div>

                <div className="kanban-column">
                    <div className="column-heading">
                        <h3>
                            IN PROGRESS
                        </h3>

                        <span>
                            {
                                progressTasks.length
                            }
                        </span>
                    </div>

                    <div className="task-list">
                        {progressTasks.map(
                            renderTask
                        )}

                        {progressTasks.length ===
                            0 && (
                                <p className="empty-column">
                                    No matching tasks
                                </p>
                            )}
                    </div>
                </div>

                <div className="kanban-column">
                    <div className="column-heading">
                        <h3>
                            DONE
                        </h3>

                        <span>
                            {
                                doneTasks.length
                            }
                        </span>
                    </div>

                    <div className="task-list">
                        {doneTasks.map(
                            renderTask
                        )}

                        {doneTasks.length ===
                            0 && (
                                <p className="empty-column">
                                    No matching tasks
                                </p>
                            )}
                    </div>
                </div>
            </section>

            {showCreateTask && (
                <CreateTaskModal
                    projectId={
                        Number(id)
                    }
                    members={
                        members
                    }
                    onClose={() =>
                        setShowCreateTask(
                            false
                        )
                    }
                    onCreated={
                        loadTasks
                    }
                />
            )}

            {selectedTask && (
                <EditTaskModal
                    task={
                        selectedTask
                    }
                    members={
                        members
                    }
                    onClose={() =>
                        setSelectedTask(
                            null
                        )
                    }
                    onUpdated={
                        loadTasks
                    }
                />
            )}

            {showMembers && (
                <ManageMembersModal
                    projectId={
                        Number(id)
                    }
                    projectRole={
                        project.role
                    }
                    members={
                        members
                    }
                    onClose={() =>
                        setShowMembers(
                            false
                        )
                    }
                    onMembersChanged={
                        loadMembers
                    }
                />
            )}
        </main>
    );
}