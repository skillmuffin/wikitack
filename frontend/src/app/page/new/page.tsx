"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { WikiSpace } from "@/types/wiki";
import WikiHeader from "@/components/WikiHeader";

export default function NewPagePage() {
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();

  const [spaces, setSpaces] = useState<WikiSpace[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<WikiSpace[]>([]);
  const [spaceSearch, setSpaceSearch] = useState("");
  const [selectedSpace, setSelectedSpace] = useState<WikiSpace | null>(null);
  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch spaces
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/spaces?limit=100`);
        if (!response.ok) throw new Error("Failed to fetch spaces");
        const data = await response.json();
        setSpaces(data);
        setFilteredSpaces(data);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchSpaces();
  }, []);

  // Filter spaces based on search
  useEffect(() => {
    if (spaceSearch.trim() === "") {
      setFilteredSpaces(spaces);
    } else {
      const search = spaceSearch.toLowerCase();
      setFilteredSpaces(
        spaces.filter(
          (space) =>
            space.name.toLowerCase().includes(search) ||
            space.slug.toLowerCase().includes(search)
        )
      );
    }
  }, [spaceSearch, spaces]);

  // Auto-generate slug from title
  useEffect(() => {
    if (title) {
      const autoSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(autoSlug);
    }
  }, [title]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSpace || !title.trim() || !slug.trim() || !user?.id) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          space_id: selectedSpace.id,
          title,
          slug,
          content: content || null,
          created_by: user.id,
          tag_ids: [],
          sections: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create page");
      }

      router.push(`/wiki/${slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to create page");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <WikiHeader />
      <main className="flex-1 bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Create New Page</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Add a new page to your wiki
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {/* Space Selector - First Option */}
            <div className="relative">
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Space <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Search and select a space..."
                value={selectedSpace ? selectedSpace.name : spaceSearch}
                onChange={(e) => {
                  setSpaceSearch(e.target.value);
                  setSelectedSpace(null);
                  setShowSpaceDropdown(true);
                }}
                onFocus={() => setShowSpaceDropdown(true)}
                className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-400"
              />
              {showSpaceDropdown && filteredSpaces.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  {filteredSpaces.map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => {
                        setSelectedSpace(space);
                        setSpaceSearch("");
                        setShowSpaceDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {space.name}
                      </div>
                      {space.description && (
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {space.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedSpace && (
                <div className="mt-2 rounded-md bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedSpace.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedSpace(null)}
                      className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter page title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-400"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="page-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-400"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Auto-generated from title. You can edit it if needed.
              </p>
            </div>

            {/* Content (Optional) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Initial Content (Optional)
              </label>
              <textarea
                placeholder="Enter initial content for the page..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-zinc-400"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <Link
                href="/"
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? "Creating..." : "Create Page"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
