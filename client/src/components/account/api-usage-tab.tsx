import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Zap, Hash, ArrowDown, ArrowUp, DollarSign, Activity, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

type Period = "1d" | "7d" | "30d";

interface UsageSummary {
  totalCalls: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  cacheHits: number;
}

interface UsageData {
  current: UsageSummary;
  prev: UsageSummary;
  byDate: { date: string; calls: number; tokens: number }[];
  byModel: { model: string; tokens: number; percentage: number }[];
  recent: {
    id: string;
    productName: string | null;
    model: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: string;
    cacheHit: boolean;
    createdAt: string;
  }[];
}

const MODEL_COLORS: Record<string, string> = {
  "gpt-4o": "#22C55E",
  "gpt-4": "#16A34A",
  "gpt-4-turbo": "#3B82F6",
  "gpt-3.5-turbo": "#8B5CF6",
  "Cache": "#94A3B8",
  "Unknown": "#E5E7EB",
};

function pct(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - prev) / prev) * 100);
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function KpiCard({
  label, value, prev, icon: Icon, prefix, decimals, color,
}: {
  label: string;
  value: number;
  prev: number;
  icon: any;
  prefix?: string;
  decimals?: number;
  color?: string;
}) {
  const change = pct(value, prev);
  const up = change >= 0;
  const display = decimals !== undefined
    ? (prefix || "") + value.toFixed(decimals)
    : (prefix || "") + fmt(value);

  return (
    <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color || "bg-emerald-50"}`}>
          <Icon className={`h-4 w-4 ${color ? "text-white" : "text-emerald-600"}`} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{display}</div>
      <div className={`flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-600" : "text-red-500"}`}>
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {up ? "+" : ""}{change}% vs last period
      </div>
    </div>
  );
}

const PERIOD_LABELS: Record<Period, string> = {
  "1d": "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
};

function formatAxisDate(date: string, period: Period) {
  const d = new Date(date);
  if (period === "1d") return format(d, "HH:mm");
  if (period === "7d") return format(d, "MMM d");
  return format(d, "MMM d");
}

