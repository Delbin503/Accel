import { useMutation, useQuery } from "react-query";
import axiosReq from "utils/axios";

/**
 * NVR Service
 * API calls for NVR-specific operations using /api/nvr endpoints
 */

// Create NVR
export const useCreateNVRMutation = () => {
  try {
    return useMutation(async (payload) => {
      const res = await axiosReq.post(`/api/nvr`, payload);
      return res;
    });
  } catch (err) {
    console.log(err);
  }
};

// Get all NVRs with filters and pagination
export const useGetNVRsQuery = (params = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    siteLocation = "",
    area = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  return useQuery(
    [
      "nvrs",
      page,
      limit,
      search,
      siteLocation,
      area,
      status,
      sortBy,
      sortOrder,
    ],
    async () => {
      const { data } = await axiosReq.get(`/api/nvr/query`, {
        params: {
          page,
          limit,
          search,
          siteLocation,
          area,
          status,
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

// Get NVR by ID
export const useGetNVRByIdQuery = (uId, options = {}) => {
  return useQuery(
    ["nvr", uId],
    async () => {
      const { data } = await axiosReq.get(`/api/nvr/${uId}`);
      return data;
    },
    {
      enabled: !!uId,
      ...options,
    }
  );
};

// Update NVR
export const useUpdateNVRMutation = () => {
  return useMutation(async ({ uId, payload }) => {
    const res = await axiosReq.put(`/api/nvr/${uId}`, payload);
    return res;
  });
};

// Delete NVR
export const useDeleteNVRMutation = () => {
  return useMutation(async (uId) => {
    const res = await axiosReq.delete(`/api/nvr/${uId}`);
    return res;
  });
};

// Get NVR channels with connected cameras
export const useGetNVRChannelsQuery = (nvrUID, options = {}) => {
  return useQuery(
    ["nvr-channels", nvrUID],
    async () => {
      const { data } = await axiosReq.get(`/api/nvr/${nvrUID}/channels`);
      return data;
    },
    {
      enabled: !!nvrUID,
      ...options,
    }
  );
  
};

export const useCheckNVRExistName = () => {
  return async (name) => {
    if (!name) return false;
    try {
      const res = await axiosReq.get(`/api/nvr/check-name/${encodeURIComponent(name)}`);
      
      return res.data?.exists || false;
    } catch (err) {
      return false;
    }
  };
};
