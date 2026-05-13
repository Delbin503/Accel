import { useMutation, useQuery } from "react-query";
import axiosReq from "utils/axios";

export const useStartRtsp = () => {
  return useMutation({
    mutationFn: async (deviceID) => {
      if (!deviceID) {
        throw new Error("Device ID is required");
      }

      const { data } = await axiosReq.get(`/api/rtsp/start/${deviceID}`);

      return data;
    },
    onSuccess: (data) => {
      console.log("[RTSP] Stream started", data);
    },
    onError: (error) => {
      console.error("[RTSP] Failed to start stream", error);
    },
  });
};

export const useStopRtsp = () => {
  return useMutation({
    mutationFn: async (deviceID) => {
      if (!deviceID) return;
      const { data } = await axiosReq.get(`/api/rtsp/stop/${deviceID}`);
      return data;
    },
    onSuccess: (data) => {
      console.log("Stream stopped successfully", data);
    },
    onError: (err) => {
      console.error("Failed to stop RTSP", err);
    },
  });
};

export const useTestConnection = (deviceID, options = {}) => {
  try {
    return useQuery(["start-rtsp", deviceID], async () => {
      const { data } = await axiosReq.get(`/api/rtsp/test-connection/${deviceID}`);
      // console.log("data", data?.data);

      return data;
    }, {
      enabled: !!deviceID,
      ...options,
    });
  } catch (err) {
    // console.log(err);
    return null;
  }
};

export const checkStreamReachable = async (payload) => {
  try {
    const { data } = await axiosReq.post(`/api/rtsp/check-stream-reachable`, payload);
    return data;
  } catch (err) {
    return null;
  }
};

export const getRtspFrame = async (payload) => {
  try {
    if (!payload?.rtspStreamLink) throw new Error("rtspStreamLink is required");
    const { data } = await axiosReq.post(`/api/rtsp/get-frame`, payload);
    return data;
  } catch (err) {
    console.error("[RTSP] Failed to get frame", err);
    return null;
  }
};
