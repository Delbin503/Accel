import axiosReq from "utils/axios";
import { useQuery, useMutation, useQueryClient } from "react-query";

/**
 * Fetch complete dashboard data
 * @param {Object} params - Query parameters
 * @returns {Promise} Dashboard data
 */
export const useDashboardQuery = (params = {}) => {
  const flatParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([k, v]) => {
        if (v !== undefined) flatParams[k] = v;
      });
    } else if (value !== undefined) {
      flatParams[key] = value;
    }
  });
  const queryParams = new URLSearchParams(flatParams).toString();

  return useQuery(
    ["dashboard", params],
    async () => {
      const { data } = await axiosReq.get(`/api/dashboard?${queryParams}`);
      return data.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 20000, // Consider data stale after 20 seconds
      onError: (error) => {
        console.error(
          "Dashboard fetch error:",
          error.response?.data?.message ?? "Failed to fetch dashboard data"
        );
      },
    }
  );
};

/**
 * Fetch camera statistics only
 * @returns {Promise} Camera stats
 */
export const useCameraStatsQuery = () => {
  return useQuery(
    ["dashboard-cameras"],
    async () => {
      const { data } = await axiosReq.get("/api/dashboard/cameras");
      return data.data;
    },
    {
      refetchInterval: 30000,
      onError: (error) => {
        console.error("Camera stats fetch error:", error.response?.data?.message);
      },
    }
  );
};

/**
 * Fetch event trends for charting
 * @param {string} timeRange - Time range (week, month, year)
 * @returns {Promise} Event trends
 */
export const useEventTrendsQuery = (timeRange = "month") => {
  return useQuery(
    ["dashboard-trends", timeRange],
    async () => {
      const { data } = await axiosReq.get(`/api/dashboard/trends?timeRange=${timeRange}`);
      return data.data;
    },
    {
      enabled: !!timeRange,
      staleTime: 60000, // Trends change less frequently
      onError: (error) => {
        console.error("Event trends fetch error:", error.response?.data?.message);
      },
    }
  );
};

/**
 * Fetch recent events with filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise} Recent events
 */
export const useRecentEventsQuery = (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();

  return useQuery(
    ["dashboard-events", filters],
    async () => {
      const { data } = await axiosReq.get(`/api/dashboard/events?${queryParams}`);
      return data.data;
    },
    {
      refetchInterval: 10000, // Events update frequently
      enabled: Object.keys(filters).length >= 0, // Always enabled
      onError: (error) => {
        console.error("Recent events fetch error:", error.response?.data?.message);
      },
    }
  );
};
