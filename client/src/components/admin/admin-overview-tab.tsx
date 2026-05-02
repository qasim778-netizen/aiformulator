import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Download, Heart, Wand2, ArrowUpRight, Globe, Activity,
  ChevronLeft, ChevronRight, Eye, Mail, Lock, TrendingUp,
} from "lucide-react";
import { format, isToday as dateFnsIsToday, isYesterday, subDays, isAfter } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const TABLE_PAGE_SIZE = 7;

const COUNTRY_COLORS = [
  "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];

function isToday(d: string | null | undefined) {
  if (!d) return false;
  return dateFnsIsToday(new Date(d));
}

function isYesterdayDate(d: string | null | undefined) {
  if (!d) return false;
  return isYesterday(new Date(d));
}

function isLast7Days(d: string | null | undefined) {
  if (!d) return false;
  return isAfter(new Date(d), subDays(new Date(), 7));
}

function userInitials(u: any): string {
  const f = u.firstName || "";
  const l = u.lastName || "";
  return (f.charAt(0) + l.charAt(0)).toUpperCase() || (u.email || "?").charAt(0).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

type DateFilter = "today" | "yesterday" | "7days" | "all";

export default function AdminOverviewTab() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [countryFilter, setCountryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const enabled = !!user?.isAdmin;

  const { data: users = [], isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled,
    staleTime: 30_000,
  });
  const { data: downloads = [], isLoading: loadingDownloads } = useQuery<any[]>({
    queryKey: ["/api/admin/downloads"],
    enabled,
    staleTime: 30_000,
  });
  const { data: favorites = [], isLoading: loadingFavorites } = useQuery<any[]>({
    queryKey: ["/api/admin/favorites"],
    enabled,
    staleTime: 30_000,
  });
  const { data: generated = [], isLoading: loadingGenerated } = useQuery<any[]>({
    queryKey: ["/api/admin/user-formulations"],
    enabled,
    staleTime: 30_000,
  });

  const loading = loadingUsers || loadingDownloads || loadingFavorites || loadingGenerated;

  /* ── KPI Calculations ─────────────────────────────────────────────────── */
  const newUsersToday = useMemo(() => users.filter(u => isToday(u.createdAt)), [users]);
  const generatedToday = useMemo(() => generated.filter(g => isToday(g.created_at || g.createdAt)), [generated]);
  const downloadsToday = useMemo(() => downloads.filter(d => isToday(d.downloadedAt)), [downloads]);

  // Returning users today: had any download or generated activity today, but joined before today
  const returningUsersToday = useMemo(() => {
    const activeUserIds = new Set<string>();
    downloadsToday.forEach((d: any) => { if (d.userId) activeUserIds.add(d.userId); });
    generatedToday.forEach((g: any) => { if (g.userId || g.user_id) activeUserIds.add(g.userId || g.user_id); });
    return [...activeUserIds].filter(id => {
      const u = users.find((u: any) => u.id === id);
      return u && !isToday(u.createdAt);
    }).length;
  }, [downloadsToday, generatedToday, users]);

  // Active now: any activity in the last 60 minutes
  const activeNow = useMemo(() => {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const ids = new Set<string>();
    downloads.forEach((d: any) => { if (d.downloadedAt && new Date(d.downloadedAt) > since && d.userId) ids.add(d.userId); });
    generated.forEach((g: any) => {
      const t = g.created_at || g.createdAt;
      if (t && new Date(t) > since && (g.userId || g.user_id)) ids.add(g.userId || g.user_id);
    });
    favorites.forEach((f: any) => { if (f.addedAt && new Date(f.addedAt) > since && f.userId) ids.add(f.userId); });
    return ids.size;
  }, [downloads, generated, favorites]);

  /* ── Per-user download / generated counts ─────────────────────────────── */
  const userDownloadCount = useMemo(() => {
    const m = new Map<string, number>();
    downloads.forEach((d: any) => {
      if (d.userId) m.set(d.userId, (m.get(d.userId) ?? 0) + 1);
      else if (d.userEmail) m.set(d.userEmail, (m.get(d.userEmail) ?? 0) + 1);
    });
    return m;
  }, [downloads]);

  const userGeneratedCount = useMemo(() => {
    const m = new Map<string, number>();
    generated.forEach((g: any) => {
      const key = g.userId || g.user_id || g.email;
      if (key) m.set(key, (m.get(key) ?? 0) + 1);
    });
    return m;
  }, [generated]);

  /* ── Table Filtering ──────────────────────────────────────────────────── */
  const countries = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u: any) => { if (u.country) set.add(u.country); });
    return ["all", ...Array.from(set).sort()];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const matchDate =
        dateFilter === "today" ? isToday(u.createdAt) :
        dateFilter === "yesterday" ? isYesterdayDate(u.createdAt) :
        dateFilter === "7days" ? isLast7Days(u.createdAt) :
        true;
      const matchCountry = countryFilter === "all" || u.country === countryFilter;
      return matchDate && matchCountry;
    });
  }, [users, dateFilter, countryFilter]);

  const totalPages = Math.ceil(filteredUsers.length / TABLE_PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  /* ── Recent Activity Feed ─────────────────────────────────────────────── */
  const recentActivity = useMemo(() => {
    const events: any[] = [];
    downloads.slice(0, 30).forEach((d: any) => {
      events.push({
        type: "download",
        name: d.userFirstName ? `${d.userFirstName} ${d.userLastName || ""}`.trim() : (d.userEmail || "Someone"),
        detail: d.formulationName || "a formula",
        time: d.downloadedAt,
        icon: "download",
      });
    });
    favorites.slice(0, 30).forEach((f: any) => {
      events.push({
        type: "favorite",
        name: f.userFirstName ? `${f.userFirstName} ${f.userLastName || ""}`.trim() : (f.userEmail || "Someone"),
        detail: f.formulation?.name || "a formula",
        time: f.addedAt,
        icon: "heart",
      });
    });
    generated.slice(0, 30).forEach((g: any) => {
      const formData = typeof g.formData === "string" ? (() => { try { return JSON.parse(g.formData); } catch { return {}; } })() : (g.formData || {});
      events.push({
        type: "generated",
        name: g.customer_name || formData?.customerName || "Someone",
        detail: g.product_name || formData?.productName || "a formula",
        time: g.created_at || g.createdAt,
        icon: "generated",
      });
    });
    users.slice(0, 20).forEach((u: any) => {
      events.push({
        type: "login",
        name: u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.email,
        detail: "",
        time: u.createdAt,
        icon: "login",
      });
    });
    return events
      .filter(e => e.time)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, [downloads, favorites, generated, users]);

  /* ── Country Breakdown ───────────────────────────────────────────────── */
  const countryData = useMemo(() => {
    const m = new Map<string, number>();
    users.forEach((u: any) => {
      const c = u.country || "Other";
      m.set(c, (m.get(c) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [users]);

  const totalUsersCount = users.length;

  function formatRelativeTime(t: string) {
    if (!t) return "";
    const diff = Date.now() - new Date(t).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return format(new Date(t), "MMM d");
  }

  const tableTitle =
    dateFilter === "today" ? "New Users Today" :
    dateFilter === "yesterday" ? "New Users Yesterday" :
    dateFilter === "7days" ? "New Users — Last 7 Days" :
    "All Users";

  const tableSubtitle =
    dateFilter === "today" ? "Users who joined your platform today." :
    dateFilter === "yesterday" ? "Users who joined yesterday." :
    dateFilter === "7days" ? "Users who joined in the last 7 days." :
    "All registered users.";

  /* ── KPI cards config ─────────────────────────────────────────────────── */
  const kpis = [
    {
      label: "New Users Today",
      value: loading ? null : newUsersToday.length,
      sub: newUsersToday.length > 0 ? `+${newUsersToday.length} since midnight` : "None yet today",
      icon: Users,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend: null,
    },
    {
      label: "Total Users",
      value: loading ? null : totalUsersCount,
      sub: `All registered accounts`,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: null,
    },
    {
      label: "Formulas Generated Today",
      value: loading ? null : generatedToday.length,
      sub: generatedToday.length > 0 ? `${generatedToday.length} generated today` : "None yet today",
      icon: Wand2,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      trend: null,
    },
    {
      label: "Downloads Today",
      value: loading ? null : downloadsToday.length,
      sub: downloadsToday.length > 0 ? `${downloadsToday.length} downloads today` : "None yet today",
      icon: Download,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      trend: null,
    },
    {
      label: "Returning Users Today",
      value: loading ? null : returningUsersToday,
      sub: "Active users, joined prior days",
      icon: TrendingUp,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      trend: null,
    },
    {
      label: "Active Users Now",
      value: loading ? null : activeNow,
      sub: "Activity in last 60 min",
      icon: Activity,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
      isLive: true,
    },
  ];

  const DATE_FILTERS: { key: DateFilter; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "7days", label: "Last 7 Days" },
    { key: "all", label: "All Time" },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening on your platform today.</p>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${kpi.iconColor}`} />
                  </div>
                  {kpi.isLive && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live
                    </span>
                  )}
                </div>
                {kpi.value === null ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{kpi.value.toLocaleString()}</p>
                )}
                <p className="text-xs font-medium text-gray-700 mt-0.5 leading-tight">{kpi.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Users Table ──────────────────────────────────────────────────── */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">{tableTitle}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{tableSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Date filter pills */}
              <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
                {DATE_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setDateFilter(f.key); setPage(1); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      dateFilter === f.key
                        ? "bg-white shadow-sm text-emerald-700 border border-gray-200"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {/* Country filter */}
              <select
                value={countryFilter}
                onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {countries.map(c => (
                  <option key={c} value={c}>{c === "all" ? "All Countries" : c}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingUsers ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No users found for this filter.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Country</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Login Method</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Formulas</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Downloads</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pagedUsers.map((u: any, idx: number) => {
                      const globalIdx = (page - 1) * TABLE_PAGE_SIZE + idx + 1;
                      const dlCount = userDownloadCount.get(u.id) ?? userDownloadCount.get(u.email) ?? 0;
                      const genCount = userGeneratedCount.get(u.id) ?? userGeneratedCount.get(u.email) ?? 0;
                      const name = u.firstName
                        ? `${u.firstName} ${u.lastName || ""}`.trim()
                        : u.email;
                      const joinedToday = isToday(u.createdAt);
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-gray-50 transition-colors ${joinedToday ? "bg-emerald-50/40" : ""}`}
                        >
                          <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{globalIdx}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(idx + (page - 1) * TABLE_PAGE_SIZE)}`}>
                                {userInitials(u)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                                {joinedToday && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    New today
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-gray-600 truncate max-w-[200px] block">{u.email}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-sm text-gray-600">{u.country || <span className="text-gray-300">—</span>}</span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                <Lock className="h-2.5 w-2.5 text-gray-500" />
                              </div>
                              <span className="text-xs text-gray-600">Email</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-gray-600">
                              {u.createdAt ? format(new Date(u.createdAt), "MMM d, h:mm a") : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center hidden xl:table-cell">
                            <span className={`text-sm font-semibold ${genCount > 0 ? "text-purple-600" : "text-gray-300"}`}>{genCount}</span>
                          </td>
                          <td className="px-4 py-3 text-center hidden xl:table-cell">
                            <span className={`text-sm font-semibold ${dlCount > 0 ? "text-amber-600" : "text-gray-300"}`}>{dlCount}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg px-2.5 py-1 transition-colors">
                              <Eye className="h-3 w-3" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
                  <span className="text-xs text-gray-500">
                    Showing {(page - 1) * TABLE_PAGE_SIZE + 1}–{Math.min(page * TABLE_PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === "…" ? (
                          <span key={`e${i}`} className="px-1 text-gray-400 text-xs">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                              p === page
                                ? "bg-emerald-600 text-white"
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Bottom Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent User Activity */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold text-gray-900">Recent User Activity</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Latest actions performed by users.</p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No activity yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentActivity.map((ev, i) => {
                  const icons: Record<string, { icon: any; bg: string; color: string; verb: string }> = {
                    download: { icon: Download, bg: "bg-amber-50", color: "text-amber-500", verb: "Downloaded formula" },
                    heart: { icon: Heart, bg: "bg-rose-50", color: "text-rose-500", verb: "Saved to favorites" },
                    generated: { icon: Wand2, bg: "bg-purple-50", color: "text-purple-500", verb: "Generated a formula" },
                    login: { icon: Users, bg: "bg-emerald-50", color: "text-emerald-500", verb: "Logged in to the platform" },
                  };
                  const cfg = icons[ev.icon] || icons.login;
                  const CfgIcon = cfg.icon;
                  return (
                    <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <CfgIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {cfg.verb}{ev.detail ? ` "${ev.detail}"` : ""}
                        </p>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">{formatRelativeTime(ev.time)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Users by Country */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold text-gray-900">Users by Country</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Top countries by total users.</p>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingUsers ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
              </div>
            ) : countryData.length === 0 ? (
              <div className="py-12 text-center">
                <Globe className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No country data yet</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Donut */}
                <div className="relative flex-shrink-0 w-[160px] h-[160px] mx-auto sm:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={countryData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {countryData.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={COUNTRY_COLORS[i % COUNTRY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => [`${v} users`, ""]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f0f0f0" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-gray-900 tabular-nums">{totalUsersCount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Total Users</p>
                  </div>
                </div>

                {/* Legend */}
                <ul className="flex-1 space-y-2 w-full">
                  {countryData.slice(0, 6).map((row, i) => {
                    const pct = totalUsersCount > 0 ? ((row.value / totalUsersCount) * 100).toFixed(1) : "0.0";
                    return (
                      <li key={row.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700 truncate">{row.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{row.value.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 w-10 text-right tabular-nums">{pct}%</span>
                        </div>
                      </li>
                    );
                  })}
                  {countryData.length > 6 && (
                    <li className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-200 flex-shrink-0" />
                        <span className="text-sm text-gray-500">Other Countries</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          {countryData.slice(6).reduce((s, r) => s + r.value, 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 w-10 text-right tabular-nums">
                          {totalUsersCount > 0
                            ? ((countryData.slice(6).reduce((s, r) => s + r.value, 0) / totalUsersCount) * 100).toFixed(1)
                            : "0.0"}%
                        </span>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
