import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  XCircle,
  TrendingUp,
  Activity,
  Save,
  DollarSign,
  Users,
  Clock,
} from "lucide-react";

interface DailyRow { day: string; calls: number; tokens: number; cost: number; }
interface TopUser { email: string; user_id: string | null; calls: number; cost: number; tokens: number; }
interface FailedRow { id: string; email: string | null; endpoint: string; model: string; request_status: string; error_message: string | null; product_name: string | null; created_at_utc: string; }
interface UnsavedRow { id: string; email: string | null; endpoint: string; model: string; cost: number; product_name: string | null; request_status: string; created_at_utc: string; }
interface RepeatRow { who: string; email: string | null; rapid_count: number; last_at: string; }
interface Totals {
  totalCost: number; totalCalls: number;
  todayCost: number; todayCalls: number;
  apiCalls: number; savedFormulas: number; unsavedFormulas: number;
  costPerFormula: number; saveRatio: number;
}
interface StatsResponse {
  daily: DailyRow[];
  topUsers: TopUser[];
  failed: FailedRow[];
  unsaved: UnsavedRow[];
  repeats: RepeatRow[];
  totals: Totals;
}

interface LogRow {
  id: string;
  user_id: string | null;
  email: string | null;
  endpoint: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: string;
  request_status: string;
  formula_saved: boolean;
  product_name: string | null;
  ip_address: string | null;
  error_message: string | null;
  created_at_utc: string;
}

