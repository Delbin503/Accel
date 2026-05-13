import { useMutation, useQuery } from "react-query";
import axiosReq from "utils/axios";
import { USE_MOCK_DATA, mockCamerasData } from "mocks/recordingData";

// import { alertError, alertSuccess } from "./alert";

export const useCheckCameraExistName = () => {
  return async (name) => {
    if (!name) return false;
    try {
      const res = await axiosReq.get(`/api/cameras/check-name/${encodeURIComponent(name)}`);

      return res.data?.exists || false;
    } catch (err) {
      return false;
    }
  };
};

export const useCreateCameraMutation = () => {
  try {
    return useMutation(async (payload) => {
      const res = await axiosReq.post(`/api/cameras`, payload);
      return res;
    });
  } catch (err) {
    console.log(err);
  }
};

export const useGetCamerasQuery = (params = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    deviceType = "",
    siteLocation = "",
    area = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  return useQuery(
    ["devices", page, limit, search, deviceType, siteLocation, area, status, sortBy, sortOrder],
    async () => {
      // Use mock data for development (cameras only)
      if (USE_MOCK_DATA && deviceType === "CAM") {
        console.log(
          "%c📹 Using MOCK DATA for cameras",
          "background: #4ecdc4; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
        );

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Filter mock cameras data
        let filteredData = [...mockCamerasData.data];

        if (search) {
          filteredData = filteredData.filter((item) =>
            item.name?.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (siteLocation) {
          filteredData = filteredData.filter(
            (item) => item.siteLocation?.toLowerCase() === siteLocation.toLowerCase()
          );
        }

        if (area) {
          filteredData = filteredData.filter((item) => item.area === area);
        }

        if (status) {
          filteredData = filteredData.filter((item) => item.status === status);
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
      const { data } = await axiosReq.get(`/api/cameras/query`, {
        params: {
          page,
          limit,
          search,
          deviceType,
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

export const useGetCameraByIdQuery = (uId, options = {}) => {
  return useQuery(
    ["device", uId],
    async () => {
      const { data } = await axiosReq.get(`/api/cameras/${uId}`);
      return data;
    },
    {
      enabled: !!uId,
      ...options,
    }
  );
};

export const useUpdateCameraMutation = () => {
  return useMutation(async ({ uId, payload }) => {
    const res = await axiosReq.put(`/api/cameras/${uId}`, payload);
    return res;
  });
};

export const useDeleteCameraMutation = () => {
  return useMutation(async (uId) => {
    const res = await axiosReq.delete(`/api/cameras/${uId}`);
    return res;
  });
};

export const useLinkCameraNVRMutation = () => {
  return useMutation(async ({ cameraUID, payload }) => {
    const res = await axiosReq.patch(`/api/cameras/${cameraUID}/link-nvr`, payload);
    return res;
  });
};

export const useUnlinkCameraNVRMutation = () => {
  return useMutation(async (cameraUID) => {
    const res = await axiosReq.delete(`/api/cameras/${cameraUID}/unlink-nvr`);
    return res;
  });
};

export const useToggleGetFrameMutation = () => {
  return useMutation(async (uId) => {
    const res = await axiosReq.get(`/api/cameras/toggle-get-frame/${uId}`);
    return res;
  });
};

export const useToggleIsStreamingMutation = () => {
  return useMutation(async (uId) => {
    const res = await axiosReq.get(`/api/cameras/toggle-is-streaming/${uId}`);
    return res;
  });
};

export const useGetBase64FrameMutation = () => {
  return useMutation(async (uId) => {
    const res = await axiosReq.get(`/api/cameras/${uId}`);
    return res.data?.data?.base64frame || null;
  });
};
