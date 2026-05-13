import axiosReq from "utils/axios";
import { mockSitesData, USE_MOCK_DATA } from "mocks/siteData";

/**
 * Get all sites with filters and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term
 * @param {string} params.status - Filter by status (Active/Inactive)
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort order (asc/desc)
 * @param {number} params.page - Page number
 * @param {number} params.pageSize - Items per page
 * @returns {Promise} - Sites data with pagination
 */
export const getSites = async (params = {}) => {
  // Return mock data in development
  if (USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    let filteredData = [...mockSitesData.data];

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredData = filteredData.filter(
        (site) =>
          site.siteName.toLowerCase().includes(searchLower) ||
          site.siteId.toLowerCase().includes(searchLower) ||
          site.siteCode.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (params.status && params.status !== "all") {
      filteredData = filteredData.filter(
        (site) => site.status.toLowerCase() === params.status.toLowerCase()
      );
    }

    // Apply sorting
    if (params.sortBy) {
      filteredData.sort((a, b) => {
        const aVal = a[params.sortBy];
        const bVal = b[params.sortBy];

        if (params.sortOrder === "desc") {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      });
    }

    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        totalCount: filteredData.length,
        totalPages: Math.ceil(filteredData.length / pageSize),
        currentPage: page,
        pageSize: pageSize,
      },
    };
  }

  // Real API call
  try {
    const response = await axiosReq.get(`/api/sitemanagement`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching sites:", error);
    throw error;
  }
};

/**
 * Get site by ID
 * @param {string} siteId - Site ID
 * @returns {Promise} - Site data
 */
export const getSiteById = async (siteId) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const site = mockSitesData.data.find((s) => s.uID === siteId);
    if (!site) {
      throw new Error("Site not found");
    }
    return { data: site };
  }

  try {
    const response = await axiosReq.get(`/api/sitemanagement/${siteId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching site:", error);
    throw error;
  }
};

/**
 * Create new site
 * @param {Object} siteData - Site data
 * @returns {Promise} - Created site data
 */
export const createSite = async (siteData) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { ...siteData, uID: `site-${Date.now()}` } };
  }

  try {
    const response = await axiosReq.post(`/api/sitemanagement`, siteData);
    return response.data;
  } catch (error) {
    console.error("Error creating site:", error);
    throw error;
  }
};

/**
 * Update site
 * @param {string} siteId - Site ID
 * @param {Object} siteData - Updated site data
 * @returns {Promise} - Updated site data
 */
export const updateSite = async (siteId, siteData) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { data: { ...siteData, uID: siteId } };
  }

  try {
    const response = await axiosReq.put(`/api/sitemanagement/${siteId}`, siteData);
    return response.data;
  } catch (error) {
    console.error("Error updating site:", error);
    throw error;
  }
};

/**
 * Delete site
 * @param {string} siteId - Site ID
 * @returns {Promise}
 */
export const deleteSite = async (siteId) => {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  }

  try {
    const response = await axiosReq.delete(`/api/sitemanagement/${siteId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting site:", error);
    throw error;
  }
};