export default function ApiUsageTab() {
  const [period, setPeriod] = useState<Period>("30d");

  const { data, isLoading } = useQuery<UsageData>({
    queryKey: ["/api/user/api-usage", period],
    queryFn: () => fetch(`/api/user/api-usage?period=${period}`).then(r => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const c = data?.current;
  const p = data?.prev;
  const byDate = data?.byDate ?? [];
  const byModel = data?.byModel ?? [];
  const recent = data?.recent ?? [];

  const avgCostPer1K = c && c.totalTokens > 0
    ? (c.totalCost / c.totalTokens) * 1000
    : 0;
  const prevAvgCostPer1K = p && p.totalTokens > 0
    ? (p.totalCost / p.totalTokens) * 1000
    : 0;

  const cacheHitRate = c && c.totalCalls > 0
    ? Math.round((c.cacheHits / c.totalCalls) * 100)
    : 0;
  const prevCacheHitRate = p && p.totalCalls > 0
    ? Math.round((p.cacheHits / p.totalCalls) * 100)
    : 0;

  const tableRows = [
    { label: "API Calls", curr: c?.totalCalls ?? 0, prev: p?.totalCalls ?? 0 },
    { label: "Tokens Used", curr: c?.totalTokens ?? 0, prev: p?.totalTokens ?? 0 },
    { label: "Input Tokens", curr: c?.inputTokens ?? 0, prev: p?.inputTokens ?? 0 },
    { label: "Output Tokens", curr: c?.outputTokens ?? 0, prev: p?.outputTokens ?? 0 },
    { label: "Cost (USD)", curr: c?.totalCost ?? 0, prev: p?.totalCost ?? 0, money: true },
    { label: "Cache Hits", curr: c?.cacheHits ?? 0, prev: p?.cacheHits ?? 0 },
    { label: "Cache Hit Rate", curr: cacheHitRate, prev: prevCacheHitRate, pct: true },
  ];

  return (
    <div className="p-6 space-y-7 bg-[#F5F7FB] min-h-full">

      {/* ── 1. KPI Overview ────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#22C55E] inline-block" />
              API Usage Overview
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 ml-3">Track your API calls, token consumption, and costs</p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E6EAF0] rounded-xl p-1 shadow-sm">
            {(["1d", "7d", "30d"] as Period[]).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  period === p ? "bg-[#22C55E] text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard label="Total API Calls" value={c?.totalCalls ?? 0} prev={p?.totalCalls ?? 0} icon={Activity} color="bg-emerald-500" />
          <KpiCard label="Tokens Used" value={c?.totalTokens ?? 0} prev={p?.totalTokens ?? 0} icon={Hash} />
          <KpiCard label="Input Tokens" value={c?.inputTokens ?? 0} prev={p?.inputTokens ?? 0} icon={ArrowDown} color="bg-blue-50" />
          <KpiCard label="Output Tokens" value={c?.outputTokens ?? 0} prev={p?.outputTokens ?? 0} icon={ArrowUp} color="bg-purple-50" />
          <KpiCard label="Total Cost (USD)" value={c?.totalCost ?? 0} prev={p?.totalCost ?? 0} icon={DollarSign} prefix="$" decimals={4} color="bg-amber-50" />
          <KpiCard label="Avg Cost / 1K Tokens" value={avgCostPer1K} prev={prevAvgCostPer1K} icon={Zap} prefix="$" decimals={4} color="bg-rose-50" />
        </div>
      </section>

      {/* ── 2. Chart + Donut ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <span className="w-1 h-4 rounded-full bg-[#22C55E] inline-block" />
            API Usage Over Time
          </h3>
          {byDate.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No usage data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDate} margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => formatAxisDate(d, period)}
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis yAxisId="calls" orientation="left" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <YAxis yAxisId="tokens" orientation="right" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E6EAF0", fontSize: 12 }}
                  formatter={(val: any, name: string) => [fmt(val), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="calls" dataKey="calls" name="API Calls" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="tokens" dataKey="tokens" name="Tokens" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Donut chart */}
        <section className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <span className="w-1 h-4 rounded-full bg-[#22C55E] inline-block" />
            Model Usage
          </h3>
          {byModel.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No model data yet</div>
          ) : (
            <>
              <div className="flex justify-center">
                <PieChart width={150} height={150}>
                  <Pie data={byModel} dataKey="tokens" cx="50%" cy="50%" innerRadius={42} outerRadius={68} strokeWidth={2}>
                    {byModel.map((entry, idx) => (
                      <Cell key={idx} fill={MODEL_COLORS[entry.model] || `hsl(${idx * 60}, 60%, 55%)`} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} formatter={(v: any) => [fmt(v) + " tokens"]} />
                </PieChart>
              </div>
              <div className="mt-3 space-y-2">
                {byModel.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: MODEL_COLORS[m.model] || `hsl(${idx * 60}, 60%, 55%)` }} />
                      <span className="text-gray-600 font-medium truncate max-w-[90px]">{m.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{fmt(m.tokens)}</span>
                      <span className="font-bold text-gray-700">{m.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── 3. Statistics Table ──────────────────────────── */}
      <section className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EEF2F7]">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#22C55E] inline-block" />
            Usage Statistics
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 ml-3">Detailed usage breakdown vs. previous period</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#F1F5F9] border-b border-[#EEF2F7]">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">This Period</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Period</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Change %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F7]">
            {tableRows.map((row) => {
              const change = pct(row.curr, row.prev);
              const up = change >= 0;
              const fmtVal = (v: number) =>
                row.money ? `$${v.toFixed(4)}` :
                row.pct ? `${v}%` :
                fmt(v);
              return (
                <tr key={row.label} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-700">{row.label}</td>
                  <td className="px-6 py-3.5 text-sm text-right font-semibold text-gray-900">{fmtVal(row.curr)}</td>
                  <td className="px-6 py-3.5 text-sm text-right text-gray-500">{fmtVal(row.prev)}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {up ? "+" : ""}{change}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ── 4. Recent API Activity ───────────────────────── */}
      <section className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EEF2F7] flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-[#22C55E] inline-block" />
            Recent API Activity
          </h3>
          <span className="text-xs text-gray-400">Your latest API requests</span>
        </div>
        {recent.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400">
            <Clock className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">No API activity yet. Generate a formula to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF2F7]">
            {recent.map((entry) => {
              const cost = parseFloat(entry.estimatedCost || "0");
              const timeAgo = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
              const modelLabel = entry.cacheHit ? "Served from cache" : entry.model || "gpt-4o";
              const modelColor = entry.cacheHit ? "text-slate-500 bg-slate-50" : "text-emerald-700 bg-emerald-50";
              return (
                <div key={entry.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    entry.cacheHit ? "bg-slate-100" : "bg-emerald-100"
                  }`}>
                    <Zap className={`h-4 w-4 ${entry.cacheHit ? "text-slate-400" : "text-emerald-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">
                        {entry.productName || "Formula generated"}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${modelColor}`}>
                        {modelLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>{fmt(entry.totalTokens)} tokens</span>
                      {!entry.cacheHit && <span className="text-amber-600 font-medium">${cost.toFixed(4)}</span>}
                      {entry.cacheHit && <span className="text-slate-400">$0.0000 (cached)</span>}
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 text-xs text-gray-400">
                    <div>{format(new Date(entry.createdAt), "MMM d")}</div>
                    <div>{format(new Date(entry.createdAt), "HH:mm")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Footer note ──────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-white rounded-xl border border-[#E6EAF0] px-5 py-4 text-xs text-gray-500">
        <Activity className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-gray-700">About API Usage</span>
          {" "}— API usage is updated in near real-time. Costs are estimated based on OpenAI pricing and may vary slightly.
          Cache hits are free and not counted in cost totals.
        </div>
      </div>
    </div>
  );
}
