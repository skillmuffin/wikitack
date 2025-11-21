"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WikiHeader from "@/components/WikiHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    const autoSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!token) {
      setError("You must be logged in to create a workspace");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/workspaces/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create workspace");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <WikiHeader />

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            {/* Welcome Card */}
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-2xl font-bold text-white shadow-lg">
                  W
                </div>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">
                Welcome to WikiTack, {user?.display_name || user?.username}!
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Let's create your workspace to get started
              </p>
            </div>

            {/* Setup Form */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Workspace Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
                  >
                    Workspace Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Company Wiki"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-400"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Choose a name that represents your team or organization
                  </p>
                </div>

                {/* Workspace Slug */}
                <div>
                  <label
                    htmlFor="slug"
                    className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
                  >
                    Workspace URL
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      wikitack.com/
                    </span>
                    <input
                      id="slug"
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      pattern="[a-z0-9-]+"
                      placeholder="my-company"
                      className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-400"
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Only lowercase letters, numbers, and hyphens
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="A brief description of what this workspace is for..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-400"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !name || !slug}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading ? "Creating..." : "Create Workspace"}
                </button>
              </form>

              {/* Info Card */}
              <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-medium">What is a workspace?</p>
                    <p className="mt-1 text-blue-700 dark:text-blue-400">
                      A workspace is your team's home for all wiki content. It contains spaces,
                      pages, and members. You can invite collaborators after setup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
