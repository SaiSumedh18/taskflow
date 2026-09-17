import { useState, type FormEvent } from "react";
import {
    Link,
    Navigate,
    useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
    const { register, user } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] =
        useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] =
        useState(false);

    if (user) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setSubmitting(true);
            setError("");

            await register(
                name,
                email,
                password
            );

            navigate("/dashboard");
        } catch {
            setError(
                "Unable to create account."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <div className="auth-card">
                <h1>TaskFlow</h1>
                <h2>Create account</h2>

                <form onSubmit={handleSubmit}>
                    <label>
                        Name
                        <input
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            required
                        />
                    </label>

                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            minLength={8}
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />
                    </label>

                    {error && (
                        <p className="error">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Creating..."
                            : "Create account"}
                    </button>
                </form>

                <p>
                    Already have an account?{" "}
                    <Link to="/login">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}