import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Download, Heart, Wand2, Activity, Globe,
  ChevronLeft, ChevronRight, Eye, Lock, TrendingUp,
  Zap, DollarSign, Database, Trophy,
} from "lucide-react";
import { format, isToday as dateFnsIsToday, isYesterday, subDays, isAfter } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const TABLE_PAGE_SIZE = 7;

const DONUT_COLORS = ["#10b981", "#6366f1", "#f59e0b"];
const COUNTRY_COLORS = [
  "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
];
const AVATAR_BG = [
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
];

function isToday(d: string | null | undefined) {
  return d ? dateFnsIsToday(new Date(d)) : false;
}
function isYesterdayDate(d: string | null | undefined) {
  return d ? isYesterday(new Date(d)) : false;
}
function isLast7Days(d: string | null | undefined) {
  return d ? isAfter(new Date(d), subDays(new Date(), 7)) : false;
}
function initials(u: any) {
  const f = u.firstName || u.userName || "";
  const l = u.lastName || "";
  return (f.charAt(0) + l.charAt(0)).toUpperCase() || (u.email || u.userEmail || "?").charAt(0).toUpperCase();
}
function avatarBg(i: number) { return AVATAR_BG[i % AVATAR_BG.length]; }
function relTime(t: string) {
  if (!t) return "";
  const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return format(new Date(t), "MMM d");
}
function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type DateFilter = "today" | "yesterday" | "7days" | "all";

