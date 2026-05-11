import { db, openaiRequestLogsTable } from "./db";

export type RequestStatus = "success" | "failed" | "cancelled" | "timeout";

// Pricing per 1M tokens (USD). Add models as needed.
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10.0 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4-turbo": { in: 10.0, out: 30.0 },
  "gpt-4": { in: 30.0, out: 60.0 },
  "gpt-3.5-turbo": { in: 0.5, out: 1.5 },
  "dall-e-3": { in: 0, out: 0 },
  "dall-e-2": { in: 0, out: 0 },
  cache: { in: 0, out: 0 },
};

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): string {
  const p = MODEL_PRICING[model] || MODEL_PRICING["gpt-4o"];
  const total = (inputTokens * p.in + outputTokens * p.out) / 1_000_000;
  return total.toFixed(6);
}

export interface LogContext {
  userId?: string | null;
  email?: string | null;
  endpoint: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: string;
  requestStatus: RequestStatus;
  formulaSaved?: boolean;
  productName?: string | null;
  ipAddress?: string | null;
  errorMessage?: string | null;
}

// Fire-and-forget log write. Never throws.
export function logOpenAIRequest(ctx: LogContext): void {
  const inTok = ctx.inputTokens ?? 0;
  const outTok = ctx.outputTokens ?? 0;
  const totTok = ctx.totalTokens ?? inTok + outTok;
  const cost = ctx.estimatedCost ?? estimateCost(ctx.model, inTok, outTok);

  db.insert(openaiRequestLogsTable)
    .values({
      userId: ctx.userId || null,
      email: ctx.email || null,
      endpoint: ctx.endpoint,
      model: ctx.model || "gpt-4o",
      inputTokens: inTok,
      outputTokens: outTok,
      totalTokens: totTok,
      estimatedCost: cost,
      requestStatus: ctx.requestStatus,
      formulaSaved: ctx.formulaSaved ?? false,
      productName: ctx.productName || null,
      ipAddress: ctx.ipAddress || null,
      errorMessage: ctx.errorMessage || null,
    })
    .catch((e) =>
      console.error("[openai-logger] insert failed:", e?.message || e),
    );
}

// Best-effort client IP extraction from an Express request.
export function getClientIp(req: any): string | null {
  try {
    const xff = (req?.headers?.["x-forwarded-for"] || "").toString();
    const first = xff.split(",")[0]?.trim();
    const ip =
      first ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      req?.connection?.remoteAddress ||
      null;
    if (!ip) return null;
    return ip.replace(/^::ffff:/, "");
  } catch {
    return null;
  }
}
