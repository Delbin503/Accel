import { useState, useEffect, useRef } from "react";
import { useGetLanes, useGetStationsQuery } from "services/sitemanagement";
import { useGetCamerasQuery, useGetCameraByIdQuery } from "services/camera";
import { useGetNVRsQuery, useGetNVRByIdQuery } from "services/nvr";
import { successAlert, errorAlert } from "components/common/Toast";

/**
 * Custom hook for managing device state and operations
 * Shared between Camera and NVR device pages
 *
 * @param {string} deviceType - Type of device: "CAM" or "NVR"
 * @returns {object} State and handlers for device management
 */
export const useDeviceManagement = (deviceType) => {
  // Modal and panel state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedPanelMenu, setSelectedPanelMenu] = useState("overview");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Filter state
  const [siteOptions, setSiteOptions] = useState([]);
  const hasInitializedSiteOptions = useRef(false);

  const [filters, setFilters] = useState({
    siteLocation: null,
    area: [],
    search: "",
  });

  // Applied filters - only updated when Search is clicked
  const [appliedFilters, setAppliedFilters] = useState({
    siteLocation: null,
    area: [],
    search: "",
  });

  // Get Stations (Areas)
  const { data: dataStationsQuery } = useGetStationsQuery({
    entityPerPage: 999,
    pageNum: 1,
  });

  // Get Lanes
  const { data: dataLanes } = useGetLanes();

  // Get Devices or NVRs based on device type
  const useDeviceQuery = deviceType === "NVR" ? useGetNVRsQuery : useGetCamerasQuery;
  const useDeviceByIdQuery = deviceType === "NVR" ? useGetNVRByIdQuery : useGetCameraByIdQuery;

  const {
    data: dataDevice,
    refetch: refetchDevices,
    isLoading: isLoadingDevices,
  } = useDeviceQuery({
    page: currentPage,
    limit: pageSize,
    search: appliedFilters.search,
    deviceType: deviceType === "NVR" ? undefined : deviceType, // Don't send deviceType for NVR endpoint
    siteLocation: appliedFilters.siteLocation?.label || "",
    area: appliedFilters.area?.length > 0 ? appliedFilters.area.map((a) => a.value).join(",") : "",
  });

  // Get Device By ID (for slide panel detail)
  const {
    data: deviceDetailData,
    isLoading: isLoadingDeviceDetail,
    refetch: refetchDeviceDetail,
  } = useDeviceByIdQuery(selectedDeviceId, {
    enabled: !!selectedDeviceId,
  });

  // Update selectedDevice when device detail is loaded
  useEffect(() => {
    if (deviceDetailData?.data) {
      setSelectedDevice(deviceDetailData.data);
    }
    
  }, [deviceDetailData]);

  // Area and lane options for filters
  const areaOptions = dataStationsQuery?.data.map((station) => ({
    value: station.uID,
    label: station.name,
  }));

  const laneOptions = dataLanes?.data.map((lane) => ({
    value: lane.uID,
    label: lane.name,
    areaID: lane.stationID,
  }));

  // Initialize site options from device data
  useEffect(() => {
    if (dataDevice?.data && !hasInitializedSiteOptions.current) {
      const uniqueSiteOptions = [
        ...new Map(
          dataDevice.data.map((v) => [
            v.siteLocation,
            {
              value: v.siteLocation,
              label: v.siteLocation,
            },
          ])
        ).values(),
      ];

      setSiteOptions(uniqueSiteOptions);
      hasInitializedSiteOptions.current = true;
    }
  }, [dataDevice]);

  // Handle search filter - apply filters only on click
  const handleSearch = () => {
    if (!filters.siteLocation && (!filters.area || filters.area.length === 0) && !filters.search) {
      errorAlert("Please fill in at least one filter field before searching.", "Validation Error");
      return;
    }
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
    successAlert(
      "Filter Applied",
      "Your device list has been updated based on the selected filters.",
      3000
    );
  };

  // Handle reset filters
  const handleReset = () => {
    const resetFilters = {
      siteLocation: null,
      area: [],
      search: "",
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setCurrentPage(1);
  };

  // Handle opening device detail
  const handleOpenDeviceDetail = (deviceId) => {
    setSelectedDeviceId(deviceId);
    setSelectedPanelMenu("overview");
    setIsSlidePanelOpen(true);
  };

  // Handle closing device detail
  const handleCloseDeviceDetail = () => {
    setIsSlidePanelOpen(false);
    setSelectedDevice(null);
    setSelectedDeviceId(null);
    refetchDevices();
  };

  // Handle modal
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    refetchDevices();
  };

  return {
    // Modal state
    isModalOpen,
    handleOpenModal,
    handleCloseModal,

    // Slide panel state
    isSlidePanelOpen,
    selectedDevice,
    selectedPanelMenu,
    setSelectedPanelMenu,
    handleOpenDeviceDetail,
    handleCloseDeviceDetail,

    // Pagination
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,

    // Filters
    filters,
    setFilters,
    siteOptions,
    areaOptions,
    laneOptions,
    handleSearch,
    handleReset,

    // Device data
    dataDevice,
    refetchDevices,
    refetchDeviceDetail,
    isLoadingDevices,
    isLoadingDeviceDetail,
    setSelectedDevice,
  };
};
