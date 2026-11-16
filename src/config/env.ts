const defaultApiUrl = "http://localhost:8080";

export function normalizeApiUrl(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("VITE_API_URL must be a string");
  }
  const baseUrl = value.trim().replace(/\/+$/, "");
  if (baseUrl === "") {
    throw new Error("VITE_API_URL must not be blank");
  }
  return baseUrl;
}

export function readApiUrl(value: unknown): string {
  if (value === undefined || value === "") {
    return defaultApiUrl;
  }
  return normalizeApiUrl(value);
}

export const env = {
  apiUrl: readApiUrl(import.meta.env.VITE_API_URL),
};
