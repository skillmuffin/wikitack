"use client";

import Link from "next/link";
import { WikiSpace } from "@/types/wiki";

interface WikiSidebarProps {
  spaces?: WikiSpace[];
  recentPages?: Array<{ id: string; title: string; slug: string }>;
}

export default function WikiSidebar({ spaces = [], recentPages = [] }: WikiSidebarProps) {
  // Deduplicate spaces defensively (by id, then slug, then name) to avoid repeated entries
  const uniqueSpaces = spaces.reduce<WikiSpace[]>((acc, space) => {
    const normalizedSlug = space.slug?.toLowerCase().trim();
    const normalizedName = space.name?.toLowerCase().trim();
    const key = space.id ?? normalizedSlug ?? normalizedName;
    if (key === undefined) return acc;

    const exists = acc.some(
      (s) =>
        (space.id && s.id === space.id) ||
        (normalizedSlug && s.slug?.toLowerCase().trim() === normalizedSlug) ||
        (normalizedName && s.name?.toLowerCase().trim() === normalizedName)
    );

    if (!exists) acc.push(space);
    return acc;
  }, []);

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50 min-h-screen p-4">
      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Spaces
          </h2>
          {uniqueSpaces.length > 0 ? (
            <ul className="space-y-1">
              {uniqueSpaces.map((space) => (
                <li key={space.id ?? space.slug}>
                  <Link
                    href={`/space/${space.slug}`}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  >
                    <span>{space.name}</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      {space.pageCount ?? "-"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-600">
              No spaces yet
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Pages
          </h2>
          {recentPages.length > 0 ? (
            <ul className="space-y-1">
              {recentPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/wiki/${page.slug}`}
                    className="block rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-600">
              No recent pages
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
