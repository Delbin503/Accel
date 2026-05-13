import React, { useEffect, useState } from "react";
import AddCameraModal from "components/devices/AddCameraModal";
import DevicePageLayout from "pages/devices/components/DevicePageLayout";
import DeviceRecordings from "pages/devices/components/DeviceRecordings";
import { getDeviceTableColumns } from "pages/devices/components/DeviceTableColumns";
import { useDeviceManagement } from "pages/devices/components/useDeviceManagement";
import { cn } from "utils/common";
import CameraSettingForm from "./CameraSettingsForm";
import CameraOverview from "./CameraOverview";

/**
 * Camera Devices Page
 * Displays and manages camera devices using reusable components
 */
const CameraDevices = () => {
  const deviceType = "CAM";
  const pageTitle = "Cameras";

  // Use shared device management hook
  const {
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
    isSlidePanelOpen,
    selectedDevice,
    selectedPanelMenu,
    setSelectedPanelMenu,
    handleOpenDeviceDetail,
    handleCloseDeviceDetail,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    filters,
    setFilters,
    siteOptions,
    areaOptions,
    laneOptions,
    handleSearch,
    handleReset,
    dataDevice,
    refetchDevices,
    refetchDeviceDetail,
    isLoadingDevices,
    isLoadingDeviceDetail,
    setSelectedDevice,
  } = useDeviceManagement(deviceType);
  
  useEffect(() => {
    refetchDevices();

  }, []);
  // refetchDevices();

  // Transform API data to table format (Camera-specific)
  const devices =
    dataDevice?.data?.map((device) => {
      const displayStatus = device.isStarted ? "Online" : "Offline";

      return {
        ...device,
        id: device.uID || device._id,
        name: device.name,
        status: displayStatus,
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
    }) || [];

  useEffect(() => {
    if (!selectedDevice || !dataDevice?.data) {
      return;
    }

    const updated = dataDevice.data.find((device) => device.uID === selectedDevice.uID);
    if (updated) {
      setSelectedDevice(updated);
    }
  }, [dataDevice, selectedDevice, setSelectedDevice]);

  // Camera-specific table columns
  const columns = getDeviceTableColumns();

  // Camera panel menus
  const panelMenus = ["overview", "recordings", "settings"];

  // Determine slide panel width based on selected menu
  const slidePanelWidth = selectedPanelMenu === "recordings" ? "w-[1200px]" : "w-[450px]";

  // Render slide panel content based on selected menu
  const renderPanelContent = (menu, setMenu) => (
    <>
      <div className="flex">
        {panelMenus.map((menuItem) => (
          <button
            key={menuItem}
            className={cn(
              "border-b border-b-neutral-700 px-[40px] py-[16px]",
              menu === menuItem
                ? "!border-b-textPrimary font-medium text-textPrimary transition-opacity"
                : "text-textMuted"
            )}
            onClick={() => setMenu(menuItem)}
          >
            {menuItem.charAt(0).toUpperCase() + menuItem.slice(1)}
          </button>
        ))}
      </div>

      {menu === "overview" && (
        <CameraOverview
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
          refetchDeviceDetail={refetchDeviceDetail}
          setSelectedPanelMenu={setMenu}
        />
      )}

      {menu === "recordings" && <DeviceRecordings selectedDevice={selectedDevice} />}

      {menu === "settings" && (
        <CameraSettingForm
          selectedDevice={selectedDevice}
          onClosePanel={handleCloseDeviceDetail}
          refetchDevices={refetchDevices}
          setSelectedDevice={setSelectedDevice}
          laneOptions={laneOptions}
          areaOptions={areaOptions}
        />
      )}
    </>
  );

  return (
    <DevicePageLayout
      pageTitle={pageTitle}
      columns={columns}
      devices={devices}
      isLoadingDevices={isLoadingDevices}
      onAddDevice={handleOpenModal}
      onOpenDeviceDetail={handleOpenDeviceDetail}
      pagination={{
        currentPage,
        pageSize,
        totalCount: dataDevice?.pagination?.totalCount || 0,
        onPageChange: setCurrentPage,
        onPageSizeChange: setPageSize,
      }}
      filters={{
        filters,
        setFilters,
        siteOptions,
        areaOptions,
        handleSearch,
        handleReset,
      }}
      slidePanel={{
        isOpen: isSlidePanelOpen,
        selectedDevice,
        selectedPanelMenu,
        setSelectedPanelMenu,
        onClose: handleCloseDeviceDetail,
        width: slidePanelWidth,
        renderContent: renderPanelContent,
      }}
      AddDeviceModalComponent={
        <AddCameraModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          areaOptions={areaOptions}
          laneOptions={laneOptions}
        />
      }
    />
  );
};

export default CameraDevices;
