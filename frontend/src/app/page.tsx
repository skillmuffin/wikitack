"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import WikiHeader from "@/components/WikiHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
      router.push("/dashboard");
      return;
    }
    setIsVisible(true);
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <WikiHeader />

      {/* Hero Section */}
      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-4 top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse"></div>
          <div className="absolute -right-4 bottom-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Main Heading with Animation */}
          <h1
            className={`mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-transparent dark:from-white dark:via-zinc-300 dark:to-white">
              Your Knowledge,
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent animate-gradient-x">
              Beautifully Organized
            </span>
          </h1>

          {/* Subtitle with Animation */}
          <p
            className={`mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl transition-all duration-1000 delay-300 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            WikiTack is a modern collaborative wiki platform with structured content sections,
            powerful search, and seamless team collaboration. Create, organize, and share
            knowledge effortlessly.
          </p>

          {/* CTA Buttons with Animation */}
          <div
            className={`flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-1000 delay-500 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-purple-600 to-cyan-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
              <span className="relative flex items-center gap-2">
                Get Started
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border-2 border-zinc-300 bg-white px-8 py-3 font-semibold text-zinc-900 shadow-sm transition-all duration-300 hover:scale-105 hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:border-zinc-600"
            >
              View Pricing
            </Link>
          </div>

          {/* Features Grid with Animation */}
          <div
            className={`mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-1000 delay-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            {/* Feature 1 */}
            <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-blue-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transition-transform duration-300 group-hover:rotate-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Rich Content Editor
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Create structured content with custom markup, code snippets, images, and callouts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-purple-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-purple-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transition-transform duration-300 group-hover:rotate-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Team Collaboration
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Work together with your team in shared workspaces with role-based permissions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-cyan-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-cyan-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg transition-transform duration-300 group-hover:rotate-6">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">
                Version History
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Track all changes with automatic versioning. Never lose your work again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              © 2025 WikiTack. Built with FastAPI, Next.js, and PostgreSQL.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles for Gradient Animation */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
