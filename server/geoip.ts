import type { Request } from "express";

const cache = new Map<string, { country: string; at: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const FETCH_TIMEOUT_MS = 2500;

export function getClientIp(req: Request): string | null {
  const xff = (req.headers["x-forwarded-for"] as string) || "";
  const fromXff = xff.split(",")[0]?.trim();
  const ip =
    fromXff ||
    (req as any).ip ||
    req.socket?.remoteAddress ||
    "";
  if (!ip) return null;
  return String(ip).replace(/^::ffff:/, "");
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.toLowerCase().startsWith("fc") || ip.toLowerCase().startsWith("fd")) return true;
  return false;
}

export async function detectCountryFromIp(ip: string | null): Promise<string> {
  if (!ip || isPrivateIp(ip)) return "N/A";

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.country;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const resp = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country_name/`, {
      signal: ctrl.signal,
      headers: { "User-Agent": "AIFormulator/1.0 (geoip-lookup)" },
    });
    clearTimeout(t);
    if (!resp.ok) {
      console.warn(`[geoip] ${ip} -> HTTP ${resp.status}`);
      return "N/A";
    }
    const text = (await resp.text()).trim();
    if (!text || text.length === 0 || text.length > 80 || /undefined|error|^false$/i.test(text)) {
      return "N/A";
    }
    cache.set(ip, { country: text, at: Date.now() });
    return text;
  } catch (e: any) {
    console.warn("[geoip] detect failed for", ip, ":", e?.message || e);
    return "N/A";
  }
}

export async function detectCountryFromRequest(req: Request): Promise<string> {
  const ip = getClientIp(req);
  const country = await detectCountryFromIp(ip);
  console.log(`[geoip] request ip=${ip} -> country=${country}`);
  return country;
}
