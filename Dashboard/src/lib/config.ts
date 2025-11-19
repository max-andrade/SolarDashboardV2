const FALLBACK_API_BASE = "https://n8n.20.248.127.1.nip.io/webhook/FroniusData";

export const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.trim() || FALLBACK_API_BASE;
