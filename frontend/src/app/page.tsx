// This page uses client-side hooks to fetch and render the wiki feed.
"use client";

import { useEffect, useState, useMemo } from "react";
import WikiHeader from "@/components/WikiHeader";
import WikiSidebar from "@/components/WikiSidebar";
import WikiContent from "@/components/WikiContent";
import { WikiPage, PageSection, WikiSpace } from "@/types/wiki";

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

export default function Home() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [spaces, setSpaces] = useState<WikiSpace[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pagesResp, spacesResp] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pages?limit=50`),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/spaces?limit=100`),
        ]);

        if (!pagesResp.ok) {
          throw new Error(`Failed to load pages (${pagesResp.status})`);
        }
        if (!spacesResp.ok) {
          throw new Error(`Failed to load spaces (${spacesResp.status})`);
        }

        const [pagesData, spacesData]: [ApiPage[], any[]] = await Promise.all([
          pagesResp.json(),
          spacesResp.json(),
        ]);

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

        const normalized: WikiPage[] = pagesData.map((p) => ({
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
      } catch (err: any) {
        setError(err.message || "Failed to load pages");
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedPageId),
    [pages, selectedPageId]
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
        <main className="flex-1 overflow-auto">
          {error ? (
            <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
          ) : (
            <WikiContent page={selectedPage} isLoading={loading} />
          )}
        </main>
      </div>
    </div>
  );
}
