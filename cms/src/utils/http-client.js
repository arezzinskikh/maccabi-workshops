"use strict";

// Reusable outbound HTTP client for calling external APIs. Handles auth
// header shaping, request timeout, and a small retry-on-transient-error loop
// so any future integration (calendar imports, notification providers, etc.)
// can call this instead of hand-rolling `fetch` each time.

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildAuthHeaders(source) {
  const type = source.auth_type || "none";
  const token = (source.auth_token || "").trim();
  if (!token || type === "none") return {};
  if (type === "bearer") return { Authorization: `Bearer ${token}` };
  if (type === "basic")
    return { Authorization: `Basic ${Buffer.from(token).toString("base64")}` };
  if (type === "api_key") {
    const header = (source.auth_header_name || "X-API-Key").trim();
    return { [header]: token };
  }
  return {};
}

async function requestJson(
  url,
  {
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = {}
) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", ...headers },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        // 4xx are usually caller-config problems; skip retry to fail fast.
        if (res.status >= 400 && res.status < 500) {
          const body = await res.text().catch(() => "");
          throw new Error(
            `HTTP ${res.status} from ${url}: ${body.slice(0, 300)}`
          );
        }
        throw new Error(`HTTP ${res.status} from ${url}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      const isAbort = err.name === "AbortError";
      const is4xx = /^HTTP 4\d\d/.test(err.message || "");
      if (is4xx || attempt === retries) break;
      // Exponential backoff for transient failures / timeouts.
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
      attempt += 1;
    }
  }
  throw lastErr;
}

async function fetchExternal(source) {
  if (!source?.url) throw new Error("external source is missing `url`");
  const headers = buildAuthHeaders(source);
  return requestJson(source.url, { headers });
}

module.exports = { fetchExternal, requestJson, buildAuthHeaders };
