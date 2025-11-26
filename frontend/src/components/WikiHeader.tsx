"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Workspace = {
  id: number;
  name: string;
  slug?: string;
};

// const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

interface WikiHeaderProps {
  onSearch?: (query: string) => void;
}

export default function WikiHeader({ onSearch }: WikiHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, loading } = useAuth();
  const avatarName = user?.display_name || user?.username || user?.email || "User";
  const avatarInitial = avatarName.charAt(0).toUpperCase();
  const avatarImage = user?.picture || null;
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handleGoogleLogin = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

    console.log("apiBase computed:", apiBase);

    if (!apiBase) {
      console.error("NEXT_PUBLIC_API_BASE_URL is not configured; cannot start OAuth flow.");
      return;
    }

    try {
      const response = await fetch(`${apiBase}/auth/google/login`);
      if (!response.ok) {
        throw new Error("Failed to get Google login URL");
      }
      const data = await response.json();
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) return;
      if (workspaceMenuRef.current && workspaceMenuRef.current.contains(event.target as Node))
        return;
      if (mobileMenuRef.current && mobileMenuRef.current.contains(event.target as Node)) return;
      setMobileMenuOpen(false);
      setIsMenuOpen(false);
      setWorkspaceMenuOpen(false);
    };

    if (isMenuOpen || workspaceMenuOpen || mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, workspaceMenuOpen, mobileMenuOpen]);

  // Fetch workspaces for dropdown when authenticated
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
    const fetchWorkspaces = async () => {
      try {
        const resp = await fetch(`${apiBase}/workspaces/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        setWorkspaces(data);
        if (data.length > 0) {
          setSelectedWorkspaceId((prev) => prev ?? data[0].id);
        }
      } catch {
        // ignore dropdown errors
      }
    };

    if (isAuthenticated) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setSelectedWorkspaceId(null);
    }
  }, [isAuthenticated]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-start gap-2">
            <div className="flex flex-col">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
                  <span className="text-lg font-bold">W</span>
                </div>
                <span className="text-xl font-bold">WikiTack</span>
              </Link>
              {isAuthenticated && workspaces.length > 0 && (
                <div className="relative mt-0.5 ml-auto" ref={workspaceMenuRef}>
                  <button
                    type="button"
                    onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
                    className="flex items-center justify-end gap-1 rounded-md border border-transparent px-1 py-0.5 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    <span className="truncate max-w-[160px] text-right">
                      {workspaces.find((w) => w.id === selectedWorkspaceId)?.name || "Select workspace"}
                    </span>
                    <span className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400">▾</span>
                  </button>
                  {workspaceMenuOpen && (
                    <div className="absolute right-0 mt-1 w-52 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            setSelectedWorkspaceId(ws.id);
                            localStorage.setItem("selected_workspace_id", String(ws.id));
                            router.push(`/dashboard?workspace_id=${ws.id}`);
                            setWorkspaceMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                            ws.id === selectedWorkspaceId
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                              : "text-zinc-700 dark:text-zinc-200"
                          }`}
                        >
                          <span className="truncate">{ws.name}</span>
                          {ws.id === selectedWorkspaceId && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">•</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {pathname !== "/" && <div className="flex-1" />}

        <nav className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/page/new"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Create Page
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-zinc-300 px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                    {avatarImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarImage} alt={avatarName} className="h-full w-full object-cover" />
                    ) : (
                      avatarInitial
                    )}
                  </span>
                  <span>{avatarName}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">▾</span>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <Link
                      href="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                        router.push("/");
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="hidden md:inline-block text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              >
                Pricing
              </Link>
              <button
                onClick={handleGoogleLogin}
                className="hidden md:inline-block text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              >
                Login
              </button>
              <button
                onClick={handleGoogleLogin}
                className="hidden md:inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sign Up
              </button>
            </>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-lg text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <span className="sr-only">Open menu</span>
            ☰
          </button>
          {mobileMenuOpen && (
            <div
              ref={mobileMenuRef}
              className="absolute left-0 right-0 top-16 z-50 border-b border-zinc-200 bg-white/95 px-4 py-3 shadow-md dark:border-zinc-800 dark:bg-zinc-900/95"
            >
              <div className="flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/page/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Create Page
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                        router.push("/");
                      }}
                      className="text-left text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/pricing");
                      }}
                      className="text-left text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Pricing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/login");
                      }}
                      className="text-left text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/login");
                      }}
                      className="text-left text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
