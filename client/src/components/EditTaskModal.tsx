import {
    useState,
    type FormEvent,
} from "react";

import { api } from "../api/client";

interface Member {
    id: number;
    name: string;
    email: string;
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

interface EditTaskModalProps {
    task: Task;
    members: Member[];
    onClose: () => void;
    onUpdated: () => Promise<void>;
}

export function EditTaskModal({
    task,
    members,
    onClose,
    onUpdated,
}: EditTaskModalProps) {
    const [title, setTitle] =
        useState(task.title);

    const [description, setDescription] =
        useState(task.description);

    const [status, setStatus] =
        useState(task.status);

    const [priority, setPriority] =
        useState(task.priority);

    const [assignedTo, setAssignedTo] =
        useState(
            task.assigned_to
                ? String(task.assigned_to)
                : ""
        );

    const [dueDate, setDueDate] =
        useState(
            task.due_date
                ? new Date(task.due_date)
                    .toISOString()
                    .slice(0, 16)
                : ""
        );

    const [error, setError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");

            await api.patch(
                `/tasks/${task.id}`,
                {
                    title,
                    description,
                    status,
                    priority,

                    assignedTo:
                        assignedTo === ""
                            ? null
                            : Number(assignedTo),

                    dueDate:
                        dueDate === ""
                            ? null
                            : new Date(
                                dueDate
                            ).toISOString(),
                }
            );

            await onUpdated();

            onClose();
        } catch {
            setError(
                "Unable to update task."
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        const confirmed =
            window.confirm(
                `Delete "${task.title}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setError("");

            await api.delete(
                `/tasks/${task.id}`
            );

            await onUpdated();

            onClose();
        } catch {
            setError(
                "Unable to delete task."
            );
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="modal-backdrop">
            <div className="task-modal">
                <div className="modal-header">
                    <h2>Edit Task</h2>

                    <button
                        className="close-button"
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>
                        Task title

                        <input
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                            minLength={2}
                            required
                        />
                    </label>

                    <label>
                        Description

                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            rows={4}
                        />
                    </label>

                    <label>
                        Status

                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value as
                                    | "TODO"
                                    | "IN_PROGRESS"
                                    | "DONE"
                                )
                            }
                        >
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

                    <label>
                        Priority

                        <select
                            value={priority}
                            onChange={(event) =>
                                setPriority(
                                    event.target.value as
                                    | "LOW"
                                    | "MEDIUM"
                                    | "HIGH"
                                )
                            }
                        >
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

                    <label>
                        Assign to

                        <select
                            value={assignedTo}
                            onChange={(event) =>
                                setAssignedTo(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Unassigned
                            </option>

                            {members.map(
                                (member) => (
                                    <option
                                        key={member.id}
                                        value={member.id}
                                    >
                                        {member.name}
                                    </option>
                                )
                            )}
                        </select>
                    </label>

                    <label>
                        Due date

                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(event) =>
                                setDueDate(
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    {error && (
                        <p className="error">
                            {error}
                        </p>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            style={{
                                marginRight: "auto",
                                background: "#fee2e2",
                                color: "#991b1b",
                            }}
                        >
                            {deleting
                                ? "Deleting..."
                                : "Delete Task"}
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}