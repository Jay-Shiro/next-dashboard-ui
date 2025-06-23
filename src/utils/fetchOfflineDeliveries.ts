import { OfflineDeliveryResponse } from "@/app/(dashboard)/list/offline/types";

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  priority?: "high" | "low" | "auto";
  cache?: RequestCache;
  credentials?: RequestCredentials;
  filters?: Record<string, string | number | undefined>;
  timeout?: number; // in milliseconds
  forceRefresh?: boolean;
  retryCount?: number;
  retryDelay?: number; // in milliseconds
  page?: number;
  pageSize?: number;
}

/**
 * Optimized fetch function specifically for offline deliveries
 */
export async function fetchOfflineDeliveries(
  options: FetchOptions = {}
): Promise<OfflineDeliveryResponse> {
  // Set default options
  const {
    method = "GET",
    headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal,
    priority = "auto",
    cache = "default",
    credentials = "include",
    filters = {},
    timeout = 20000,
    forceRefresh = false,
    retryCount = 0,
    retryDelay = 1500,
    page = 1,
    pageSize = 10,
  } = options;

  // Create query params from filters
  const queryParams = new URLSearchParams();

  // Add all non-empty filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      queryParams.append(key, String(value));
    }
  });

  // Add pagination parameters
  queryParams.append("page", String(page));
  queryParams.append("limit", String(pageSize));

  // Add cache-busting parameter if needed
  if (forceRefresh) {
    queryParams.append("_t", Date.now().toString());
  }

  // Create abort controller if not provided
  let abortController: AbortController | undefined;
  let timeoutId: NodeJS.Timeout | undefined;

  if (!signal) {
    abortController = new AbortController();
    timeoutId = setTimeout(() => abortController?.abort(), timeout);
  }

  try {
    const response = await fetch(
      `/api/deliveries/offline?${queryParams.toString()}`,
      {
        method,
        headers,
        signal: signal || abortController?.signal,
        priority,
        cache: forceRefresh ? "no-store" : cache,
        credentials,
      }
    );

    // Clear timeout if we set one
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // If response isn't OK, handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        `Failed to fetch offline deliveries: ${response.statusText}`
      );

      // Add custom properties to the error
      (error as any).status = response.status;
      (error as any).details = errorData;

      throw error;
    }

    // Parse the response
    const data = await response.json();
    return data;
  } catch (error: any) {
    // Handle abort/timeout errors
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    // Handle retries for non-abort errors
    if (retryCount > 0) {
      console.log(`Will retry in ${retryDelay}ms (${retryCount} retries left)`);

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, retryDelay));

      // Retry with exponential backoff
      return fetchOfflineDeliveries({
        ...options,
        retryCount: retryCount - 1,
        retryDelay: retryDelay * 2,
      });
    }

    // No more retries, rethrow the error
    throw error;
  }
}
