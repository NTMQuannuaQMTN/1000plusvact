"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-50">
      <h1 className="text-3xl font-bold text-blue-900">
        VACT AI Learning Platform
      </h1>

      <p className="mt-2 text-gray-600">
        Prepare for VNUHCM ACT smarter with AI
      </p>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-blue-900 text-white rounded"
        >
          Login
        </button>

        <button
          onClick={() => router.push("/signup")}
          className="px-4 py-2 border border-blue-900 text-blue-900 rounded"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}