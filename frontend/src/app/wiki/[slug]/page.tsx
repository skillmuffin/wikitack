// Client-rendered page that fetches a wiki page by slug and displays its sections.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import WikiHeader from "@/components/WikiHeader";
import WikiSidebar from "@/components/WikiSidebar";
import WikiContent from "@/components/WikiContent";
import { PageSection, WikiPage, WikiSpace } from "@/types/wiki";

type ApiUser = {
  id: number;
  username: string;
  email?: string | null;
  display_name?: string | null;
};

type ApiPage = {
  id: number;
  space_id: number;
  title: string;
  content: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number | null;
  creator?: ApiUser;
  updater?: ApiUser | null;
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

export default function WikiSlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [spaces, setSpaces] = useState<WikiSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pagesResp, spacesResp] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pages?limit=100`),
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
          createdBy: p.created_by,
          updatedBy: p.updated_by,
          creator: p.creator ? {
            id: p.creator.id,
            username: p.creator.username,
            email: p.creator.email,
            displayName: p.creator.display_name,
          } : undefined,
          updater: p.updater ? {
            id: p.updater.id,
            username: p.updater.username,
            email: p.updater.email,
            displayName: p.updater.display_name,
          } : undefined,
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
      } catch (err: any) {
        setError(err.message || "Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const selectedPage = useMemo(
    () => pages.find((p) => p.slug === slug),
    [pages, slug]
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
