import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import { api } from "../api/client";

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;

    login: (
        email: string,
        password: string
    ) => Promise<void>;

    register: (
        name: string,
        email: string,
        password: string
    ) => Promise<void>;

    logout: () => void;
}

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );

export function AuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [user, setUser] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        async function loadUser() {
            const token =
                localStorage.getItem(
                    "taskflow_token"
                );

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response =
                    await api.get("/auth/me");

                setUser(response.data.user);
            } catch {
                localStorage.removeItem(
                    "taskflow_token"
                );

                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);

    async function login(
        email: string,
        password: string
    ) {
        const response =
            await api.post("/auth/login", {
                email,
                password,
            });

        localStorage.setItem(
            "taskflow_token",
            response.data.token
        );

        setUser(response.data.user);
    }

    async function register(
        name: string,
        email: string,
        password: string
    ) {
        const response =
            await api.post("/auth/register", {
                name,
                email,
                password,
            });

        localStorage.setItem(
            "taskflow_token",
            response.data.token
        );

        setUser(response.data.user);
    }

    function logout() {
        localStorage.removeItem(
            "taskflow_token"
        );

        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
}