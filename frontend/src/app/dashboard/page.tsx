// Personalized dashboard showing user's workspaces, spaces and pages
"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WikiHeader from "@/components/WikiHeader";
import WikiSidebar from "@/components/WikiSidebar";
import WikiContent from "@/components/WikiContent";
import CreateSpaceModal from "@/components/CreateSpaceModal";
import { WikiPage, PageSection, WikiSpace } from "@/types/wiki";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type Workspace = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  owner_id: number;
  member_count: number;
  space_count: number;
  created_at: string;
  updated_at: string;
};

type ApiPage = {
  id: number;
  space_id: number;
  title: string;
  content: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
  tags?: Array<{ id: number; name: string; slug: string }>;
  sections?: Array<{
    id: number;
    page_id: number;
    position: number;
    section_type: string;
    header?: string | null;
    text?: string | null;
    media_url?: string | null;
    caption?: string | null;
    code?: string | null;
    language?: string | null;
  }>;
};

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [spaces, setSpaces] = useState<WikiSpace[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateSpaceModalOpen, setIsCreateSpaceModalOpen] = useState(false);

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${apiBase}/workspaces/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data);

          if (data.length === 0) {
            router.push("/workspace/setup");
            return;
          }

          const queryWorkspaceId = searchParams?.get("workspace_id");
          const storedWorkspaceId = localStorage.getItem("selected_workspace_id");
          const preferredId = queryWorkspaceId || storedWorkspaceId;
          const preferred = preferredId
            ? data.find((w: Workspace) => w.id === Number(preferredId))
            : null;

          setCurrentWorkspace(preferred || data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch workspaces:", err);
      }
    };

    fetchWorkspaces();
  }, [token, router, searchParams]);

  // Fetch spaces and pages for current workspace
  useEffect(() => {
    if (!currentWorkspace || !token) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // First fetch spaces
        const spacesResp = await fetch(
          `${apiBase}/spaces/?workspace_id=${currentWorkspace.id}&limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!spacesResp.ok) {
          const message =
            spacesResp.status === 403
              ? "You do not have access to these spaces. Switch workspace or ensure you are a member."
              : `Failed to load spaces (${spacesResp.status})`;
          throw new Error(message);
        }

        const spacesData = await spacesResp.json();
        const spacesIndexed: Record<number, WikiSpace> = {};
        const spaceIds: number[] = [];

        spacesData.forEach((s: any) => {
          spacesIndexed[s.id] = {
            id: s.id,
            name: s.name,
            slug: s.slug,
            description: s.description ?? undefined,
            pageCount: undefined,
          };
          spaceIds.push(s.id);
        });
        setSpaces(Object.values(spacesIndexed));

        // Only fetch pages if we have spaces
        if (spaceIds.length > 0) {
          // Fetch pages for each space
          const pagePromises = spaceIds.map(spaceId =>
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pages?space_id=${spaceId}&limit=50`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(res => res.ok ? res.json() : [])
          );

          const pagesArrays = await Promise.all(pagePromises);
          const allPagesData: ApiPage[] = pagesArrays.flat();

          const normalized: WikiPage[] = allPagesData.map((p) => ({
            id: p.id,
            spaceId: p.space_id,
            spaceName: spacesIndexed[p.space_id]?.name,
            spaceSlug: spacesIndexed[p.space_id]?.slug,
            title: p.title,
            content: p.content ?? "",
            slug: p.slug,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            tags: p.tags?.map((t) => t.name) ?? [],
            sections:
              p.sections?.map<PageSection>((s) => ({
                id: s.id,
                pageId: s.page_id,
                position: s.position,
                sectionType: s.section_type as PageSection["sectionType"],
                header: s.header,
                text: s.text,
                mediaUrl: s.media_url,
                caption: s.caption,
                code: s.code,
                language: s.language,
              })) ?? [],
          }));
          setPages(normalized);
          if (normalized.length > 0) {
            setSelectedPageId(normalized[0].id);
          }
        } else {
          setPages([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentWorkspace, token]);

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedPageId),
    [pages, selectedPageId]
  );

  const handleSpaceCreated = (_createdSpace?: any) => {
    // Refresh spaces
    if (!currentWorkspace || !token) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/spaces/?workspace_id=${currentWorkspace.id}&limit=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((spacesData) => {
        const spacesIndexed: Record<number, WikiSpace> = {};
        spacesData.forEach((s: any) => {
          spacesIndexed[s.id] = {
            id: s.id,
            name: s.name,
            slug: s.slug,
            description: s.description ?? undefined,
            pageCount: undefined,
          };
        });
        setSpaces(Object.values(spacesIndexed));
      });
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <WikiHeader />

        <div className="flex flex-1">
          <WikiSidebar
            spaces={spaces}
            recentPages={pages.map((p) => ({
              id: String(p.id),
              title: p.title,
              slug: p.slug,
            }))}
          />
          <main className="flex-1 overflow-auto">
            {error ? (
              <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
            ) : loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
                </div>
              </div>
            ) : spaces.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="max-w-md text-center">
                  <div className="mb-4 text-6xl">📁</div>
                  <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
                    No Spaces Yet
                  </h2>
                  <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                    Get started by creating your first space to organize your wiki pages.
                  </p>
                  <button
                    onClick={() => setIsCreateSpaceModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Your First Space
                  </button>
                </div>
              </div>
            ) : pages.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="max-w-md text-center">
                  <div className="mb-4 text-6xl">📄</div>
                  <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
                    No Pages Yet
                  </h2>
                  <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                    You have spaces but no pages. Create your first wiki page to get started!
                  </p>
                  <a
                    href="/page/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Your First Page
                  </a>
                </div>
              </div>
            ) : (
              <WikiContent page={selectedPage} isLoading={loading} />
            )}
          </main>
        </div>
      </div>

      {/* Create Space Modal */}
      {currentWorkspace && (
        <CreateSpaceModal
          workspaceId={currentWorkspace.id}
          isOpen={isCreateSpaceModalOpen}
          onClose={() => setIsCreateSpaceModalOpen(false)}
          onSuccess={handleSpaceCreated}
        />
      )}
    </ProtectedRoute>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading dashboard...
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
