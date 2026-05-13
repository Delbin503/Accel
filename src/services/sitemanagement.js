import axiosReq from "utils/axios";
import { useQuery } from "react-query";
import { useMemo } from "react";

export const useGetStationsQuery = (queryParams = {}) => {
  const queryKey = useMemo(
    () => ["stations", JSON.stringify(queryParams)],
    [queryParams]
  );

  return useQuery(
    queryKey,
    async () => {
      const queryString = new URLSearchParams(queryParams).toString();
      const { data } = await axiosReq.get(
        `/api/sitemanagement/station${queryString ? `?${queryString}` : ""}`
      );
      return data;
    },
    {
      keepPreviousData: true,
      staleTime: 5000,
    }
  );
};

export const useGetLanes = () => {
  return useQuery(
    ["lanes"],
    async () => {
      const { data } = await axiosReq.get(`/api/sitemanagement/lane`);
      return data;
    },
    {
      keepPreviousData: true,
      staleTime: 5000,
    }
  );
};
