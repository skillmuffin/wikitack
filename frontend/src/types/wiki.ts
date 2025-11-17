export interface User {
  id: number;
  username: string;
  email?: string | null;
  displayName?: string | null;
}

export interface WikiPage {
  id: number;
  spaceId: number;
  spaceName?: string;
  spaceSlug?: string;
  title: string;
  content: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number | null;
  creator?: User;
  updater?: User | null;
  tags?: string[];
  sections?: PageSection[];
}

export interface WikiSpace {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  pageCount?: number;
}

export interface WikiSearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  relevance: number;
}

export type SectionType = "paragraph" | "picture" | "snippet" | "info" | "warning";

export interface PageSection {
  id: number;
  pageId: number;
  position: number;
  sectionType: SectionType;
  header?: string | null;
  text?: string | null;
  mediaUrl?: string | null;
  caption?: string | null;
  code?: string | null;
  language?: string | null;
}