const fmtMoney = (n: number) => `$${(n || 0).toFixed(4)}`;
const fmtMoney2 = (n: number) => `$${(n || 0).toFixed(2)}`;
const fmtUtc = (iso: string) => {
  if (!iso) return "—";
  try { return new Date(iso).toISOString().replace("T", " ").slice(0, 19) + " UTC"; }
  catch { return iso; }
};
const statusColor = (s: string) => {
  switch (s) {
    case "success": return "bg-green-100 text-green-800";
    case "failed": return "bg-red-100 text-red-800";
    case "timeout": return "bg-orange-100 text-orange-800";
    case "cancelled": return "bg-gray-200 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function OpenAIUsageTab() {
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/admin/openai-logs/stats"],
    refetchInterval: 30_000,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<LogRow[]>({
    queryKey: ["/api/admin/openai-logs", statusFilter],
    queryFn: async () => {
      const url = statusFilter
        ? `/api/admin/openai-logs?status=${encodeURIComponent(statusFilter)}`
        : "/api/admin/openai-logs";
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed to load logs");
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const t = stats?.totals;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">OpenAI Usage</h2>
        <p className="text-sm text-gray-600 mt-1">
          Token usage, costs, and call statistics for every OpenAI request. Timestamps in UTC.
        </p>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Today's Cost"
          value={fmtMoney(t?.todayCost ?? 0)}
          subtitle={`${t?.todayCalls ?? 0} calls today`}
          icon={DollarSign}
          color="green"
        />
        <KpiCard
          title="Total Cost (all time)"
          value={fmtMoney2(t?.totalCost ?? 0)}
          subtitle={`${t?.totalCalls ?? 0} total calls`}
          icon={TrendingUp}
          color="blue"
        />
        <KpiCard
          title="Cost per Formula"
          value={fmtMoney(t?.costPerFormula ?? 0)}
          subtitle={`${t?.savedFormulas ?? 0} formulas saved`}
          icon={Save}
          color="purple"
        />
        <KpiCard
          title="Save Ratio"
          value={`${Math.round((t?.saveRatio ?? 0) * 100)}%`}
          subtitle={`${t?.savedFormulas ?? 0} of ${t?.apiCalls ?? 0} API calls saved`}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* ── Saved vs API calls comparison ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saved Formulas vs API Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Custom-formulation API calls</span>
              <span className="font-semibold">{t?.apiCalls ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Formulas successfully saved</span>
              <span className="font-semibold text-green-700">{t?.savedFormulas ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Unsaved (failed/abandoned)</span>
              <span className="font-semibold text-red-700">{t?.unsavedFormulas ?? 0}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.round((t?.saveRatio ?? 0) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Repeat-request warnings ────────────────────────────────────── */}
      {stats && stats.repeats.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Rapid Repeat Requests (≥2 within 10 seconds, last 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.repeats.map((r, i) => (
                <div key={i} className="flex justify-between items-center text-sm bg-white rounded-md p-2 border border-amber-200">
                  <div>
                    <span className="font-medium">{r.email || r.who}</span>
                    <span className="text-gray-500 ml-2">— {r.rapid_count} rapid requests</span>
                  </div>
                  <span className="text-xs text-gray-500">{fmtUtc(r.last_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Daily cost table ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Cost (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : !stats?.daily.length ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="text-left py-2">Day (UTC)</th>
                      <th className="text-right">Calls</th>
                      <th className="text-right">Tokens</th>
                      <th className="text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.daily.map((d) => (
                      <tr key={d.day}>
                        <td className="py-1.5">{(d.day || "").slice(0, 10)}</td>
                        <td className="text-right">{d.calls}</td>
                        <td className="text-right">{d.tokens.toLocaleString()}</td>
                        <td className="text-right font-medium">{fmtMoney(d.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Top users by cost ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Users by Cost (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : !stats?.topUsers.length ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="text-left py-2">User</th>
                      <th className="text-right">Calls</th>
                      <th className="text-right">Tokens</th>
                      <th className="text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.topUsers.map((u, i) => (
                      <tr key={i}>
                        <td className="py-1.5 truncate max-w-[200px]" title={u.email}>{u.email}</td>
                        <td className="text-right">{u.calls}</td>
                        <td className="text-right">{u.tokens.toLocaleString()}</td>
                        <td className="text-right font-medium">{fmtMoney(u.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Failed requests ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Failed / Timed-out / Cancelled Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : !stats?.failed.length ? (
            <p className="text-sm text-gray-500">No failed requests recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase border-b">
                  <tr>
                    <th className="text-left py-2">Time (UTC)</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Endpoint</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.failed.map((f) => (
                    <tr key={f.id}>
                      <td className="py-1.5 whitespace-nowrap text-xs">{fmtUtc(f.created_at_utc)}</td>
                      <td className="truncate max-w-[180px]">{f.email || "—"}</td>
                      <td className="truncate max-w-[220px] text-xs">{f.endpoint}</td>
                      <td><Badge className={`${statusColor(f.request_status)} border-0`}>{f.request_status}</Badge></td>
                      <td className="truncate max-w-[280px] text-xs text-red-700">{f.error_message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Unsaved generations ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Save className="h-4 w-4 text-amber-600" />
            Unsaved Generations (paid for, not stored)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : !stats?.unsaved.length ? (
            <p className="text-sm text-gray-500">No unsaved generations.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase border-b">
                  <tr>
                    <th className="text-left py-2">Time (UTC)</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Product</th>
                    <th className="text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.unsaved.map((u) => (
                    <tr key={u.id}>
                      <td className="py-1.5 whitespace-nowrap text-xs">{fmtUtc(u.created_at_utc)}</td>
                      <td className="truncate max-w-[180px]">{u.email || "—"}</td>
                      <td className="truncate max-w-[260px]">{u.product_name || "—"}</td>
                      <td className="text-right font-medium">{fmtMoney(Number(u.cost) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent log table ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Requests</CardTitle>
          <div className="flex gap-1 flex-wrap">
            {["", "success", "failed", "timeout", "cancelled"].map((s) => (
              <Button
                key={s || "all"}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
                className="h-7 text-xs"
              >
                {s || "All"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-500">No requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase border-b">
                  <tr>
                    <th className="text-left py-2">Time (UTC)</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Endpoint</th>
                    <th className="text-left">Model</th>
                    <th className="text-right">Tokens</th>
                    <th className="text-right">Cost</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Saved</th>
                    <th className="text-left">Product</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 whitespace-nowrap text-xs">{fmtUtc(r.created_at_utc)}</td>
                      <td className="truncate max-w-[160px] text-xs">{r.email || "—"}</td>
                      <td className="truncate max-w-[180px] text-xs">{r.endpoint}</td>
                      <td className="text-xs">{r.model}</td>
                      <td className="text-right text-xs">{(r.total_tokens || 0).toLocaleString()}</td>
                      <td className="text-right font-medium text-xs">{fmtMoney(Number(r.estimated_cost) || 0)}</td>
                      <td><Badge className={`${statusColor(r.request_status)} border-0`}>{r.request_status}</Badge></td>
                      <td className="text-xs">{r.formula_saved ? "✓" : "—"}</td>
                      <td className="truncate max-w-[200px] text-xs">{r.product_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title, value, subtitle, icon: Icon, color,
}: {
  title: string; value: string; subtitle: string; icon: any; color: "green" | "blue" | "purple" | "orange";
}) {
  const colorMap: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
