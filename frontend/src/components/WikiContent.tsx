"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WikiPage, PageSection } from "@/types/wiki";
import { useAuth } from "@/contexts/AuthContext";
import { parseSectionMarkup, sectionsToMarkup } from "@/lib/sectionMarkup";
import { useEffect, useRef, useState } from "react";

interface WikiContentProps {
  page?: WikiPage;
  isLoading?: boolean;
  onUpdated?: (page: WikiPage) => void;
}

export default function WikiContent({ page, isLoading = false, onUpdated }: WikiContentProps) {
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();
  const [localPage, setLocalPage] = useState<WikiPage | undefined>(page);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(page?.title || "");
  const [draftContent, setDraftContent] = useState(page?.content || "");
  const [draftSections, setDraftSections] = useState<PageSection[]>(page?.sections || []);
  const [sectionMarkup, setSectionMarkup] = useState(
    sectionsToMarkup(page?.sections || [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markupError, setMarkupError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    setLocalPage(page);
    setDraftTitle(page?.title || "");
    setDraftContent(page?.content || "");
    setDraftSections(page?.sections || []);
    setSectionMarkup(sectionsToMarkup(page?.sections || []));
    setIsEditing(false);
    setError(null);
    setMarkupError(null);
  }, [page]);

  useEffect(() => {
    setSectionMarkup(sectionsToMarkup(draftSections));
  }, [draftSections]);

  const canEdit = !!(isAuthenticated && page);
  const canDelete =
    !!(
      isAuthenticated &&
      page &&
      user &&
      (page.creator?.id === user.id || page.createdBy === user.id)
    );
  const displayPage = localPage ?? page;

  const syncSectionsFromMarkup = (): PageSection[] | null => {
    try {
      const parsed = parseSectionMarkup(sectionMarkup || "");
      setMarkupError(null);
      setDraftSections(parsed);
      return parsed;
    } catch (err: any) {
      setMarkupError(err.message || "Unable to parse markup");
      return null;
    }
  };

  const addSection = (sectionType: PageSection["sectionType"]) => {
    const base: PageSection = {
      sectionType,
      position: draftSections.length,
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

    setDraftSections((prev) => [...prev, base].map((s, i) => ({ ...s, position: i })));
    setMarkupError(null);
  };

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
            <textarea
              value={draftContent || ""}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Optional HTML body content"
            />
            <div className="space-y-4">
              <div className="mb-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Structured Sections
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Edit sections using the markup below, just like when creating a page.
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/40">
                <div className="mb-2">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Content markup</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Use <span className="font-mono">:::info</span>, <span className="font-mono">:::warning</span>,{" "}
                    <span className="font-mono">:::error</span>, <span className="font-mono">:::code &lt;lang&gt;</span>, or{" "}
                    <span className="font-mono">:::paragraph</span> blocks ending with <span className="font-mono">:::end</span>.
                  </p>
                </div>
                <textarea
                  value={sectionMarkup}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSectionMarkup(val);
                    try {
                      const parsed = parseSectionMarkup(val);
                      setDraftSections(parsed);
                      setMarkupError(null);
                    } catch (err: any) {
                      setMarkupError(err.message || "Markup is invalid");
                    }
                  }}
                  rows={8}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder=":::paragraph: Vision&#10;Ship delightful features consistently.&#10;:::end&#10;&#10;:::info: Reminder&#10;Keep this document up to date.&#10;:::end"
                />
                {markupError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{markupError}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
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
                    onClick={syncSectionsFromMarkup}
                    className="ml-auto rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Apply markup
                  </button>
                </div>
              </div>
              {draftSections.map((section, idx) => (
                <SectionEditor
                  key={`${section.id ?? "draft"}-${idx}`}
                  section={section}
                  index={idx}
                  totalSections={draftSections.length}
                  onChange={(updated) =>
                    setDraftSections((prev) =>
                      prev.map((s, i) => (i === idx ? { ...s, ...updated } : s))
                    )
                  }
                  onDelete={() =>
                    setDraftSections((prev) => prev.filter((_, i) => i !== idx))
                  }
                  onMoveUp={() => {
                    if (idx === 0) return;
                    setDraftSections((prev) => {
                      const newSections = [...prev];
                      [newSections[idx - 1], newSections[idx]] = [
                        newSections[idx],
                        newSections[idx - 1],
                      ];
                      return newSections.map((s, i) => ({ ...s, position: i }));
                    });
                  }}
                  onMoveDown={() => {
                    if (idx === draftSections.length - 1) return;
                    setDraftSections((prev) => {
                      const newSections = [...prev];
                      [newSections[idx], newSections[idx + 1]] = [
                        newSections[idx + 1],
                        newSections[idx],
                      ];
                      return newSections.map((s, i) => ({ ...s, position: i }));
                    });
                  }}
                />
              ))}
            </div>
          </div>
        ) : displayPage.sections && displayPage.sections.length > 0 ? (
          displayPage.sections
            .sort((a, b) => a.position - b.position)
            .map((section, idx, arr) => (
              <div
                key={`${section.id ?? "section"}-${section.position ?? idx}-${idx}`}
                className="space-y-8"
              >
                <SectionRenderer section={section} />
                {idx < arr.length - 1 && (
                  <hr className="border-zinc-200 dark:border-zinc-800 mb-10" />
                )}
              </div>
            ))
        ) : (
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <div
              className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: displayPage.content }}
            />
          </div>
        )}

        {canEdit && (
          <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800 justify-end">
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
                    const sectionsToPersist = syncSectionsFromMarkup();
                    if (!sectionsToPersist) {
                      throw new Error("Fix markup before saving.");
                    }
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
                          content: draftContent || "",
                          updated_by: user?.id,
                          sections: sectionsToPersist.map((s) => ({
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
                      }
                    );
                    if (!resp.ok) {
                      throw new Error(`Failed to save (${resp.status})`);
                    }
                    const updated = await resp.json();
                    const updatedPage: WikiPage = {
                      ...displayPage,
                      title: updated.title,
                      content: draftContent || "",
                      updatedAt: updated.updated_at ?? new Date().toISOString(),
                      sections: sectionsToPersist,
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
            {canDelete && (
              <button
                onClick={async () => {
                  if (!displayPage || deleting) return;
                  setShowDeleteModal(true);
                }}
                disabled={deleting}
                className="ml-2 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete page"}
              </button>
            )}
            {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
          </div>
        )}

        {showDeleteModal && displayPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl bg-zinc-950 text-zinc-50 shadow-2xl ring-1 ring-zinc-800">
              <div className="flex items-start gap-3 border-b border-zinc-800 px-5 py-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-900/60 text-red-200">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 15a1.25 1.25 0 1 1 1.25-1.25A1.252 1.252 0 0 1 12 17Zm1-4.75a1 1 0 0 1-2 0V7.75a1 1 0 0 1 2 0Z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Delete this page?</h3>
                  <p className="mt-1 text-sm text-zinc-300">
                    This action cannot be undone. “{displayPage.title}” will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4">
                <button
                  onClick={() => {
                    if (deleting) return;
                    setShowDeleteModal(false);
                  }}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!displayPage || deleting) return;
                    setDeleting(true);
                    setError(null);
                    try {
                      const resp = await fetch(
                        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pages/${displayPage.id}`,
                        {
                          method: "DELETE",
                          headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                          },
                        }
                      );
                      if (!resp.ok) {
                        throw new Error(`Failed to delete (${resp.status})`);
                      }
                      router.push("/");
                    } catch (err: any) {
                      setError(err.message || "Failed to delete page");
                    } finally {
                      setDeleting(false);
                      setShowDeleteModal(false);
                    }
                  }}
                  disabled={deleting}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
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
        {header && <h2 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-100 dark:text-zinc-50">{header}</h2>}
        {text && <p className="mt-0 whitespace-pre-wrap">{text}</p>}
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
            <div className="space-y-3">
              <input
                value={section.header || ""}
                onChange={(e) => onChange({ header: e.target.value })}
                placeholder="Header (optional)"
                className="w-full rounded-md border border-transparent px-0 py-1 text-2xl font-semibold leading-tight text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-0 dark:text-zinc-50 dark:focus:border-zinc-400"
              />
              <textarea
                value={section.text || ""}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder="Text content"
                className="w-full rounded-md border border-zinc-300 px-3 py-3 text-base leading-relaxed dark:border-zinc-700 dark:bg-zinc-900"
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

// Icon components
function InfoIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ParagraphIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="18" y2="18" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
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
