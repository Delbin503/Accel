import React, { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "components/common/Button";
import Badge from "components/common/Badge";
import AddCameraModal from "components/devices/AddCameraModal";
import AddNVRDeviceModal from "components/devices/AddNVRDeviceModal";
import Table from "components/common/Table";
import SlidePanel from "components/common/SlidePanel";
import { useGetLanes, useGetStationsQuery } from "services/sitemanagement";
import { useGetCamerasQuery, useGetCameraByIdQuery } from "services/camera";
import { cn } from "utils/common";
import { successAlert } from "components/common/Toast";
import { useLocation } from "react-router-dom";

import CameraOverview from "./components/DeviceOverview";
import DeviceNVROverview from "./components/DeviceNVROverview";
import DeviceRecordings from "./components/DeviceRecordings";
import DeviceChannelManagement from "../nvr-devices/DeviceChannelManagement";
import DeviceSettingsForm from "./components/DeviceSettingsForm";
import DeviceNVRSettings from "../nvr-devices/DeviceNVRSettings";
import DeviceFilters from "./components/DeviceFilters";
import { getDeviceTableColumns, getNVRDeviceTableColumns } from "./components/DeviceTableColumns";

const DeviceSetup = () => {
  const location = useLocation();
  const isNVRPage = location.pathname === "/nvr-devices";
  const deviceType = isNVRPage ? "NVR" : "CAM";
  const pageTitle = isNVRPage ? "NVR Devices" : "Cameras";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [siteOptions, setSiteOptions] = useState([]);
  const [selectedPanelMenu, setSelectedPanelMenu] = useState("overview");
  const hasInitializedSiteOptions = useRef(false);

  // Conditional tabs based on device type
  const panelMenus =
    selectedDevice?.deviceType === "NVR" || selectedDevice?.type === "NVR"
      ? ["overview", "channel management", "settings"]
      : ["overview", "recordings", "settings"];

  const [filters, setFilters] = useState({
    siteLocation: null,
    area: [],
    search: "",
  });

  // Applied filters - only update when Search is clicked
  const [appliedFilters, setAppliedFilters] = useState({
    siteLocation: null,
    area: [],
    search: "",
  });

  // Get Stations
  const { data: dataStationsQuery } = useGetStationsQuery({
    entityPerPage: 999,
    pageNum: 1,
  });

  // Get Lanes
  const { data: dataLanes } = useGetLanes();

  // Get Devices (Cameras or NVR based on route)
  const {
    data: dataDevice,
    refetch: refetchDevices,
    isLoading: isLoadingDevices,
  } = useGetCamerasQuery({
    page: currentPage,
    limit: pageSize,
    search: appliedFilters.search,
    deviceType: deviceType,
    siteLocation: appliedFilters.siteLocation?.label || "",
    area: appliedFilters.area?.length > 0 ? appliedFilters.area.map((a) => a.value).join(",") : "",
  });

  // Get Device By ID (for slide panel detail)
  const { data: deviceDetailData, isLoading: isLoadingDeviceDetail } = useGetCameraByIdQuery(
    selectedDeviceId,
    {
      enabled: !!selectedDeviceId,
    }
  );

  // Update selectedDevice when device detail is loaded
  useEffect(() => {
    if (deviceDetailData?.data) {
      setSelectedDevice(deviceDetailData.data);
    }
  }, [deviceDetailData]);

  const areaOptions = dataStationsQuery?.data.map((station) => ({
    value: station.uID,
    label: station.name,
  }));

  const laneOptions = dataLanes?.data.map((lane) => ({
    value: lane.uID,
    label: lane.name,
    areaID: lane.stationID,
  }));

  // getting the site option for the first time
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

  // Handle search
  const handleSearch = () => {
    setAppliedFilters(filters);
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

  // Transform API data to table format
  const devices =
    dataDevice?.data?.map((device) => {
      if (isNVRPage) {
        // NVR devices transformation
        let displayStatus = "Offline";
        if (device.status?.toLowerCase() === "online") {
          displayStatus = "Live";
        } else if (device.storageStatus?.toLowerCase() === "full") {
          displayStatus = "Storage Full";
        } else if (device.status?.toLowerCase() === "offline") {
          displayStatus = "Offline";
        }

        // Format Number of Channels: "12 / 24 Channels"
        const activeChannels = device.activeChannels || 0;
        const totalChannels = device.totalChannels || 0;
        const numberOfChannels = (
          <span>
            <span className="text-green-500">{activeChannels}</span> / {totalChannels} Channels
          </span>
        );

        return {
          ...device,
          id: device.uID || device._id,
          name: device.name,
          status: displayStatus,
          numberOfChannels: numberOfChannels,
          nvrStorage: device.storagePercentage ? `${device.storagePercentage}%` : "0%",
          siteLocation: device.siteLocation,
          area: device.area,
          lastActive: device.updatedAt
            ? new Date(device.updatedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            : "N/A",
        };
      } else {
        // Camera devices transformation (existing)
        let displayStatus = "Offline";
        if (device.status?.toLowerCase() === "online") {
          displayStatus = "Live";
        } else if (device.status?.toLowerCase() === "disconnected") {
          displayStatus = "Disconnected";
        }

        return {
          ...device,
          id: device.uID || device._id,
          name: device.name,
          status: displayStatus,
          deviceType: device.type,
          ipAddress: device.ipAddress,
          nvrRecordingStatus: device.nvrRecordingStatus || "Not Configured",
          siteLocation: device.siteLocation,
          area: device.area,
          lane: device.lane,
          lanes: device.lane?.length
            ? `${device.lane.length} Lane${device.lane.length > 1 ? "s" : ""}`
            : "0 Lane",
          lastActive: device.updatedAt
            ? new Date(device.updatedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })
            : "N/A",
        };
      }
    }) || [];

  const columns = isNVRPage ? getNVRDeviceTableColumns() : getDeviceTableColumns();

  const renderActions = (row) => (
    <button
      className="flex w-full items-center justify-center  text-gray-400 transition-colors hover:text-white"
      onClick={() => {
        setSelectedDeviceId(row.id);
        setSelectedPanelMenu("overview");
        setIsSlidePanelOpen(true);
      }}
    >
      <div className="rounded-md border border-neutral-700 p-1">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-surface p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">{pageTitle}</h1>
        <PrimaryButton onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Device</span>
        </PrimaryButton>
      </div>

      {/* Filters */}
      <DeviceFilters
        filters={filters}
        setFilters={setFilters}
        siteOptions={siteOptions}
        areaOptions={areaOptions}
        handleSearch={handleSearch}
        handleReset={handleReset}
      />

      {/* Table */}
      {isLoadingDevices ? (
        <div className="flex h-64 items-center justify-center">
          <span className="text-textSecondary">Loading devices...</span>
        </div>
      ) : (
        <Table
          columns={columns}
          data={devices}
          renderActions={renderActions}
          pagination={true}
          manualPagination={true}
          totalCount={dataDevice?.pagination?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          initialPageSize={pageSize}
          headerCellClassName="!text-textPrimary text-base font-normal"
          rowClassName="!text-textPrimary"
        />
      )}

      {/* Add Device Modal - Different modal based on route */}
      {isNVRPage ? (
        <AddNVRDeviceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            refetchDevices();
          }}
          areaOptions={areaOptions}
          laneOptions={laneOptions}
        />
      ) : (
        <AddCameraModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            refetchDevices();
          }}
          areaOptions={areaOptions}
          laneOptions={laneOptions}
        />
      )}

      {/* Device Details Slide Panel */}
      <SlidePanel
        isOpen={isSlidePanelOpen}
        onClose={() => {
          setIsSlidePanelOpen(false);
          setSelectedDevice(null);
          setSelectedDeviceId(null);
        }}
        width={
          selectedPanelMenu === "recordings" ||
          selectedPanelMenu === "channel management" ||
          (selectedPanelMenu === "overview" &&
            (selectedDevice?.deviceType === "NVR" || selectedDevice?.type === "NVR")) ||
          (selectedPanelMenu === "settings" &&
            (selectedDevice?.deviceType === "NVR" || selectedDevice?.type === "NVR"))
            ? "w-[1200px]"
            : "w-[450px]"
        }
      >
        {isLoadingDeviceDetail ? (
          <div className="flex h-64 items-center justify-center">
            <span className="text-textSecondary">Loading device details...</span>
          </div>
        ) : selectedDevice ? (
          <div className="flex flex-col">
            <div className="flex justify-between border-b border-b-neutral-700 px-[40px] py-[24px]">
              <div>
                <div className="flex gap-2">
                  <span className="text-lg font-semibold text-textPrimary">
                    {selectedDevice.name}
                  </span>
                  <Badge
                    variant={
                      selectedDevice.status === "online" || selectedDevice.status === "Online"
                        ? "success"
                        : "error"
                    }
                    appearance="border"
                    size="sm"
                  >
                    {selectedDevice.status === "online" || selectedDevice.status === "Online"
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>
                <p className="text-textSecondary">{selectedDevice.uID}</p>
              </div>
            </div>

            <div className="mb-[24px] flex-1 space-y-6 overflow-y-auto px-[40px]">
              <div className="flex">
                {panelMenus.map((menu) => (
                  <button
                    key={menu}
                    className={cn(
                      "border-b border-b-neutral-700 px-[40px] py-[16px]",
                      selectedPanelMenu === menu
                        ? "!border-b-textPrimary font-medium text-textPrimary transition-opacity"
                        : "text-textMuted"
                    )}
                    onClick={() => setSelectedPanelMenu(menu)}
                  >
                    {menu.charAt(0).toUpperCase() + menu.slice(1)}
                  </button>
                ))}
              </div>

              {selectedPanelMenu === "overview" && (
                <>
                  {selectedDevice?.deviceType === "NVR" || selectedDevice?.type === "NVR" ? (
                    <DeviceNVROverview
                      selectedDevice={selectedDevice}
                      setSelectedPanelMenu={setSelectedPanelMenu}
                    />
                  ) : (
                    <CameraOverview
                      selectedDevice={selectedDevice}
                      refetchDevices={refetchDevices}
                      setSelectedPanelMenu={setSelectedPanelMenu}
                    />
                  )}
                </>
              )}

              {selectedPanelMenu === "recordings" && (
                <DeviceRecordings selectedDevice={selectedDevice} />
              )}

              {selectedPanelMenu === "channel management" && (
                <DeviceChannelManagement selectedDevice={selectedDevice} />
              )}

              {selectedPanelMenu === "settings" && (
                <>
                  {selectedDevice?.deviceType === "NVR" || selectedDevice?.type === "NVR" ? (
                    <DeviceNVRSettings
                      selectedDevice={selectedDevice}
                      onClosePanel={() => {
                        setIsSlidePanelOpen(false);
                        setSelectedDevice(null);
                        setSelectedDeviceId(null);
                      }}
                      refetchDevices={refetchDevices}
                    />
                  ) : (
                    <DeviceSettingsForm
                      selectedDevice={selectedDevice}
                      onClosePanel={() => {
                        setIsSlidePanelOpen(false);
                        setSelectedDevice(null);
                        setSelectedDeviceId(null);
                      }}
                      refetchDevices={refetchDevices}
                      setSelectedDevice={setSelectedDevice}
                      laneOptions={laneOptions}
                      areaOptions={areaOptions}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}
      </SlidePanel>
    </div>
  );
};

export default DeviceSetup;
