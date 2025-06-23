import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  OfflineDelivery,
  OfflineDeliveryResponse,
} from "@/app/(dashboard)/list/offline/types";

interface UseOfflineDeliveriesOptions {
  pageSize?: number;
  autoRefreshInterval?: number | null;
  initialLoad?: boolean;
  onUserLoad?: (userId: string) => Promise<void>;
  onRiderLoad?: (riderId: string) => Promise<void>;
  userMap?: Record<string, any>;
  riderMap?: Record<string, any>;
}

interface UseOfflineDeliveriesFilters {
  user_id?: string;
  rider_id?: string;
  payment_status?: string;
  from_date?: string;
  to_date?: string;
  [key: string]: string | undefined;
}

interface UseOfflineDeliveriesResult {
  deliveries: OfflineDelivery[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  hasMoreData: boolean;
  isAutoRefresh: boolean;
  filters: UseOfflineDeliveriesFilters;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: UseOfflineDeliveriesFilters) => void;
  resetFilters: () => void;
  setIsAutoRefresh: (value: boolean) => void;
}

const MAX_RETRY_COUNT = 2;

/**
 * Custom hook for working with offline deliveries with performance optimizations
 */
export default function useOfflineDeliveries({
  pageSize = 10,
  autoRefreshInterval = 30000, // 30 seconds
  initialLoad = true,
  onUserLoad,
  onRiderLoad,
  userMap = {},
  riderMap = {},
}: UseOfflineDeliveriesOptions): UseOfflineDeliveriesResult {
  const [deliveries, setDeliveries] = useState<OfflineDelivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(false);

  const [filters, setFiltersState] = useState<UseOfflineDeliveriesFilters>({
    user_id: "",
    rider_id: "",
    payment_status: "",
    from_date: "",
    to_date: "",
  });

  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process delivery data from API response - defining this function first
  const processDeliveryData = useCallback(
    (data: OfflineDeliveryResponse): OfflineDelivery[] => {
      // Extract deliveries array from response
      let deliveriesData: any[] = [];
      if (data.offline_deliveries && Array.isArray(data.offline_deliveries)) {
        deliveriesData = data.offline_deliveries;
      } else if (data.deliveries && Array.isArray(data.deliveries)) {
        deliveriesData = data.deliveries;
      } else if (Array.isArray(data)) {
        deliveriesData = data;
      }

      // Process each delivery to ensure correct structure
      return deliveriesData.map((delivery: any) => {
        // Ensure every delivery has an id field
        const id = delivery.id || delivery._id || "";

        // Process location fields to ensure correct format
        const startpoint =
          typeof delivery.startpoint === "string"
            ? { address: delivery.startpoint, latitude: 0, longitude: 0 }
            : delivery.startpoint;

        const endpoint =
          typeof delivery.endpoint === "string"
            ? { address: delivery.endpoint, latitude: 0, longitude: 0 }
            : delivery.endpoint;

        // Ensure status object exists
        const status = delivery.status || {
          current: delivery.status_text || "completed",
          timestamp: delivery.last_updated || new Date().toISOString(),
        };

        // Handle user and rider information with better defaults
        let user = delivery.user;
        if (!user && delivery.user_id) {
          user = {
            id: delivery.user_id,
            name: userMap[delivery.user_id]?.name || "Unknown User",
            email: userMap[delivery.user_id]?.email,
            phone: userMap[delivery.user_id]?.phone,
          };

          // Fetch user details if not in map
          if (!userMap[delivery.user_id] && onUserLoad) {
            onUserLoad(delivery.user_id);
          }
        }

        let rider = delivery.rider;
        if (!rider && delivery.rider_id) {
          rider = {
            id: delivery.rider_id,
            name: riderMap[delivery.rider_id]?.name || "Unknown Rider",
            email: riderMap[delivery.rider_id]?.email,
            phone: riderMap[delivery.rider_id]?.phone,
            vehicle_type:
              riderMap[delivery.rider_id]?.vehicle_type ||
              riderMap[delivery.rider_id]?.vehicletype,
          };

          // Fetch rider details if not in map
          if (!riderMap[delivery.rider_id] && onRiderLoad) {
            onRiderLoad(delivery.rider_id);
          }
        }

        // Ensure consistent field naming
        if (rider && rider.vehicletype && !rider.vehicle_type) {
          rider.vehicle_type = rider.vehicletype;
        }

        return {
          ...delivery,
          id,
          startpoint,
          endpoint,
          status,
          user,
          rider,
        };
      });
    },
    [onRiderLoad, onUserLoad, riderMap, userMap]
  );

  // Update counts and pagination state from response - defining this function second
  const updateCountsFromResponse = useCallback(
    (data: OfflineDeliveryResponse, itemCount: number, loadMore: boolean) => {
      // Update total count if provided in API response
      if (data.total !== undefined) {
        setTotalCount(data.total);
      } else {
        // Fallback if total not provided
        setTotalCount(
          loadMore
            ? Math.max(deliveries.length + itemCount, totalCount)
            : itemCount
        );
      }

      // Check if we have more data to load based on API response
      if (data.pagination?.hasMore !== undefined) {
        setHasMoreData(data.pagination.hasMore);
      } else {
        // Fallback: assume we have more if we got a full page
        setHasMoreData(itemCount >= pageSize);
      }
    },
    [deliveries.length, pageSize, totalCount]
  );

  // Main fetch function - now can safely use the above helper functions
  const fetchDeliveries = useCallback(
    async (retryCount = 0, loadMore = false) => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 20000); // 20 second timeout

      try {
        if (!loadMore) setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();

        // Add current filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });

        // Add pagination parameters
        const currentPage = loadMore ? page + 1 : 1;
        if (loadMore) setPage(currentPage);

        queryParams.append("page", currentPage.toString());
        queryParams.append("limit", pageSize.toString());

        // Force refresh for initial load or retries
        if (!loadMore && retryCount === 0) {
          queryParams.append("_t", Date.now().toString());
        }

        // No cache lookup - always fetch fresh data

        // Set priority based on whether it's initial load or pagination
        const priority = !loadMore ? "high" : "auto";

        // Make request with abort controller - no caching
        const response = await fetch(
          `/api/deliveries/offline?${queryParams.toString()}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store", // Always no-cache as requested
            method: "GET",
            signal: abortControllerRef.current?.signal,
            priority,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error details:", errorData);
          throw new Error(
            `Failed to fetch offline deliveries: ${response.statusText}`
          );
        }

        const data: OfflineDeliveryResponse = await response.json();

        // No caching - data is always fresh

        // Check for stale data warning
        if (data._staleData && data._error) {
          console.warn("Using stale data:", data._error);
          toast.error("Using cached data due to API error");
        }

        const processedDeliveries = processDeliveryData(data);

        // For pagination, append data rather than replacing
        if (loadMore) {
          setDeliveries((prev) => [...prev, ...processedDeliveries]);
        } else {
          setDeliveries(processedDeliveries);
        }

        updateCountsFromResponse(data, processedDeliveries.length, loadMore);

        // Success notification for empty load more
        if (processedDeliveries.length === 0 && loadMore) {
          setHasMoreData(false);
          toast.success("All deliveries loaded");
        }
      } catch (err: any) {
        console.error("Error fetching offline deliveries:", err);
        clearTimeout(timeoutId);

        if (err.name === "AbortError") {
          console.log("Request was aborted due to timeout");
          toast.error("Request took too long and was cancelled");
          setError("Request timed out. Please try again.");
        } else if (retryCount < MAX_RETRY_COUNT) {
          // Retry with exponential backoff
          const delay = 1000 * Math.pow(2, retryCount);
          console.log(
            `Will retry in ${delay}ms (attempt ${retryCount + 1}/${
              MAX_RETRY_COUNT + 1
            })`
          );

          setTimeout(() => {
            fetchDeliveries(retryCount + 1, loadMore);
          }, delay);
        } else {
          setError(err.message || "Failed to load offline deliveries");
          toast.error(
            "Failed to load offline deliveries after multiple attempts"
          );
        }
      } finally {
        if (
          (retryCount >= MAX_RETRY_COUNT || !loadMore) &&
          abortControllerRef.current?.signal.aborted === false
        ) {
          setIsLoading(false);
        }
      }
    },
    [filters, page, pageSize, processDeliveryData, updateCountsFromResponse]
  );

  // Load more deliveries
  const loadMore = useCallback(async () => {
    if (!isLoading && hasMoreData) {
      await fetchDeliveries(0, true);
    }
  }, [fetchDeliveries, hasMoreData, isLoading]);

  // Refresh current data
  const refresh = useCallback(async () => {
    await fetchDeliveries(0, false);
  }, [fetchDeliveries]);

  // Update filters and reset pagination
  const setFilters = useCallback((newFilters: UseOfflineDeliveriesFilters) => {
    setFiltersState(newFilters);
    setPage(1); // Reset to first page
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFiltersState({
      user_id: "",
      rider_id: "",
      payment_status: "",
      from_date: "",
      to_date: "",
    });
    setPage(1); // Reset to first page
  }, []);

  // Handle auto-refresh
  useEffect(() => {
    if (
      isAutoRefresh &&
      !autoRefreshIntervalRef.current &&
      autoRefreshInterval
    ) {
      // Start auto-refresh
      autoRefreshIntervalRef.current = setInterval(() => {
        console.log("Auto-refreshing deliveries list...");
        fetchDeliveries(0, false);
      }, autoRefreshInterval);
    } else if (!isAutoRefresh && autoRefreshIntervalRef.current) {
      // Clear interval when auto-refresh is turned off
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isAutoRefresh, fetchDeliveries, autoRefreshInterval]);

  // Initial data fetch on mount or filter change
  useEffect(() => {
    if (initialLoad) {
      fetchDeliveries(0, false);
    }

    // No prefetching needed since we're not using cache
  }, [fetchDeliveries, initialLoad]);

  return {
    deliveries,
    isLoading,
    error,
    totalCount,
    page,
    hasMoreData,
    isAutoRefresh,
    filters,
    loadMore,
    refresh,
    setFilters,
    resetFilters,
    setIsAutoRefresh,
  };
}
