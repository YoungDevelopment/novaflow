/**
 * Get the API base URL from environment variables
 * Defaults to /api if not set
 */
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
};

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint path (e.g., '/vendor/fetch-all-vendors')
 * @returns The full URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if baseUrl already has it
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${baseUrl}${baseUrl.endsWith("/") ? "" : "/"}${cleanEndpoint}`;
};
