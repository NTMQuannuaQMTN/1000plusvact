"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 🔥 IMPORTANT:
    // profile is auto-created by DB trigger
    // so we ONLY redirect

    if (data.user) {
      router.replace("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md p-8">
      <h2 className="text-2xl font-bold text-blue-900">Create account</h2>
      <p className="text-gray-500 text-sm mt-1">
        Start your VACT journey
      </p>

      <form onSubmit={handleSignup} className="mt-6 space-y-3">
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
          {loading ? "Creating..." : "Sign up"}
        </button>
      </form>

      <p className="text-sm text-center mt-5 text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-900 font-medium">
          Login
        </Link>
      </p>
    </div>
  );
}