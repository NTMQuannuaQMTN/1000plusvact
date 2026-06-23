"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        // ✅ SAFE: use returned user (NOT getUser)
        const user = data.user;

        console.log("LoginPage: user", user);

        if (!user) {
            setError("Login failed: no user returned");
            setLoading(false);
            return;
        }

        // 🔥 wait for profile (small delay avoids race condition)
        await new Promise((r) => setTimeout(r, 100));

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const target =
            profile?.role === "admin" ? "/admin" : "/dashboard";

        router.replace(target);

        setLoading(false);
    };

    return (
        <div className="w-full max-w-md p-8">
            <h2 className="text-2xl font-bold text-blue-900">Login</h2>
            <p className="text-gray-500 text-sm mt-1">
                Welcome back to VACT
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-3">
                <input
                    className="w-full p-3 border rounded-lg"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    className="w-full p-3 border rounded-lg"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                )}

                <button
                    disabled={loading}
                    className="w-full bg-blue-900 text-white p-3 rounded-lg"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <p className="text-sm text-center mt-5 text-gray-600">
                Don’t have an account?{" "}
                <Link href="/signup" className="text-blue-900 font-medium">
                    Sign up
                </Link>
            </p>
        </div>
    );
}