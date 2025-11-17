// Client-rendered page that shows a space and its pages by slug.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import WikiHeader from "@/components/WikiHeader";
import WikiSidebar from "@/components/WikiSidebar";
import { PageSection, WikiPage, WikiSpace } from "@/types/wiki";

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
  const slug = params?.slug;

  const [spaces, setSpaces] = useState<WikiSpace[]>([]);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpaceAndPages = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const spaceResp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/spaces/slug/${slug}`);
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
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pages?space_id=${space.id}&limit=100`
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
  }, [slug]);

  const space = useMemo(
    () => spaces.find((s) => s.slug === slug),
    [spaces, slug]
  );

  return (
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
            <div className="max-w-4xl space-y-6">
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
                <p className="text-zinc-600 dark:text-zinc-400">No pages in this space yet.</p>
              )}
            </div>
          )}
          {!loading && !error && !space && (
            <div className="text-zinc-600 dark:text-zinc-400">Space not found.</div>
          )}
        </main>
      </div>
    </div>
  );
}
