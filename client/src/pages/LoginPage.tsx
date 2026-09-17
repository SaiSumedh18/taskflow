import { useState, type FormEvent } from "react";
import {
    Link,
    Navigate,
    useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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

            await login(email, password);

            navigate("/dashboard");
        } catch {
            setError("Invalid email or password.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <div className="auth-card">
                <h1>TaskFlow</h1>
                <h2>Welcome back</h2>

                <form onSubmit={handleSubmit}>
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
                            ? "Signing in..."
                            : "Sign in"}
                    </button>
                </form>

                <p>
                    Don't have an account?{" "}
                    <Link to="/register">
                        Create one
                    </Link>
                </p>
            </div>
        </main>
    );
}