export default function AdminOverviewTab() {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [countryFilter, setCountryFilter] = useState("all");
  const [page, setPage] = useState(1);

  const enabled = !!user?.isAdmin;
  const q = (key: string) => ({ queryKey: [key], enabled, staleTime: 30_000 });

  const { data: users = [], isLoading: lusr } = useQuery<any[]>(q("/api/admin/users"));
  const { data: downloads = [], isLoading: ldl } = useQuery<any[]>(q("/api/admin/downloads"));
  const { data: favorites = [], isLoading: lfav } = useQuery<any[]>(q("/api/admin/favorites"));
  const { data: generated = [], isLoading: lgen } = useQuery<any[]>(q("/api/admin/user-formulations"));
  const { data: apiLogs = [], isLoading: lapi } = useQuery<any[]>(q("/api/admin/api-usage"));

  const loading = lusr || ldl || lfav || lgen;

  /* ── Derived KPIs ─────────────────────────────────────────────────────── */
  const newUsersToday    = useMemo(() => users.filter(u => isToday(u.createdAt)), [users]);
  const generatedToday   = useMemo(() => generated.filter(g => isToday(g.created_at || g.createdAt)), [generated]);
  const downloadsToday   = useMemo(() => downloads.filter(d => isToday(d.downloadedAt)), [downloads]);

  const returningUsersToday = useMemo(() => {
    const active = new Set<string>();
    downloadsToday.forEach((d: any) => { if (d.userId) active.add(d.userId); });
    generatedToday.forEach((g: any) => { const id = g.userId || g.user_id; if (id) active.add(id); });
    return [...active].filter(id => { const u = users.find((u: any) => u.id === id); return u && !isToday(u.createdAt); }).length;
  }, [downloadsToday, generatedToday, users]);

  const activeNow = useMemo(() => {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const ids = new Set<string>();
    downloads.forEach((d: any) => { if (d.downloadedAt && new Date(d.downloadedAt) > since && d.userId) ids.add(d.userId); });
    generated.forEach((g: any) => { const t = g.created_at || g.createdAt; if (t && new Date(t) > since && (g.userId || g.user_id)) ids.add(g.userId || g.user_id); });
    favorites.forEach((f: any) => { if (f.addedAt && new Date(f.addedAt) > since && f.userId) ids.add(f.userId); });
    return ids.size;
  }, [downloads, generated, favorites]);

  /* ── API KPIs ─────────────────────────────────────────────────────────── */
  const apiToday       = useMemo(() => apiLogs.filter(l => isToday(l.createdAt || l.created_at)), [apiLogs]);
  const openAiToday    = useMemo(() => apiToday.filter(l => !l.cacheHit && !l.cache_hit), [apiToday]);
  const cacheHitsToday = useMemo(() => apiToday.filter(l => l.cacheHit || l.cache_hit), [apiToday]);

  const tokensToday  = useMemo(() => openAiToday.reduce((s, l) => s + (l.totalTokens || l.total_tokens || 0), 0), [openAiToday]);
  const costToday    = useMemo(() => openAiToday.reduce((s, l) => s + parseFloat(l.estimatedCost || l.estimated_cost || "0"), 0), [openAiToday]);
  const cacheHitRate = useMemo(() => {
    const total = apiToday.length;
    return total > 0 ? ((cacheHitsToday.length / total) * 100).toFixed(1) : "0.0";
  }, [apiToday, cacheHitsToday]);

  // Top formula generator today
  const topGeneratorToday = useMemo(() => {
    if (!openAiToday.length) return null;
    const map = new Map<string, { name: string; count: number }>();
    openAiToday.forEach((l: any) => {
      const key = l.userEmail || l.user_email || "unknown";
      const name = l.userName || l.user_name || l.userEmail || l.user_email || "Unknown";
      const cur = map.get(key) || { name, count: 0 };
      map.set(key, { ...cur, count: cur.count + 1 });
    });
    const sorted = [...map.entries()].sort((a, b) => b[1].count - a[1].count);
    return sorted[0] ? { email: sorted[0][0], ...sorted[0][1] } : null;
  }, [openAiToday]);

  /* ── Per-user counts for table ────────────────────────────────────────── */
  const userDownloads = useMemo(() => {
    const m = new Map<string, number>();
    downloads.forEach((d: any) => { const k = d.userId || d.userEmail; if (k) m.set(k, (m.get(k) ?? 0) + 1); });
    return m;
  }, [downloads]);
  const userGenerated = useMemo(() => {
    const m = new Map<string, number>();
    generated.forEach((g: any) => { const k = g.userId || g.user_id || g.email; if (k) m.set(k, (m.get(k) ?? 0) + 1); });
    return m;
  }, [generated]);

  /* ── Table filtering ──────────────────────────────────────────────────── */
  const countries = useMemo(() => {
    const s = new Set<string>();
    users.forEach((u: any) => { if (u.country) s.add(u.country); });
    return ["all", ...Array.from(s).sort()];
  }, [users]);

  const filteredUsers = useMemo(() => users.filter((u: any) => {
    const ok =
      dateFilter === "today"     ? isToday(u.createdAt) :
      dateFilter === "yesterday" ? isYesterdayDate(u.createdAt) :
      dateFilter === "7days"     ? isLast7Days(u.createdAt) : true;
    return ok && (countryFilter === "all" || u.country === countryFilter);
  }), [users, dateFilter, countryFilter]);

  const totalPages = Math.ceil(filteredUsers.length / TABLE_PAGE_SIZE);
  const pagedUsers = filteredUsers.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE);

  /* ── API Usage donut ──────────────────────────────────────────────────── */
  const usageDonut = useMemo(() => [
    { name: "OpenAI API Calls", value: openAiToday.length },
    { name: "Cache Hits",       value: cacheHitsToday.length },
    { name: "Other Requests",   value: Math.max(0, apiToday.length - openAiToday.length - cacheHitsToday.length) },
  ].filter(d => d.value > 0), [openAiToday, cacheHitsToday, apiToday]);

  /* ── Top formula users leaderboard ───────────────────────────────────── */
  const topUsers = useMemo(() => {
    const map = new Map<string, any>();
    apiLogs.forEach((l: any) => {
      if (l.cacheHit || l.cache_hit) return;
      const key = l.userEmail || l.user_email || l.userId || l.user_id || "unknown";
      const cur = map.get(key) || {
        key, email: l.userEmail || l.user_email || "—",
        name: l.userName || l.user_name || l.userEmail || l.user_email || "Unknown",
        country: l.userCountry || l.user_country || "—",
        totalFormulas: 0, apiCalls: 0, totalTokens: 0, totalCost: 0, lastActivity: null,
      };
      cur.totalFormulas += 1;
      cur.apiCalls += 1;
      cur.totalTokens += l.totalTokens || l.total_tokens || 0;
      cur.totalCost += parseFloat(l.estimatedCost || l.estimated_cost || "0");
      const t = l.createdAt || l.created_at;
      if (t && (!cur.lastActivity || new Date(t) > new Date(cur.lastActivity))) cur.lastActivity = t;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => b.totalFormulas - a.totalFormulas).slice(0, 10);
  }, [apiLogs]);

  /* ── Recent activity feed ─────────────────────────────────────────────── */
  const recentActivity = useMemo(() => {
    const events: any[] = [];
    downloads.slice(0, 20).forEach((d: any) => events.push({ type: "download", name: d.userFirstName ? `${d.userFirstName} ${d.userLastName || ""}`.trim() : d.userEmail || "Someone", detail: d.formulationName || "a formula", time: d.downloadedAt }));
    favorites.slice(0, 20).forEach((f: any) => events.push({ type: "favorite", name: f.userFirstName ? `${f.userFirstName} ${f.userLastName || ""}`.trim() : f.userEmail || "Someone", detail: f.formulation?.name || "a formula", time: f.addedAt }));
    generated.slice(0, 20).forEach((g: any) => {
      const fd = typeof g.formData === "string" ? (() => { try { return JSON.parse(g.formData); } catch { return {}; } })() : g.formData || {};
      events.push({ type: "generated", name: g.customer_name || fd?.customerName || "Someone", detail: g.product_name || fd?.productName || "a formula", time: g.created_at || g.createdAt });
    });
    users.slice(0, 10).forEach((u: any) => events.push({ type: "login", name: u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.email, detail: "", time: u.createdAt }));
    return events.filter(e => e.time).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  }, [downloads, favorites, generated, users]);

  /* ── Users by country ─────────────────────────────────────────────────── */
  const countryData = useMemo(() => {
    const m = new Map<string, number>();
    users.forEach((u: any) => { const c = u.country || "Other"; m.set(c, (m.get(c) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [users]);

  /* ── Table title ──────────────────────────────────────────────────────── */
  const tableTitle = dateFilter === "today" ? "New Users Today" : dateFilter === "yesterday" ? "New Users Yesterday" : dateFilter === "7days" ? "New Users — Last 7 Days" : "All Users";

  /* ── KPI row 1: User metrics ──────────────────────────────────────────── */
  const userKPIs = [
    { label: "New Users Today",        value: loading ? null : newUsersToday.length,    sub: "Joined since midnight",          icon: Users,     bg: "bg-emerald-50", clr: "text-emerald-600" },
    { label: "Total Users",            value: loading ? null : users.length,            sub: "All registered accounts",        icon: Users,     bg: "bg-blue-50",    clr: "text-blue-600" },
    { label: "Formulas Generated Today",value: loading ? null : generatedToday.length, sub: "AI generations since midnight",   icon: Wand2,     bg: "bg-purple-50",  clr: "text-purple-600" },
    { label: "Downloads Today",        value: loading ? null : downloadsToday.length,   sub: "Downloads since midnight",       icon: Download,  bg: "bg-amber-50",   clr: "text-amber-600" },
    { label: "Returning Users Today",  value: loading ? null : returningUsersToday,     sub: "Active users, joined prior days", icon: TrendingUp,bg: "bg-rose-50",    clr: "text-rose-600" },
    { label: "Active Users Now",       value: loading ? null : activeNow,               sub: "Activity in last 60 min",        icon: Activity,  bg: "bg-teal-50",    clr: "text-teal-600", live: true },
  ];

  /* ── KPI row 2: API metrics ───────────────────────────────────────────── */
  const apiKPIs = [
    { label: "API Calls Today",        value: lapi ? null : openAiToday.length,   sub: "OpenAI requests today",          icon: Zap,       bg: "bg-violet-50",  clr: "text-violet-600" },
    { label: "Tokens Used Today",      value: lapi ? null : tokensToday,           sub: "Total tokens consumed",          icon: Database,  bg: "bg-sky-50",     clr: "text-sky-600",   fmt: fmtTokens },
    { label: "OpenAI Cost Today",      value: lapi ? null : costToday,             sub: "Estimated USD spend",            icon: DollarSign,bg: "bg-green-50",   clr: "text-green-600", fmt: (v: number) => `$${v.toFixed(2)}` },
    { label: "Cache Hits Today",       value: lapi ? null : cacheHitsToday.length, sub: "Served from cache",              icon: Activity,  bg: "bg-orange-50",  clr: "text-orange-600" },
    { label: "Top Formula Generator",  value: null,                                 sub: topGeneratorToday ? `${topGeneratorToday.count} formulas today` : "No data yet", icon: Trophy, bg: "bg-yellow-50", clr: "text-yellow-600", custom: topGeneratorToday?.name ?? "—" },
  ];

  /* ── Pagination renderer ──────────────────────────────────────────────── */
  function Pager() {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
        <span className="text-xs text-gray-500">
          Showing {(page - 1) * TABLE_PAGE_SIZE + 1}–{Math.min(page * TABLE_PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
        </span>
        <div className="flex gap-1">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…"); acc.push(p); return acc; }, [])
            .map((p, i) => p === "…"
              ? <span key={`e${i}`} className="px-1 text-gray-400 text-xs">…</span>
              : <button key={p} onClick={() => setPage(p as number)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-emerald-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
            )}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Real-time overview of users, formulas and API usage.</p>
      </div>

      {/* ── Row 1: User KPI cards (6) ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {userKPIs.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${k.clr}`} />
                  </div>
                  {k.live && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live
                    </span>
                  )}
                </div>
                {k.value === null ? <Skeleton className="h-7 w-14 mb-1" /> : (
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{k.value.toLocaleString()}</p>
                )}
                <p className="text-[11px] font-medium text-gray-700 mt-0.5 leading-tight">{k.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{k.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Row 2: API KPI cards (5) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {apiKPIs.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-4 w-4 ${k.clr}`} />
                </div>
                {k.custom !== undefined ? (
                  <p className="text-base font-bold text-gray-900 leading-tight truncate">{k.custom}</p>
                ) : k.value === null ? (
                  <Skeleton className="h-7 w-14 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {k.fmt ? k.fmt(k.value) : k.value.toLocaleString()}
                  </p>
                )}
                <p className="text-[11px] font-medium text-gray-700 mt-0.5 leading-tight">{k.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{k.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Row 3: New Users table + API Usage donut ─────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* New Users table */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">{tableTitle}</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Users who joined your platform today.</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
                  {(["today","yesterday","7days","all"] as DateFilter[]).map(f => (
                    <button key={f} onClick={() => { setDateFilter(f); setPage(1); }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${dateFilter === f ? "bg-white shadow-sm text-emerald-700 border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                      {f === "today" ? "Today" : f === "yesterday" ? "Yesterday" : f === "7days" ? "7 Days" : "All"}
                    </button>
                  ))}
                </div>
                <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                  {countries.map(c => <option key={c} value={c}>{c === "all" ? "All Countries" : c}</option>)}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lusr ? (
              <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center"><Users className="h-8 w-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No users for this filter</p></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Country</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Method</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                        <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pagedUsers.map((u: any, idx: number) => {
                        const gi = (page - 1) * TABLE_PAGE_SIZE + idx + 1;
                        const name = u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : u.email;
                        const today = isToday(u.createdAt);
                        return (
                          <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${today ? "bg-emerald-50/30" : ""}`}>
                            <td className="px-3 py-2.5 text-xs text-gray-400 tabular-nums">{gi}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${avatarBg(gi - 1)}`}>{initials(u)}</div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                                  {today && <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />New today</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 hidden md:table-cell"><span className="text-xs text-gray-500 truncate block max-w-[150px]">{u.email}</span></td>
                            <td className="px-3 py-2.5 hidden sm:table-cell"><span className="text-xs text-gray-600">{u.country || <span className="text-gray-300">—</span>}</span></td>
                            <td className="px-3 py-2.5 hidden lg:table-cell">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center"><Lock className="h-2 w-2 text-gray-500" /></div>
                                <span className="text-xs text-gray-600">Email</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 hidden lg:table-cell"><span className="text-xs text-gray-500">{u.createdAt ? format(new Date(u.createdAt), "MMM d, h:mm a") : "—"}</span></td>
                            <td className="px-3 py-2.5 text-center">
                              <button className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg px-2 py-1 transition-colors">
                                <Eye className="h-3 w-3" />View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pager />
              </>
            )}
          </CardContent>
        </Card>

        {/* User API Usage */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold text-gray-900">User API Usage</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">API usage summary for today.</p>
          </CardHeader>
          <CardContent className="pt-5">
            {lapi ? (
              <div className="space-y-3">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}</div>
            ) : (
              <>
                {/* Donut + legend */}
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="relative flex-shrink-0 w-[160px] h-[160px] mx-auto sm:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={usageDonut.length ? usageDonut : [{ name: "No data", value: 1 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {(usageDonut.length ? usageDonut : [{ name: "No data", value: 1 }]).map((_, i) => (
                            <Cell key={i} fill={usageDonut.length ? DONUT_COLORS[i % DONUT_COLORS.length] : "#e5e7eb"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f0f0f0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-xl font-bold text-gray-900 tabular-nums">{apiToday.length.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500 font-medium text-center leading-tight">Total API<br/>Calls</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {[
                      { label: "OpenAI API Calls", value: openAiToday.length,    color: DONUT_COLORS[0], pct: apiToday.length ? ((openAiToday.length / apiToday.length) * 100).toFixed(1) : "0.0" },
                      { label: "Cache Hits",        value: cacheHitsToday.length, color: DONUT_COLORS[1], pct: apiToday.length ? ((cacheHitsToday.length / apiToday.length) * 100).toFixed(1) : "0.0" },
                      { label: "Other Requests",   value: Math.max(0, apiToday.length - openAiToday.length - cacheHitsToday.length), color: DONUT_COLORS[2], pct: "0.0" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                          <span className="text-xs text-gray-700 truncate">{row.label}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{row.value.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 w-12 text-right tabular-nums">({row.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Summary stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-50">
                  {[
                    { label: "Total Tokens Used",   value: fmtTokens(tokensToday) },
                    { label: "Total Cost (USD)",     value: `$${costToday.toFixed(2)}` },
                    { label: "Cost per 1K Tokens",  value: tokensToday > 0 ? `$${((costToday / tokensToday) * 1000).toFixed(4)}` : "$0.0000" },
                    { label: "Cache Hit Rate",       value: `${cacheHitRate}%` },
                  ].map(s => (
                    <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3">
                      <p className="text-base font-bold text-gray-900 tabular-nums">{s.value}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Top Formula Users + Recent Activity ───────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Top Generated Formula Users */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Generated Formula Users
            </CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Users who generated the most formulas.</p>
          </CardHeader>
          <CardContent className="p-0">
            {lapi ? (
              <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
            ) : topUsers.length === 0 ? (
              <div className="py-12 text-center"><Trophy className="h-8 w-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No usage data yet</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Country</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Formulas</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tokens</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cost</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Last Active</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topUsers.map((u, idx) => (
                      <tr key={u.key} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          {idx === 0
                            ? <span className="text-lg">🥇</span>
                            : idx === 1 ? <span className="text-lg">🥈</span>
                            : idx === 2 ? <span className="text-lg">🥉</span>
                            : <span className="text-xs text-gray-400 tabular-nums">{idx + 1}</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${avatarBg(idx)}`}>
                              {(u.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell"><span className="text-xs text-gray-600">{u.country}</span></td>
                        <td className="px-3 py-2.5 text-center"><span className="text-sm font-bold text-purple-600 tabular-nums">{u.totalFormulas}</span></td>
                        <td className="px-3 py-2.5 text-center hidden md:table-cell"><span className="text-xs text-gray-600 tabular-nums">{fmtTokens(u.totalTokens)}</span></td>
                        <td className="px-3 py-2.5 text-center hidden lg:table-cell"><span className="text-xs font-semibold text-emerald-700 tabular-nums">${u.totalCost.toFixed(3)}</span></td>
                        <td className="px-3 py-2.5 text-center hidden xl:table-cell"><span className="text-xs text-gray-500">{u.lastActivity ? relTime(u.lastActivity) : "—"}</span></td>
                        <td className="px-3 py-2.5 text-center">
                          <button className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg px-2 py-1 transition-colors">
                            <Eye className="h-3 w-3" />View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent User Activity */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-base font-semibold text-gray-900">Recent User Activity</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Latest activities performed by users.</p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : recentActivity.length === 0 ? (
              <div className="py-12 text-center"><Activity className="h-8 w-8 text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No activity yet</p></div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentActivity.map((ev, i) => {
                  const cfg: Record<string, { icon: any; bg: string; clr: string; verb: string }> = {
                    download:  { icon: Download, bg: "bg-amber-50",   clr: "text-amber-500",   verb: "Downloaded formula" },
                    favorite:  { icon: Heart,    bg: "bg-rose-50",    clr: "text-rose-500",    verb: "Saved to favorites" },
                    generated: { icon: Wand2,    bg: "bg-purple-50",  clr: "text-purple-500",  verb: "Generated a formula" },
                    login:     { icon: Users,    bg: "bg-emerald-50", clr: "text-emerald-500", verb: "Logged in to the platform" },
                  };
                  const c = cfg[ev.type] || cfg.login;
                  const CIcon = c.icon;
                  return (
                    <li key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <CIcon className={`h-3.5 w-3.5 ${c.clr}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.verb}{ev.detail ? ` "${ev.detail}"` : ""}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">{relTime(ev.time)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {/* Users by Country (compact) */}
            <div className="border-t border-gray-50 mt-0">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">Users by Country</p>
                <p className="text-xs text-gray-500">Top countries by total users.</p>
              </div>
              {lusr ? (
                <div className="p-4 space-y-2">{Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-6 w-full rounded" />)}</div>
              ) : countryData.length === 0 ? (
                <div className="py-8 text-center"><Globe className="h-7 w-7 text-gray-200 mx-auto mb-1" /><p className="text-xs text-gray-400">No country data</p></div>
              ) : (
                <ul className="px-4 py-3 space-y-2">
                  {countryData.slice(0, 5).map((row, i) => {
                    const pct = users.length > 0 ? ((row.value / users.length) * 100).toFixed(1) : "0.0";
                    return (
                      <li key={row.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COUNTRY_COLORS[i % COUNTRY_COLORS.length] }} />
                          <span className="text-sm text-gray-700 truncate">{row.name}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{row.value.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 w-10 text-right tabular-nums">{pct}%</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
