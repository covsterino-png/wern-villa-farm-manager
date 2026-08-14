export const API = import.meta.env.VITE_API_URL || "https://wern-villa-api.onrender.com";

const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("authToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return nativeFetch(input, { ...options, headers });
};

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("authToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return nativeFetch(`${API}${path.startsWith("/") ? path : "/" + path}`, {
    ...options,
    headers,
  });
}

export async function fetchJson(path, options = {}) {
  const res = await apiFetch(path, options);
  if (!res.ok) throw new Error(`Request failed ${res.status}`);
  return readJsonResponse(res);
}

export async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server returned an invalid response (${response.status})`);
  }
}
