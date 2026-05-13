const mockAxios = {
  get: async () => ({ data: { data: [], total: 0, message: "ok" } }),
  post: async () => ({ data: { data: {}, message: "ok" } }),
  patch: async () => ({ data: { data: {}, message: "ok" } }),
  put: async () => ({ data: { data: {}, message: "ok" } }),
  delete: async () => ({ data: { data: {}, message: "ok" } }),
};

export default mockAxios;
