import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle, XCircle, TrendingUp, Activity, Save, DollarSign,
  Users, Clock, Eye, Copy, Check, Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  category: string | null;
  system_prompt: string | null;
  user_prompt: string | null;
  messages_json: any;
  max_output_tokens: number | null;
  temperature: string | null;
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
const maskEmail = (e: string | null | undefined) => {
  if (!e) return "—";
  const [u, d] = e.split("@");
  if (!d) return e[0] + "***";
  const um = u.length <= 2 ? u[0] + "*" : u[0] + "***" + u[u.length - 1];
  const [host, ...rest] = d.split(".");
  const hm = host[0] + "***";
  return `${um}@${hm}${rest.length ? "." + rest.join(".") : ""}`;
};

export default function OpenAIUsageTab() {
  const { toast } = useToast();
  const [maskEmails, setMaskEmails] = useState(false);
  const [viewLogId, setViewLogId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minCost, setMinCost] = useState("");
  const [maxCost, setMaxCost] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{
    status: string; email: string; productName: string;
    from: string; to: string; minCost: string; maxCost: string;
  }>({ status: "", email: "", productName: "", from: "", to: "", minCost: "", maxCost: "" });

  const applyFilters = () => setAppliedFilters({
    status: statusFilter, email: emailFilter, productName: productFilter,
    from: fromDate, to: toDate, minCost, maxCost,
  });
  const resetFilters = () => {
    setStatusFilter(""); setEmailFilter(""); setProductFilter("");
    setFromDate(""); setToDate(""); setMinCost(""); setMaxCost("");
    setAppliedFilters({ status: "", email: "", productName: "", from: "", to: "", minCost: "", maxCost: "" });
  };

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (appliedFilters.status) p.set("status", appliedFilters.status);
    if (appliedFilters.email) p.set("email", appliedFilters.email);
    if (appliedFilters.productName) p.set("productName", appliedFilters.productName);
    if (appliedFilters.from) p.set("from", appliedFilters.from);
    if (appliedFilters.to) p.set("to", appliedFilters.to);
    if (appliedFilters.minCost) p.set("minCost", appliedFilters.minCost);
    if (appliedFilters.maxCost) p.set("maxCost", appliedFilters.maxCost);
    return p.toString();
  }, [appliedFilters]);

  const { data: stats, isLoading: statsLoading } = useQuery<StatsResponse>({
    queryKey: ["/api/admin/openai-logs/stats"],
    refetchInterval: 30_000,
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery<LogRow[]>({
    queryKey: ["/api/admin/openai-logs", queryString],
    queryFn: async () => {
      const url = queryString
        ? `/api/admin/openai-logs?${queryString}`
        : "/api/admin/openai-logs";
      const r = await fetch(url);
      if (!r.ok) throw new Error("Failed to load logs");
      return r.json();
    },
    refetchInterval: 30_000,
  });

  const { data: detail } = useQuery<LogRow>({
    queryKey: ["/api/admin/openai-logs", "detail", viewLogId],
    queryFn: async () => {
      const r = await fetch(`/api/admin/openai-logs/${viewLogId}`);
      if (!r.ok) throw new Error("Failed to load detail");
      return r.json();
    },
    enabled: !!viewLogId,
  });

  const t = stats?.totals;

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard not available.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">OpenAI Usage</h2>
          <p className="text-sm text-gray-600 mt-1">
            Token usage, costs, and call statistics for every OpenAI request. Timestamps in UTC.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="mask-emails" checked={maskEmails} onCheckedChange={setMaskEmails} />
          <Label htmlFor="mask-emails" className="text-sm">Mask user emails</Label>
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Today's Cost" value={fmtMoney(t?.todayCost ?? 0)} subtitle={`${t?.todayCalls ?? 0} calls today`} icon={DollarSign} color="green" />
        <KpiCard title="Total Cost (all time)" value={fmtMoney2(t?.totalCost ?? 0)} subtitle={`${t?.totalCalls ?? 0} total calls`} icon={TrendingUp} color="blue" />
        <KpiCard title="Cost per Formula" value={fmtMoney(t?.costPerFormula ?? 0)} subtitle={`${t?.savedFormulas ?? 0} formulas saved`} icon={Save} color="purple" />
        <KpiCard title="Save Ratio" value={`${Math.round((t?.saveRatio ?? 0) * 100)}%`} subtitle={`${t?.savedFormulas ?? 0} of ${t?.apiCalls ?? 0} API calls saved`} icon={Activity} color="orange" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Saved Formulas vs API Calls</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Custom-formulation API calls</span><span className="font-semibold">{t?.apiCalls ?? 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Formulas successfully saved</span><span className="font-semibold text-green-700">{t?.savedFormulas ?? 0}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Unsaved (failed/abandoned)</span><span className="font-semibold text-red-700">{t?.unsavedFormulas ?? 0}</span></div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${Math.round((t?.saveRatio ?? 0) * 100)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <span className="font-medium">{maskEmails ? maskEmail(r.email || r.who) : (r.email || r.who)}</span>
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
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Daily Cost (last 30 days)</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <p className="text-sm text-gray-500">Loading…</p>
              : !stats?.daily.length ? <p className="text-sm text-gray-500">No data yet.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase border-b">
                      <tr><th className="text-left py-2">Day (UTC)</th><th className="text-right">Calls</th><th className="text-right">Tokens</th><th className="text-right">Cost</th></tr>
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

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Top Users by Cost (last 30 days)</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <p className="text-sm text-gray-500">Loading…</p>
              : !stats?.topUsers.length ? <p className="text-sm text-gray-500">No data yet.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase border-b">
                      <tr><th className="text-left py-2">User</th><th className="text-right">Calls</th><th className="text-right">Tokens</th><th className="text-right">Cost</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {stats.topUsers.map((u, i) => (
                        <tr key={i}>
                          <td className="py-1.5 truncate max-w-[200px]" title={u.email}>{maskEmails ? maskEmail(u.email) : u.email}</td>
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

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" />Failed / Timed-out / Cancelled Requests</CardTitle></CardHeader>
        <CardContent>
          {statsLoading ? <p className="text-sm text-gray-500">Loading…</p>
            : !stats?.failed.length ? <p className="text-sm text-gray-500">No failed requests recorded.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="text-left py-2">Time (UTC)</th><th className="text-left">Email</th>
                      <th className="text-left">Endpoint</th><th className="text-left">Status</th>
                      <th className="text-left">Error</th><th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.failed.map((f) => (
                      <tr key={f.id}>
                        <td className="py-1.5 whitespace-nowrap text-xs">{fmtUtc(f.created_at_utc)}</td>
                        <td className="truncate max-w-[180px]">{maskEmails ? maskEmail(f.email) : (f.email || "—")}</td>
                        <td className="truncate max-w-[220px] text-xs">{f.endpoint}</td>
                        <td><Badge className={`${statusColor(f.request_status)} border-0`}>{f.request_status}</Badge></td>
                        <td className="truncate max-w-[280px] text-xs text-red-700">{f.error_message || "—"}</td>
                        <td><Button size="sm" variant="ghost" onClick={() => setViewLogId(f.id)}><Eye className="h-3.5 w-3.5" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">From (UTC)</Label>
              <Input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To (UTC)</Label>
              <Input type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Email contains</Label>
              <Input value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} placeholder="user@" />
            </div>
            <div>
              <Label className="text-xs">Product name contains</Label>
              <Input value={productFilter} onChange={(e) => setProductFilter(e.target.value)} placeholder="Glass cleaner" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="timeout">Timeout</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Min cost ($)</Label>
              <Input type="number" step="0.0001" value={minCost} onChange={(e) => setMinCost(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Max cost ($)</Label>
              <Input type="number" step="0.0001" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} placeholder="1.00" />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">Apply</Button>
              <Button variant="outline" onClick={resetFilters}>Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Recent log table ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recent Requests {logs.length > 0 && <span className="text-xs text-gray-500 font-normal">({logs.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsLoading ? <p className="text-sm text-gray-500">Loading…</p>
            : logs.length === 0 ? <p className="text-sm text-gray-500">No requests match the filters.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase border-b">
                    <tr>
                      <th className="text-left py-2">Time (UTC)</th>
                      <th className="text-left">Email</th>
                      <th className="text-left">Product</th>
                      <th className="text-left">Category</th>
                      <th className="text-left">Model</th>
                      <th className="text-right">Tokens</th>
                      <th className="text-right">Cost</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Saved</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((r) => (
                      <tr key={r.id}>
                        <td className="py-1.5 whitespace-nowrap text-xs">{fmtUtc(r.created_at_utc)}</td>
                        <td className="truncate max-w-[160px] text-xs">{maskEmails ? maskEmail(r.email) : (r.email || "—")}</td>
                        <td className="truncate max-w-[180px] text-xs">{r.product_name || "—"}</td>
                        <td className="truncate max-w-[120px] text-xs">{r.category || "—"}</td>
                        <td className="text-xs">{r.model}</td>
                        <td className="text-right text-xs">{(r.total_tokens || 0).toLocaleString()}</td>
                        <td className="text-right font-medium text-xs">{fmtMoney(Number(r.estimated_cost) || 0)}</td>
                        <td><Badge className={`${statusColor(r.request_status)} border-0`}>{r.request_status}</Badge></td>
                        <td className="text-xs">{r.formula_saved ? "✓" : "—"}</td>
                        <td>
                          <Button size="sm" variant="outline" onClick={() => setViewLogId(r.id)} className="h-7 text-xs gap-1">
                            <Eye className="h-3 w-3" /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* ── View Request dialog ──────────────────────────────────────── */}
      <Dialog open={!!viewLogId} onOpenChange={(o) => !o && setViewLogId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>OpenAI Request Detail</DialogTitle>
            <DialogDescription>
              Full request payload sent to OpenAI. API keys and authorization headers are never logged.
            </DialogDescription>
          </DialogHeader>
          {!detail ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <Field label="Time (UTC)" value={fmtUtc(detail.created_at_utc)} />
                <Field label="Email" value={maskEmails ? maskEmail(detail.email) : (detail.email || "—")} />
                <Field label="Endpoint" value={detail.endpoint} />
                <Field label="Model" value={detail.model} />
                <Field label="Temperature" value={detail.temperature ?? "—"} />
                <Field label="Max output tokens" value={detail.max_output_tokens ?? "—"} />
                <Field label="Status" value={detail.request_status} />
                <Field label="Formula saved" value={detail.formula_saved ? "Yes ✓" : "No"} />
                <Field label="Product" value={detail.product_name || "—"} />
                <Field label="Category" value={detail.category || "—"} />
                <Field label="Input tokens" value={String(detail.input_tokens || 0)} />
                <Field label="Output tokens" value={String(detail.output_tokens || 0)} />
                <Field label="Total tokens" value={String(detail.total_tokens || 0)} />
                <Field label="Estimated cost" value={fmtMoney(Number(detail.estimated_cost) || 0)} />
                <Field label="IP address" value={maskEmails ? "[masked]" : (detail.ip_address || "—")} />
              </div>

              {detail.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-800">
                  <div className="font-semibold mb-1">Error</div>
                  <pre className="whitespace-pre-wrap">{detail.error_message}</pre>
                </div>
              )}

              <PromptBlock
                title="System Prompt"
                content={detail.system_prompt || ""}
                onCopy={() => copyText(detail.system_prompt || "", "System prompt")}
              />
              <PromptBlock
                title="User Prompt"
                content={detail.user_prompt || ""}
                onCopy={() => copyText(detail.user_prompt || "", "User prompt")}
              />
              <PromptBlock
                title="Full Messages Payload (JSON)"
                content={detail.messages_json ? JSON.stringify(detail.messages_json, null, 2) : ""}
                mono
                onCopy={() =>
                  copyText(
                    JSON.stringify(
                      {
                        model: detail.model,
                        temperature: detail.temperature,
                        max_output_tokens: detail.max_output_tokens,
                        messages: detail.messages_json,
                      },
                      null,
                      2,
                    ),
                    "Full request payload",
                  )
                }
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="font-medium text-gray-900 break-words">{value}</div>
    </div>
  );
}

function PromptBlock({
  title, content, mono, onCopy,
}: { title: string; content: string; mono?: boolean; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="border rounded-md">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        <Button size="sm" variant="ghost" onClick={handleCopy} className="h-7 text-xs gap-1">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className={`p-3 text-xs whitespace-pre-wrap max-h-72 overflow-y-auto ${mono ? "font-mono" : ""}`}>
        {content || <span className="text-gray-400">(empty)</span>}
      </pre>
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
