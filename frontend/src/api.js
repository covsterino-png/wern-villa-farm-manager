import { API_URL, PRODUCTION_API } from "./apiConfig";

export const API = API_URL;

const nativeFetch = window.fetch.bind(window);

// Some pages still contain the live API address. When the app is pointed at a
// different API (development or staging), send those requests there instead.
function redirectLegacyApiUrl(input) {
  if (API === PRODUCTION_API) return input;
  if (typeof input === "string" && input.startsWith(PRODUCTION_API)) {
    return API + input.slice(PRODUCTION_API.length);
  }
  if (input instanceof URL && input.href.startsWith(PRODUCTION_API)) {
    return API + input.href.slice(PRODUCTION_API.length);
  }
  return input;
}

function handleExpiredLogin(response) {
  const url = response.url || "";
  if (
    response.status === 401 &&
    url.startsWith(API) &&
    !url.includes("/auth/") &&
    localStorage.getItem("authToken")
  ) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    window.location.reload();
  }
  return response;
}

window.fetch = async (input, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("authToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return handleExpiredLogin(await nativeFetch(redirectLegacyApiUrl(input), { ...options, headers }));
};

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("authToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return handleExpiredLogin(await nativeFetch(`${API}${path.startsWith("/") ? path : "/" + path}`, {
    ...options,
    headers,
  }));
}

export function publicFetch(input, options = {}) {
  return nativeFetch(input, options);
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
