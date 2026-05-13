import axiosReq from "utils/axios";
import { useMutation, useQueryClient } from "react-query";

// Login API call

export const useLoginUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (payload) => {
      const { data } = await axiosReq.post(`/api/auth/login`, payload);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("UserList");
      },
      onError: (error) => {
        console.log(error.response?.data?.message ?? "Failed to Login");
      },
    }
  );
};

// Logout API call (optional - if backend needs to invalidate token)
export const logoutUser = async () => {
  try {
    await axiosReq.post("/api/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Verify token API call
export const verifyToken = async () => {
  try {
    const { data } = await axiosReq.get("/api/auth/verify");
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Token verification failed" };
  }
};

// Refresh token API call
export const refreshToken = async () => {
  try {
    const { data } = await axiosReq.post("/api/auth/refresh");
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Token refresh failed" };
  }
};
