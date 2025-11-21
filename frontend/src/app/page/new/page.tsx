"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { WikiSpace, PageSection } from "@/types/wiki";
import WikiHeader from "@/components/WikiHeader";
import { parseSectionMarkup, sectionsToMarkup } from "@/lib/sectionMarkup";
import CreateSpaceModal from "@/components/CreateSpaceModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type Workspace = {
  id: number;
  name: string;
  slug: string;
};

export default function NewPagePage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [spaces, setSpaces] = useState<WikiSpace[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<WikiSpace[]>([]);
  const [spaceSearch, setSpaceSearch] = useState("");
  const [selectedSpace, setSelectedSpace] = useState<WikiSpace | null>(null);
  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [sectionMarkup, setSectionMarkup] = useState("");
  const [sections, setSections] = useState<PageSection[]>([]);
  const [markupError, setMarkupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch workspaces for the user
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${apiBase}/workspaces/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch workspaces");
        const data = await response.json();
        setWorkspaces(data);
        if (data.length === 0) {
          router.push("/workspace/setup");
        } else {
          const storedWorkspaceId = localStorage.getItem("selected_workspace_id");
          const preferred = storedWorkspaceId
            ? data.find((w: Workspace) => w.id === Number(storedWorkspaceId))
            : null;
          setCurrentWorkspace(preferred || data[0]);
        }
      } catch (err: any) {
        setError(err.message || "Unable to load workspaces");
      }
    };

    fetchWorkspaces();
  }, [token, router]);

  const fetchSpacesForWorkspace = useCallback(
    async (workspaceId: number, selectSpaceId?: number) => {
      if (!token) return;
      try {
        const response = await fetch(
          `${apiBase}/spaces/?workspace_id=${workspaceId}&limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          const message =
            response.status === 403
              ? "You do not have access to spaces in this workspace. Try creating a new space."
              : "Failed to fetch spaces";
          throw new Error(message);
        }
        const data: WikiSpace[] = await response.json();
        setSpaces(data);
        setFilteredSpaces(data);

        if (selectSpaceId) {
          const newSelection = data.find((s) => s.id === selectSpaceId) || null;
          setSelectedSpace(newSelection);
        } else if (selectedSpace) {
          const stillExists = data.find((s) => s.id === selectedSpace.id);
          if (!stillExists) {
            setSelectedSpace(null);
          }
        }
      } catch (err: any) {
        setError(err.message || "Unable to load spaces");
      }
    },
    [selectedSpace, token]
  );

  // Fetch spaces when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchSpacesForWorkspace(currentWorkspace.id);
    }
  }, [currentWorkspace, fetchSpacesForWorkspace]);

  const handleSpaceCreated = useCallback(
    (space?: { id: number; name: string; slug: string; description?: string | null }) => {
      if (!currentWorkspace) return;
      fetchSpacesForWorkspace(currentWorkspace.id, space?.id);
      if (space) {
        setSelectedSpace({
          id: space.id,
          name: space.name,
          slug: space.slug,
          description: space.description ?? undefined,
        });
        setSpaceSearch("");
      }
      setShowSpaceDropdown(false);
    },
    [currentWorkspace, fetchSpacesForWorkspace]
  );

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

  const handleMarkupChange = (value: string) => {
    setSectionMarkup(value);
    try {
      const parsed = parseSectionMarkup(value);
      setSections(parsed);
      setMarkupError(null);
    } catch (err: any) {
      setSections([]);
      setMarkupError(err.message || "Markup is invalid");
    }
  };

  const updateSections = (updater: (prev: PageSection[]) => PageSection[]) => {
    setSections((prev) => {
      const next = updater(prev).map((s, i) => ({ ...s, position: i }));
      setSectionMarkup(sectionsToMarkup(next));
      setMarkupError(null);
      return next;
    });
  };

  const addSection = (sectionType: PageSection["sectionType"]) => {
    const base: PageSection = {
      sectionType,
      position: sections.length,
    };
    if (sectionType === "snippet") {
      base.code = "";
      base.language = "text";
    } else if (sectionType === "picture") {
      base.mediaUrl = "";
      base.caption = "";
    } else {
      base.text = "";
    }
    updateSections((prev) => [...prev, base]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSpace || !title.trim() || !slug.trim() || !user?.id) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let parsedSections: PageSection[] = [];
      try {
        parsedSections = parseSectionMarkup(sectionMarkup || "");
        setMarkupError(null);
        setSections(parsedSections);
      } catch (markupErr: any) {
        setMarkupError(markupErr.message || "Markup is invalid");
        throw markupErr;
      }

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
          content: null,
          created_by: user.id,
          tag_ids: [],
          sections: parsedSections.map((s) => ({
            section_type: s.sectionType,
            position: s.position,
            header: s.header,
            text: s.text,
            media_url: s.mediaUrl,
            caption: s.caption,
            code: s.code,
            language: s.sectionType === "snippet" ? s.language || "text" : s.language,
          })),
        }),
      });

      if (!response.ok) {
        let message = "Failed to create page";
        try {
          const errorData = await response.json();
          if (typeof errorData.detail === "string") {
            message = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            message = errorData.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join("; ");
          } else if (errorData.detail) {
            message = JSON.stringify(errorData.detail);
          }
        } catch (parseErr) {
          // ignore and keep default message
        }
        throw new Error(message);
      }

      router.push(`/wiki/${slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to create page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
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
                <div className="flex items-center justify-between gap-3">
                  <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Space <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreateSpaceModalOpen(true)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    disabled={!currentWorkspace}
                  >
                    + Create space
                  </button>
                </div>
                {currentWorkspace && (
                  <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Workspace: {currentWorkspace.name}
                  </p>
                )}
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
                {showSpaceDropdown && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-300 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    {filteredSpaces.length > 0 ? (
                      filteredSpaces.map((space) => (
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
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                        No spaces found.
                      </div>
                    )}
                    <div className="border-t border-zinc-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateSpaceModalOpen(true);
                          setShowSpaceDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-blue-600 hover:bg-zinc-100 dark:text-blue-400 dark:hover:bg-zinc-700"
                        disabled={!currentWorkspace}
                      >
                        <span>+ Create a new space</span>
                      </button>
                    </div>
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

              {/* Content markup */}
              <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
                <div>
                  <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Content markup
                  </label>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Use <span className="font-mono">:::info</span>, <span className="font-mono">:::warning</span>,{" "}
                    <span className="font-mono">:::error</span>, <span className="font-mono">:::code &lt;lang&gt;</span>, or{" "}
                    <span className="font-mono">:::paragraph</span> blocks ending with <span className="font-mono">:::end</span>.
                  </p>
                </div>
                <textarea
                  placeholder={`:::info: Getting access\nYou will need VPN and SSO to start.\n:::end\n\n:::code shell: Install deps\nbrew install pyenv node\n:::end`}
                  value={sectionMarkup}
                  onChange={(e) => handleMarkupChange(e.target.value)}
                  rows={10}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-800 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                {markupError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{markupError}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addSection("info")}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    <InfoIcon />
                    Add Info
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("warning")}
                    className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600"
                  >
                    <WarningIcon />
                    Add Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("error")}
                    className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                  >
                    <ErrorIcon />
                    Add Error
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("snippet")}
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-700"
                  >
                    <CodeIcon />
                    Add Code
                  </button>
                  <button
                    type="button"
                    onClick={() => addSection("paragraph")}
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-500 dark:hover:bg-zinc-600"
                  >
                    <ParagraphIcon />
                    Add Paragraph
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkupChange(sectionMarkup)}
                    className="ml-auto rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Apply markup
                  </button>
                </div>
                {sections.length > 0 && (
                  <div className="space-y-3">
                    {sections.map((section, idx) => (
                      <SectionEditor
                        key={section.id ?? `section-${section.position}-${idx}`}
                        section={section}
                        index={idx}
                        totalSections={sections.length}
                        onChange={(updated) =>
                          updateSections((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, ...updated } : s))
                          )
                        }
                        onDelete={() => updateSections((prev) => prev.filter((_, i) => i !== idx))}
                        onMoveUp={() =>
                          updateSections((prev) => {
                            if (idx === 0) return prev;
                            const next = [...prev];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            return next;
                          })
                        }
                        onMoveDown={() =>
                          updateSections((prev) => {
                            if (idx === prev.length - 1) return prev;
                            const next = [...prev];
                            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                            return next;
                          })
                        }
                      />
                    ))}
                  </div>
                )}
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
        {currentWorkspace && (
          <CreateSpaceModal
            workspaceId={currentWorkspace.id}
            isOpen={isCreateSpaceModalOpen}
            onClose={() => setIsCreateSpaceModalOpen(false)}
            onSuccess={(space) => handleSpaceCreated(space)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

function SectionRenderer({ section }: { section: PageSection }) {
  const { sectionType, header, text, mediaUrl, caption, code, language } = section;

  if (sectionType === "paragraph") {
    return (
      <section className="prose prose-zinc dark:prose-invert max-w-none">
        {header && <h2>{header}</h2>}
        {text && <p className="whitespace-pre-wrap">{text}</p>}
      </section>
    );
  }

  if (sectionType === "picture") {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4">
        {mediaUrl && (
          <img
            src={mediaUrl}
            alt={caption || header || "Section image"}
            className="w-full rounded-md object-cover"
          />
        )}
        {(caption || header) && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{caption || header}</p>
        )}
      </section>
    );
  }

  if (sectionType === "snippet") {
    return (
      <section className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        {(header || caption) && (
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
            {header || caption}
          </div>
        )}
        <pre className="overflow-auto px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
          <code>{code}</code>
        </pre>
        {language && (
          <div className="border-t border-zinc-200 px-4 py-2 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            {language}
          </div>
        )}
      </section>
    );
  }

  if (sectionType === "info" || sectionType === "warning" || sectionType === "error") {
    const tone = sectionType;
    const toneClasses =
      tone === "warning"
        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-100"
        : tone === "error"
          ? "border-red-300 bg-red-50 text-red-900 dark:border-red-500/60 dark:bg-red-500/10 dark:text-red-100"
          : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-100";
    return (
      <section
        className={`rounded-lg border px-4 py-3 text-sm ${toneClasses}`}
      >
        {header && <div className="font-semibold mb-1">{header}</div>}
        {text && <p className="whitespace-pre-wrap">{text}</p>}
      </section>
    );
  }

  return null;
}

function SectionEditor({
  section,
  index,
  totalSections,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  section: PageSection;
  index: number;
  totalSections: number;
  onChange: (updated: Partial<PageSection>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "info":
        return <InfoIcon />;
      case "warning":
        return <WarningIcon />;
      case "error":
        return <ErrorIcon />;
      case "snippet":
        return <CodeIcon />;
      case "picture":
        return <ImageIcon />;
      case "paragraph":
        return <ParagraphIcon />;
      default:
        return null;
    }
  };

  const getSectionBorderColor = (type: string) => {
    switch (type) {
      case "info":
        return "border-blue-300 dark:border-blue-700";
      case "warning":
        return "border-amber-300 dark:border-amber-700";
      case "error":
        return "border-red-300 dark:border-red-800";
      case "snippet":
        return "border-zinc-300 dark:border-zinc-700";
      case "picture":
        return "border-purple-300 dark:border-purple-700";
      case "paragraph":
        return "border-zinc-300 dark:border-zinc-700";
      default:
        return "border-zinc-200 dark:border-zinc-800";
    }
  };

  return (
    <div
      className={`rounded-lg border-2 p-4 ${getSectionBorderColor(section.sectionType)}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 dark:text-zinc-400">
              {getSectionIcon(section.sectionType)}
            </span>
            <select
              value={section.sectionType}
              onChange={(e) =>
                onChange({
                  sectionType: e.target.value as PageSection["sectionType"],
                })
              }
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="paragraph">Paragraph</option>
              <option value="info">Info Card</option>
              <option value="warning">Warning Card</option>
              <option value="error">Error Card</option>
              <option value="snippet">Code Snippet</option>
              <option value="picture">Picture</option>
            </select>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Position {index + 1} of {totalSections}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            className="rounded px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            title="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
            title="Delete section"
          >
            ✕
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900/50">
          <SectionRenderer section={section} />
        </div>
      ) : (
        <>
          {["paragraph", "info", "warning", "error"].includes(section.sectionType) && (
            <div className="space-y-2">
              <input
                value={section.header || ""}
                onChange={(e) => onChange({ header: e.target.value })}
                placeholder="Header (optional)"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <textarea
                value={section.text || ""}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="Text content"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                rows={4}
              />
            </div>
          )}
          {section.sectionType === "snippet" && (
            <div className="space-y-2">
              <input
                value={section.header || ""}
                onChange={(e) => onChange({ header: e.target.value })}
                placeholder="Title (optional)"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <textarea
                value={section.code || ""}
                onChange={(e) => onChange({ code: e.target.value })}
                placeholder="Code"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
                rows={6}
              />
              <input
                value={section.language || ""}
                onChange={(e) => onChange({ language: e.target.value })}
                placeholder="Language (e.g., javascript, python)"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          )}
          {section.sectionType === "picture" && (
            <div className="space-y-2">
              <input
                value={section.mediaUrl || ""}
                onChange={(e) => onChange({ mediaUrl: e.target.value })}
                placeholder="Image URL"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                value={section.caption || ""}
                onChange={(e) => onChange({ caption: e.target.value })}
                placeholder="Caption"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <input
                value={section.header || ""}
                onChange={(e) => onChange({ header: e.target.value })}
                placeholder="Alt text / header"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const InfoIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
    <path d="M12 16v-4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 8h.01" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const WarningIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" strokeWidth="1.5" />
    <path d="M12 9v4" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 17h.01" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
    <path d="M9.5 9.5 14.5 14.5" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14.5 9.5 9.5 14.5" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CodeIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="m9 18 6-12" strokeWidth="1.5" strokeLinecap="round" />
    <path d="m6 9-3 3 3 3" strokeWidth="1.5" strokeLinecap="round" />
    <path d="m18 9 3 3-3 3" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ImageIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeWidth="1.5" />
    <circle cx="8.5" cy="10.5" r="1.5" />
    <path d="M21 15 16.5 11 10 17" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ParagraphIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M7 7h10" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 12h6" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 17h4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
