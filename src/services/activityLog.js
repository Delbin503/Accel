import { useQuery } from "react-query";
import axiosReq from "utils/axios";

export const useGetActivityLogsQuery = (params = {}) => {
  const {
    page = 1,
    limit = 50,
    search = "",
    username = "",
    nric = "",
    type = "",
    module = "",
    deviceType = "",
    siteLocation = "",
    area = "",
    startDate = "",
    endDate = "",
  } = params;

  return useQuery(
    [
      "activityLogs",
      page,
      limit,
      search,
      username,
      nric,
      type,
      module,
      deviceType,
      siteLocation,
      area,
      startDate,
      endDate,
    ],
    async () => {
      const { data } = await axiosReq.get(`/api/activityLogs`, {
        params: {
          page,
          limit,
          search,
          username,
          nric,
          type,
          module,
          deviceType,
          siteLocation,
          area,
          startDate,
          endDate,
        },
      });
      return data;
    },
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );
};
