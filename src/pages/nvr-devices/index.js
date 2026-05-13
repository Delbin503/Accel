import React from "react";
import AddNVRDeviceModal from "components/devices/AddNVRDeviceModal";
import DevicePageLayout from "pages/devices/components/DevicePageLayout";
import DeviceNVROverview from "./DeviceNVROverview";
import DeviceChannelManagement from "pages/nvr-devices/DeviceChannelManagement";
import DeviceNVRSettings from "pages/nvr-devices/DeviceNVRSettings";
import { getNVRDeviceTableColumns } from "pages/devices/components/DeviceTableColumns";
import { useDeviceManagement } from "pages/devices/components/useDeviceManagement";
import { cn } from "utils/common";

/**
 * NVR Devices Page
 * Displays and manages NVR devices using reusable components
 */
const NVRDevices = () => {
  const deviceType = "NVR";
  const pageTitle = "NVR Devices";

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
    isLoadingDevices,
    isLoadingDeviceDetail,
  } = useDeviceManagement(deviceType);

  // Transform API data to table format (NVR-specific)
  const devices =
    dataDevice?.data?.map((device) => {
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
    }) || [];

  // NVR-specific table columns
  const columns = getNVRDeviceTableColumns();

  // NVR panel menus
  const panelMenus = ["overview", "channel management", "settings"];

  // Determine slide panel width based on selected menu
  const slidePanelWidth =
    selectedPanelMenu === "channel management" ||
    selectedPanelMenu === "overview" ||
    selectedPanelMenu === "settings"
      ? "w-[1200px]"
      : "w-[450px]";

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
        <DeviceNVROverview selectedDevice={selectedDevice} setSelectedPanelMenu={setMenu} />
      )}

      {menu === "channel management" && <DeviceChannelManagement selectedDevice={selectedDevice} />}

      {menu === "settings" && (
        <DeviceNVRSettings
          selectedDevice={selectedDevice}
          onClosePanel={handleCloseDeviceDetail}
          refetchDevices={refetchDevices}
          areaOptionsFromManagement={areaOptions}
          laneOptionsFromManagement={laneOptions}
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
        <AddNVRDeviceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          areaOptions={areaOptions}
          laneOptions={laneOptions}
        />
      }
    />
  );
};

export default NVRDevices;
