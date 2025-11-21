"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WikiHeader from "@/components/WikiHeader";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type Workspace = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
};

type WorkspaceMember = {
  id: number;
  workspace_id?: number;
  user_id?: number;
  role?: string;
  username: string;
  email?: string | null;
  display_name?: string | null;
};

type UserOption = {
  id: number;
  username: string;
  email?: string | null;
  display_name?: string | null;
};

export default function SettingsPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [userSuggestions, setUserSuggestions] = useState<UserOption[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

const selectedWorkspace = useMemo(
  () => (selectedWorkspaceId ? workspaces.find((w) => w.id === selectedWorkspaceId) ?? null : null),
  [selectedWorkspaceId, workspaces]
);

  // Load workspaces
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${apiBase}/workspaces/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error("Failed to load workspaces");
        const data = await resp.json();
        setWorkspaces(data);
        if (data.length === 0) {
          router.push("/workspace/setup");
        } else {
          setSelectedWorkspaceId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Unable to load workspaces");
      } finally {
        setLoading(false);
      }
    };
    loadWorkspaces();
  }, [router, token]);

  // Load users for suggestions
  useEffect(() => {
    const loadUsers = async () => {
      if (!token) return;
      try {
        const resp = await fetch(`${apiBase}/users?limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) return;
        const data = await resp.json();
        setAllUsers(data);
      } catch {
        // ignore suggestion errors
      }
    };
    loadUsers();
  }, [token]);

  const fetchMembers = useCallback(
    async (workspaceId: number) => {
      if (!token) return;
      setMembersLoading(true);
      setInviteError(null);
      try {
        const resp = await fetch(`${apiBase}/workspaces/${workspaceId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error("Failed to load members");
        const data = await resp.json();
        setMembers(data);
      } catch (err: any) {
        setInviteError(err.message || "Unable to load members");
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    },
    [token]
  );

  // Load members when workspace changes
  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchMembers(selectedWorkspaceId);
    }
  }, [fetchMembers, selectedWorkspaceId]);

  // Filter suggestions as the user types
  useEffect(() => {
    const query = inviteEmail.trim().toLowerCase();
    if (!query) {
      setUserSuggestions([]);
      return;
    }
    const suggestions = allUsers
      .filter((u) => {
        const alreadyMember = members.some((m) => m.user_id === u.id);
        if (alreadyMember) return false;
        const emailMatch = u.email?.toLowerCase().includes(query);
        const nameMatch = u.display_name?.toLowerCase().includes(query);
        const usernameMatch = u.username?.toLowerCase().includes(query);
        return emailMatch || nameMatch || usernameMatch;
      })
      .slice(0, 8);
    setUserSuggestions(suggestions);
  }, [inviteEmail, allUsers, members]);

  const selectUserSuggestion = (user: UserOption) => {
    setInviteEmail(user.email || "");
    setShowUserSuggestions(false);
  };

const handleInvite = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedWorkspaceId || !token) return;
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const resp = await fetch(`${apiBase}/workspaces/${selectedWorkspaceId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.detail || "Failed to send invite");
      }
      const detail =
        typeof data?.detail === "string" && data.detail.length > 0
          ? data.detail
          : "Invite sent successfully";
      setInviteSuccess(detail);
      setInviteEmail("");
      // Only refresh members if a new member was created (201)
      if (resp.status === 201) {
        await fetchMembers(selectedWorkspaceId);
      }
    } catch (err: any) {
      setInviteError(err.message || "Unable to send invite");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <WikiHeader />
        {selectedWorkspace && (
          <div className="border-b border-zinc-200 bg-white/90 px-6 py-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Workspace
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {selectedWorkspace.name}
                </p>
              </div>
              <select
                value={selectedWorkspaceId ?? ""}
                onChange={(e) => setSelectedWorkspaceId(Number(e.target.value))}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Settings</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Manage workspaces and collaborators.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {!loading && workspaces.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Manage workspace
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Switch workspaces, view members, and invite collaborators.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Members
                    </h3>
                    {membersLoading && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Refreshing...</span>
                    )}
                  </div>
                  <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {members.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">
                        No members yet.
                      </div>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-50">
                              {member.display_name || member.username}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                              {member.email || "No email"}
                            </div>
                          </div>
                          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {member.role}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {inviteError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                      {inviteError}
                    </div>
                  )}
                  {inviteSuccess && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {inviteSuccess}
                    </div>
                  )}
                </div>

                <form className="space-y-4" onSubmit={handleInvite}>
                  <div>
                    <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-100">
                      Invite collaborator
                    </label>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Send an invite by email with a role for this workspace.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={inviteEmail}
                          onChange={(e) => {
                            setInviteEmail(e.target.value);
                            setShowUserSuggestions(true);
                          }}
                          onFocus={() => setShowUserSuggestions(true)}
                          onBlur={() => {
                            // Delay closing to allow click
                            setTimeout(() => setShowUserSuggestions(false), 150);
                          }}
                          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          placeholder="Search by email or name"
                        />
                        {showUserSuggestions && userSuggestions.length > 0 && (
                          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                            {userSuggestions.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => selectUserSuggestion(u)}
                                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                                  {(u.display_name || u.username || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                    {u.display_name || u.username}
                                  </div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {u.email || "No email"}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) =>
                          setInviteRole(e.target.value as "admin" | "member" | "viewer")
                        }
                        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={inviteLoading || !selectedWorkspace}
                    className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {inviteLoading ? "Sending invite..." : "Send invite"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
