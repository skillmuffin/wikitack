"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CreateSpaceModalProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (space?: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    workspace_id?: number;
  }) => void;
}

export default function CreateSpaceModal({
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
}: CreateSpaceModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
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
      setError("You must be logged in");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/spaces/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          name,
          slug,
          description: description || null,
          is_private: isPrivate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create space");
      }

      const createdSpace = await response.json();
      // Reset form and close modal
      setName("");
      setSlug("");
      setDescription("");
      setIsPrivate(false);
      onSuccess(createdSpace);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setName("");
      setSlug("");
      setDescription("");
      setIsPrivate(false);
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Create Space</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Space Name */}
          <div>
            <label
              htmlFor="space-name"
              className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
            >
              Space Name <span className="text-red-500">*</span>
            </label>
            <input
              id="space-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Engineering, Marketing, Product..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Space Slug */}
          <div>
            <label
              htmlFor="space-slug"
              className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
            >
              Space Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="space-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9-]+"
              placeholder="engineering"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Only lowercase letters, numbers, and hyphens
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="space-description"
              className="mb-2 block text-sm font-medium text-zinc-900 dark:text-white"
            >
              Description (Optional)
            </label>
            <textarea
              id="space-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="A brief description of this space..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
          </div>

          {/* Private Toggle */}
          <div className="flex items-center gap-3">
            <input
              id="space-private"
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700"
            />
            <label
              htmlFor="space-private"
              className="text-sm font-medium text-zinc-900 dark:text-white"
            >
              Make this space private
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border-2 border-zinc-300 px-4 py-2 font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name || !slug}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? "Creating..." : "Create Space"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
