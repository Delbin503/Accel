import { useMutation, useQuery } from "react-query";
import axiosReq from "utils/axios";
import { USE_MOCK_DATA, mockRecordingsData } from "mocks/recordingData";

// Get recordings with filters
export const useGetRecordingsQuery = (params = {}) => {
  const {
    page = 1,
    limit = 12,
    search = "",
    siteLocation = "",
    areas = [],
    cameras = [],
    startDate = "",
    endDate = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  return useQuery(
    [
      "recordings",
      page,
      limit,
      search,
      siteLocation,
      areas,
      cameras,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ],
    async () => {
      // Use mock data for development
      if (USE_MOCK_DATA) {
        console.log(
          "%c🎭 Using MOCK DATA for recordings",
          "background: #ff6b35; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
        );

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Filter mock data based on search
        let filteredData = [...mockRecordingsData.data];

        if (search) {
          filteredData = filteredData.filter(
            (item) =>
              item.recordingId?.toLowerCase().includes(search.toLowerCase()) ||
              item.title?.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (siteLocation) {
          filteredData = filteredData.filter(
            (item) =>
              item.siteLocation?.toLowerCase() === siteLocation.toLowerCase()
          );
        }

        if (areas && areas.length > 0) {
          filteredData = filteredData.filter((item) =>
            areas.includes(item.area)
          );
        }

        if (cameras && cameras.length > 0) {
          filteredData = filteredData.filter((item) =>
            cameras.includes(item.camera)
          );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        return {
          data: paginatedData,
          pagination: {
            totalCount: filteredData.length,
            totalPages: Math.ceil(filteredData.length / limit),
            currentPage: page,
            pageSize: limit,
          },
        };
      }

      // Real API call
      const { data } = await axiosReq.get(`/api/recordings/query`, {
        params: {
          page,
          limit,
          search,
          siteLocation,
          areas: Array.isArray(areas) ? areas.join(",") : areas,
          cameras: Array.isArray(cameras) ? cameras.join(",") : cameras,
          startDate,
          endDate,
          sortBy,
          sortOrder,
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

// Get single recording by ID
export const useGetRecordingByIdQuery = (uId, options = {}) => {
  return useQuery(
    ["recording", uId],
    async () => {
      const { data } = await axiosReq.get(`/api/recordings/${uId}`);
      return data;
    },
    {
      enabled: !!uId,
      ...options,
    }
  );
};

// Delete recording
export const useDeleteRecordingMutation = () => {
  return useMutation(async (uId) => {
    const res = await axiosReq.delete(`/api/recordings/${uId}`);
    return res;
  });
};

// Download recording
export const useDownloadRecordingMutation = () => {
  return useMutation(async (uId) => {
    const res = await axiosReq.get(`/api/recordings/${uId}/download`, {
      responseType: "blob",
    });
    return res;
  });
};

// Get recording statistics
export const useGetRecordingStatsQuery = (params = {}) => {
  return useQuery(
    ["recording-stats", params],
    async () => {
      const { data } = await axiosReq.get(`/api/recordings/stats`, {
        params,
      });
      return data;
    },
    {
      staleTime: 60000, // 1 minute
    }
  );
};
