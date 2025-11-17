"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface WikiHeaderProps {
  onSearch?: (query: string) => void;
}

export default function WikiHeader({ onSearch }: WikiHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, user, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

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
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
              <span className="text-lg font-bold">W</span>
            </div>
            <span className="text-xl font-bold">WikiTack</span>
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
          <input
            type="search"
            placeholder="Search wiki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
        </form>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/page/new"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Create Page
              </Link>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {user?.display_name || user?.email || user?.username}
              </span>
              <button
                onClick={logout}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Login
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
