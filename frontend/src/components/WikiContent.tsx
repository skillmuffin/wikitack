"use client";

import Link from "next/link";
import { WikiPage, PageSection } from "@/types/wiki";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";

interface WikiContentProps {
  page?: WikiPage;
  isLoading?: boolean;
  onUpdated?: (page: WikiPage) => void;
}

export default function WikiContent({ page, isLoading = false, onUpdated }: WikiContentProps) {
  const { isAuthenticated, user, token } = useAuth();
  const [localPage, setLocalPage] = useState<WikiPage | undefined>(page);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(page?.title || "");
  const [draftContent, setDraftContent] = useState(page?.content || "");
  const [draftSections, setDraftSections] = useState<PageSection[]>(page?.sections || []);
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalPage(page);
    setDraftTitle(page?.title || "");
    setDraftContent(page?.content || "");
    setDraftSections(page?.sections || []);
    setIsEditing(false);
    setError(null);
  }, [page]);

  const canEdit = !!(isAuthenticated && page);
  const displayPage = localPage ?? page;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!displayPage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Welcome to WikiTack
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md">
          Your personal wiki for organizing knowledge. Use the search above to find pages
          or browse categories in the sidebar.
        </p>
        {!isAuthenticated && <LoginCta />}
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto p-6">
      <header className="mb-8 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="mb-2 text-sm text-zinc-500 dark:text-zinc-400 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {displayPage.spaceSlug ? (
              <Link
                href={`/space/${displayPage.spaceSlug}`}
                className="hover:underline text-zinc-600 dark:text-zinc-300"
              >
                {displayPage.spaceName || displayPage.spaceSlug}
              </Link>
            ) : (
              <span>{displayPage.spaceName || `Space ${displayPage.spaceId}`}</span>
            )}
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-700 dark:text-zinc-200">{displayPage.title}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            {displayPage.creator && (
              <span>
                Author: {displayPage.creator.displayName || displayPage.creator.username}
              </span>
            )}
            {displayPage.updater && (
              <span>
                Last modified by: {displayPage.updater.displayName || displayPage.updater.username} on {new Date(displayPage.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          {displayPage.title}
        </h1>
        {displayPage.tags && displayPage.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {displayPage.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-6">
        {isEditing ? (
          <div className="space-y-3">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-lg font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <div className="rounded-md border border-zinc-300 dark:border-zinc-700">
              <div className="flex gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                <button
                  type="button"
                  className="rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => document.execCommand("bold")}
                >
                  Bold
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => document.execCommand("italic")}
                >
                  Italic
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => document.execCommand("insertUnorderedList")}
                >
                  Bullet
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[200px] whitespace-pre-wrap px-3 py-3 text-zinc-800 focus:outline-none dark:bg-zinc-900 dark:text-zinc-100"
                dangerouslySetInnerHTML={{ __html: draftContent }}
                onInput={(e) => setDraftContent((e.target as HTMLDivElement).innerHTML)}
              />
            </div>
            <div className="space-y-4">
              {draftSections.map((section, idx) => (
                <SectionEditor
                  key={section.id ?? idx}
                  section={section}
                  onChange={(updated) =>
                    setDraftSections((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, ...updated } : s))
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : displayPage.sections && displayPage.sections.length > 0 ? (
          displayPage.sections
            .sort((a, b) => a.position - b.position)
            .map((section) => <SectionRenderer key={section.id} section={section} />)
        ) : (
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <div
              className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: displayPage.content }}
            />
          </div>
        )}

        {canEdit && (
          <div className="flex items-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {isEditing ? "Cancel edit" : "Edit page"}
            </button>
            {isEditing && (
              <button
                onClick={async () => {
                  if (!displayPage) return;
                  setSaving(true);
                  setError(null);
                  try {
                    const content = editorRef.current?.innerHTML || "";
                    const resp = await fetch(
                      `${process.env.NEXT_PUBLIC_API_BASE_URL}/pages/${displayPage.id}`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                          title: draftTitle,
                          content,
                          updated_by: user?.id,
                          sections: draftSections.map((s) => ({
                            section_type: s.sectionType,
                            position: s.position,
                            header: s.header,
                            text: s.text,
                            media_url: s.mediaUrl,
                            caption: s.caption,
                            code: s.code,
                            language: s.language,
                          })),
                        }),
                      }
                    );
                    if (!resp.ok) {
                      throw new Error(`Failed to save (${resp.status})`);
                    }
                    const updated = await resp.json();
                    const updatedPage: WikiPage = {
                      ...displayPage,
                      title: updated.title,
                      content: updated.content ?? "",
                      updatedAt: updated.updated_at ?? new Date().toISOString(),
                      sections: draftSections,
                    };
                    setLocalPage(updatedPage);
                    setIsEditing(false);
                    setDraftContent(updatedPage.content);
                    onUpdated?.(updatedPage);
                  } catch (err: any) {
                    setError(err.message || "Failed to save");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            )}
            {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
          </div>
        )}
      </div>
    </article>
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

  if (sectionType === "info" || sectionType === "warning") {
    const isWarning = sectionType === "warning";
    return (
      <section
        className={`rounded-lg border px-4 py-3 text-sm ${
          isWarning
            ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-100"
            : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-100"
        }`}
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
  onChange,
}: {
  section: PageSection;
  onChange: (updated: Partial<PageSection>) => void;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="uppercase tracking-wide">{section.sectionType}</span>
          <span>•</span>
          <span>Position {section.position}</span>
        </div>
      </div>
      {["paragraph", "info", "warning"].includes(section.sectionType) && (
        <div className="space-y-2">
          <input
            value={section.header || ""}
            onChange={(e) => onChange({ header: e.target.value })}
            placeholder="Header"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <textarea
            value={section.text || ""}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Text"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            rows={3}
          />
        </div>
      )}
      {section.sectionType === "snippet" && (
        <div className="space-y-2">
          <input
            value={section.header || ""}
            onChange={(e) => onChange({ header: e.target.value })}
            placeholder="Title"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <textarea
            value={section.code || ""}
            onChange={(e) => onChange({ code: e.target.value })}
            placeholder="Code"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            rows={4}
          />
          <input
            value={section.language || ""}
            onChange={(e) => onChange({ language: e.target.value })}
            placeholder="Language"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={section.caption || ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Caption"
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
    </div>
  );
}

function LoginCta() {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google/login`);
      if (!response.ok) {
        throw new Error("Failed to get Google login URL");
      }
      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="mt-6 inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      Login with Google
    </button>
  );
}
