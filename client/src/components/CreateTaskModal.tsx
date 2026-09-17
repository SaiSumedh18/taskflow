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

interface CreateTaskModalProps {
    projectId: number;
    members: Member[];
    onClose: () => void;
    onCreated: () => Promise<void>;
}

export function CreateTaskModal({
    projectId,
    members,
    onClose,
    onCreated,
}: CreateTaskModalProps) {
    const [title, setTitle] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [priority, setPriority] =
        useState("MEDIUM");

    const [assignedTo, setAssignedTo] =
        useState("");

    const [dueDate, setDueDate] =
        useState("");

    const [error, setError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");

            await api.post(
                `/projects/${projectId}/tasks`,
                {
                    title,
                    description,
                    status: "TODO",
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

            await onCreated();

            onClose();
        } catch {
            setError(
                "Unable to create task."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="modal-backdrop">
            <div className="task-modal">
                <div className="modal-header">
                    <h2>Create Task</h2>

                    <button
                        className="close-button"
                        onClick={onClose}
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
                        Priority

                        <select
                            value={priority}
                            onChange={(event) =>
                                setPriority(
                                    event.target.value
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
                                ? "Creating..."
                                : "Create Task"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}