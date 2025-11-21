// Client-rendered page that shows a space and its pages by slug.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import WikiHeader from "@/components/WikiHeader";
import WikiSidebar from "@/components/WikiSidebar";
import { PageSection, WikiPage, WikiSpace } from "@/types/wiki";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

type Workspace = {
  id: number;
  name: string;
  slug: string;
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

export default function SpaceSlugPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const slug = params?.slug;

  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [spaces, setSpaces] = useState<WikiSpace[]>([]);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current workspace
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/workspaces/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setCurrentWorkspace(data[0]);
          } else {
            router.push("/workspace/setup");
          }
        }
      } catch (err) {
        console.error("Failed to fetch workspace:", err);
      }
    };

    fetchWorkspace();
  }, [token, router]);

  useEffect(() => {
    const fetchSpaceAndPages = async () => {
      if (!slug || !currentWorkspace || !token) return;

      setLoading(true);
      setError(null);
      try {
        const spaceResp = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/spaces/slug/${slug}?workspace_id=${currentWorkspace.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!spaceResp.ok) {
          throw new Error(`Space not found (${spaceResp.status})`);
        }

        const spaceData = await spaceResp.json();
        const space: WikiSpace = {
          id: spaceData.id,
          name: spaceData.name,
          slug: spaceData.slug,
          description: spaceData.description ?? undefined,
          pageCount: undefined,
        };

        const pagesResp = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pages?space_id=${space.id}&limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!pagesResp.ok) {
          throw new Error(`Failed to load pages (${pagesResp.status})`);
        }

        const pagesData: ApiPage[] = await pagesResp.json();
        const normalizedPages: WikiPage[] = pagesData.map((p) => ({
          id: p.id,
          spaceId: p.space_id,
          spaceName: space.name,
          spaceSlug: space.slug,
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

        setSpaces([space]);
        setPages(normalizedPages);
      } catch (err: any) {
        setError(err.message || "Failed to load space");
      } finally {
        setLoading(false);
      }
    };

    fetchSpaceAndPages();
  }, [slug, currentWorkspace, token]);

  const space = useMemo(
    () => spaces.find((s) => s.slug === slug),
    [spaces, slug]
  );

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
          <main className="flex-1 overflow-auto p-6">
            {loading && (
              <div className="text-zinc-500 dark:text-zinc-400">Loading space...</div>
            )}
            {error && (
              <div className="text-red-600 dark:text-red-400">{error}</div>
            )}
            {!loading && !error && space && (
              <div className="w-full max-w-5xl mx-auto space-y-6">
                <header className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {space.name}
                  </h1>
                  {space.description && (
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">{space.description}</p>
                  )}
                </header>

                {pages.length > 0 ? (
                  <ul className="space-y-3">
                    {pages.map((page) => (
                      <li key={page.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <Link
                              href={`/wiki/${page.slug}`}
                              className="text-lg font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                            >
                              {page.title}
                            </Link>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Last updated {new Date(page.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Link
                            href={`/wiki/${page.slug}`}
                            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                          >
                            View
                          </Link>
                        </div>
                        {page.sections && page.sections.length > 0 && (
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                            {page.sections[0].text || page.sections[0].header || page.content}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-4 text-6xl">📄</div>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-4">No pages in this space yet.</p>
                    <Link
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
                      Create Page
                    </Link>
                  </div>
                )}
              </div>
            )}
            {!loading && !error && !space && (
              <div className="text-zinc-600 dark:text-zinc-400">Space not found.</div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
