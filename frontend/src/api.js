// Set VITE_API_URL (e.g. https://api.example.com) for production builds.
const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const getSymptoms = () => request("/api/symptoms");
export const getMetrics = () => request("/api/metrics");
export const predict = (symptoms) =>
  request("/api/predict", { method: "POST", body: JSON.stringify({ symptoms }) });
export const getDisease = (name) => request(`/api/disease/${encodeURIComponent(name)}`);
