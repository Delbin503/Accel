import axiosReq from "utils/axios";
import { useQuery } from "react-query";

export const getAllAlerts = async ({ limit, skip, sortBy, sortOrder } = {}) => {
  const params = {};
  if (limit) params.limit = limit;
  if (skip) params.skip = skip;
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;
  const { data } = await axiosReq.get("/api/alerts", { params });
  
  return data;
};

export const useAllAlertsQuery = (options = {}) => {
  return useQuery(
    ["alerts", options],
    () => getAllAlerts(options),
    {
      refetchInterval: 30000,
      staleTime: 20000,
    }
  );
};

export const updateAlertView = async (uId) => {
  if (!uId) {
    return null;
  }

  const { data } = await axiosReq.patch(`/api/alerts/${uId}/view`);
  return data;
};

export const toggleAlertOpen = async (uId) => {
  if (!uId) {
    return null;
  }

  const { data } = await axiosReq.patch(`/api/alerts/${uId}/open`);
  return data;
};

export const markAllAlertsOpened = async () => {
  const { data } = await axiosReq.patch("/api/alerts/view/all");
  return data;
};

export const getNewAlerts = async () => {
  const { data } = await axiosReq.get("/api/alerts/new");
  return data;
};

export const useNewAlertsQuery = () => {
  return useQuery(
    ["newAlerts"],
    () => getNewAlerts(),
    {
      refetchInterval: 30000,
      staleTime: 20000,
    }
  );
};