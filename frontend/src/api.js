export const API = import.meta.env.VITE_API_URL || "https://wern-villa-api.onrender.com";

export async function fetchJson(path, options = {}) {
  const res = await fetch(`${API}${path.startsWith("/") ? path : "/" + path}` , options);
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return res.json();
}
