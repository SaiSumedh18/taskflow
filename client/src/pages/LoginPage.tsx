import { AuthLayout } from "../components/AuthLayout";
import { Icon } from "../components/Icon";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await login(email, password);

      navigate("/dashboard");
    } catch {
      setError(
        "Unable to sign in. Check your email and password, or try again if the server is still waking up.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
      <h2>Welcome back.</h2>
      <p className="auth-intro">Pick up where your team left off.</p>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
          <Icon name="arrow" />
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </AuthLayout>
  );
}
