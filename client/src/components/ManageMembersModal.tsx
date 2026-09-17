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

interface ManageMembersModalProps {
    projectId: number;
    projectRole: string;
    members: Member[];
    onClose: () => void;
    onMembersChanged: () => Promise<void>;
}

export function ManageMembersModal({
    projectId,
    projectRole,
    members,
    onClose,
    onMembersChanged,
}: ManageMembersModalProps) {
    const [email, setEmail] =
        useState("");

    const [error, setError] =
        useState("");

    const [submitting, setSubmitting] =
        useState(false);

    const [removingId, setRemovingId] =
        useState<number | null>(null);

    const isOwner =
        projectRole === "OWNER";

    async function handleAddMember(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");

            await api.post(
                `/projects/${projectId}/members`,
                {
                    email,
                }
            );

            setEmail("");

            await onMembersChanged();
        } catch (error: any) {
            setError(
                error?.response?.data?.message ??
                "Unable to add member."
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRemoveMember(
        member: Member
    ) {
        const confirmed =
            window.confirm(
                `Remove ${member.name} from this project?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setRemovingId(member.id);
            setError("");

            await api.delete(
                `/projects/${projectId}/members/${member.id}`
            );

            await onMembersChanged();
        } catch (error: any) {
            setError(
                error?.response?.data?.message ??
                "Unable to remove member."
            );
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <div className="modal-backdrop">
            <div className="task-modal">
                <div className="modal-header">
                    <h2>Project Members</h2>

                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {isOwner && (
                    <form
                        onSubmit={handleAddMember}
                    >
                        <label>
                            Add member by email

                            <input
                                type="email"
                                placeholder="teammate@example.com"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Adding..."
                                : "Add Member"}
                        </button>
                    </form>
                )}

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                <div
                    style={{
                        marginTop: "24px",
                    }}
                >
                    {members.map((member) => (
                        <div
                            key={member.id}
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems: "center",
                                gap: "16px",
                                padding: "14px 0",
                                borderBottom:
                                    "1px solid #e5e7eb",
                            }}
                        >
                            <div>
                                <strong>
                                    {member.name}
                                </strong>

                                <div
                                    style={{
                                        color: "#6b7280",
                                        fontSize: "14px",
                                        marginTop: "3px",
                                    }}
                                >
                                    {member.email}
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <span className="role-badge">
                                    {member.role}
                                </span>

                                {isOwner &&
                                    member.role !==
                                    "OWNER" && (
                                        <button
                                            type="button"
                                            disabled={
                                                removingId ===
                                                member.id
                                            }
                                            onClick={() =>
                                                handleRemoveMember(
                                                    member
                                                )
                                            }
                                            style={{
                                                border: 0,
                                                borderRadius:
                                                    "7px",
                                                padding:
                                                    "7px 10px",
                                                background:
                                                    "#fee2e2",
                                                color:
                                                    "#991b1b",
                                                fontWeight:
                                                    600,
                                            }}
                                        >
                                            {removingId ===
                                                member.id
                                                ? "Removing..."
                                                : "Remove"}
                                        </button>
                                    )}
                            </div>
                        </div>
                    ))}
                </div>

                {!isOwner && (
                    <p
                        style={{
                            marginTop: "20px",
                            color: "#6b7280",
                            fontSize: "14px",
                        }}
                    >
                        Only the project owner
                        can add or remove members.
                    </p>
                )}
            </div>
        </div>
    );
}