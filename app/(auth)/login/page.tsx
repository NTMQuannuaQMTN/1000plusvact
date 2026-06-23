"use client";

import { supabase } from "@/lib/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            setLoading(false);
            return;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

        console.log(profile);

        router.replace(
            profile?.role === "admin" ? "/admin" : "/dashboard"
        );
    };

    return (
        <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-blue-900">Login</h1>

            <form onSubmit={handleLogin} className="mt-6 space-y-3">
                <input
                    className="w-full p-3 border rounded-lg text-gray-700"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="w-full p-3 border rounded-lg text-gray-700"
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button className="w-full bg-blue-900 text-white p-3 rounded">
                    Login
                </button>
            </form>

            <p className="text-sm text-center mt-5 text-gray-600">
                No account? <Link href="/signup" className="text-blue-900 font-medium">Sign up</Link>
            </p>
        </div>
    );
}