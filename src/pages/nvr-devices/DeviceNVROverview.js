import React, { useState } from "react";
import CleanUpStorageModal, { CleanUpConfirmationModal } from "./CleanUpStorageModal";
import CleanUpSuccessModal from "./CleanUpSuccessModal";
import Button, { CustomButton, PrimaryButton } from "components/common/Button";

const DeviceNVROverview = ({ selectedDevice, setSelectedPanelMenu }) => {
  const [isCleanUpModalOpen, setIsCleanUpModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Mock data for NVR channels - in real app, this would come from API
  const nvrChannels = [
    {
      channelNo: "Channel 1",
      cameraId: "CAM_001",
      cameraName: "ChangiHub_Cam_01",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      storageUsed: "8.32 Gb",
      recordings: 31,
    },
    {
      channelNo: "Channel 2",
      cameraId: "Cam_002",
      cameraName: "ChangiHub_Cam_02",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      storageUsed: "8.32 Gb",
      recordings: 31,
    },
    {
      channelNo: "Channel 3",
      cameraId: "CAM_003",
      cameraName: "ChangiHub_Cam_03",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      storageUsed: "8.32 Gb",
      recordings: 31,
    },
    {
      channelNo: "Channel 5",
      cameraId: "CAM_005",
      cameraName: "ChangiHub_Cam_05",
      siteLocation: "-",
      area: "-",
      storageUsed: "8.32 Gb",
      recordings: 31,
    },
    {
      channelNo: "Channel 6",
      cameraId: "CAM_006",
      cameraName: "ChangiHub_Cam_06",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      storageUsed: "8.32 Gb",
      recordings: 31,
    },
    {
      channelNo: "Channel 7",
      cameraId: "CAM_007",
      cameraName: "ChangiHub_Cam_07",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      storageUsed: "8.32 Gb",
      recordings: 31,
    },
    {
      channelNo: "Channel 8",
      cameraId: "CAM_008",
      cameraName: "ChangiHub_Cam_08",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      storageUsed: "3131.3131.1131",
      recordings: 31,
    },
    {
      channelNo: "Channel 8",
      cameraId: "CAM_011",
      cameraName: "ChangiHub_Cam_08",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      storageUsed: "8.32 Gb",
      recordings: 31,
    },
  ];

  // Calculate storage stats
  const totalStorage = 100; // GB
  const usedStorage = 83.5; // GB
  const storagePercentage = (usedStorage / totalStorage) * 100;
  const availableStorage = totalStorage - usedStorage;

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4 pb-24">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium text-textPrimary">NVR Overview</span>
        <PrimaryButton
          onClick={() => setSelectedPanelMenu && setSelectedPanelMenu("settings")}
          className="flex items-center gap-2"
        >
          <img src="/icons/pencilIcon.svg" alt="Edit" className="h-4 w-4" />
          Edit NVR
        </PrimaryButton>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/recordIcon.svg" className="h-[32px] w-[32px]" alt="Channels" />
            <div className="flex flex-col">
              <span className="text-base font-medium text-textPrimary">Available Channels</span>
              <span className="text-[28px] font-semibold text-textPrimary">1</span>
            </div>
          </div>

          <div className="flex gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/databaseIcon.svg" className="h-[32px] w-[32px]" alt="Used" />
            <div className="flex flex-col">
              <span className="text-base font-medium text-textPrimary">Used Channels</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-semibold text-green-500">8</span>
                <span className="text-lg text-textSecondary">/12</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/databaseIcon.svg" className="h-[32px] w-[32px]" alt="Storage" />
            <div className="flex flex-col">
              <span className="text-base font-medium text-textPrimary">Storage Used</span>
              <span className="text-[28px] font-semibold text-red-500">82%</span>
            </div>
          </div>

          <div className="flex gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/clockIcon.svg" className="h-[32px] w-[32px]" alt="Activity" />
            <div className="flex flex-col">
              <span className="text-base font-medium text-textPrimary">Last Activity</span>
              <span className="text-sm text-textPrimary">May 24, 2025</span>
              <span className="text-sm text-textPrimary">08:00:00 AM</span>
            </div>
          </div>
        </div>

        {/* Device Information */}
        <div className="rounded-md border border-neutral-700 bg-surface px-[24px] py-[16px]">
          <div className="flex items-center gap-3 border-b border-b-neutral-700 pb-[16px]">
            <img src="/icons/deviceInformation.svg" alt="Info" />
            <span className="font-medium text-textPrimary">Device Information</span>
          </div>

          <div className="my-[16px] grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-textSecondary">Device Type</p>
              <p className="font-medium text-textPrimary">NVR</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">NVR Name</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice?.name || "Primary Recorder 1"}
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Camera ID</p>
              <p className="font-medium text-textPrimary">{selectedDevice?.uID || "NVR_001"}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Status</p>
              <span className="inline-flex items-center rounded-md border border-green-500 px-3 py-1 text-sm font-medium text-green-500">
                Online
              </span>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Manufacturer</p>
              <p className="font-medium text-textPrimary">Hikvision</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Model</p>
              <p className="font-medium text-textPrimary">DS-42774G2-II</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Site Location</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice?.siteLocation || "PTC"}
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Area Name</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice?.areaName || "Station 1"}
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Lane</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice?.lane?.join(", ") || "Lane 1, Lane 2, Lane 4, Lane 5"}
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">IP Address</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice?.ipAddress || "1313.131.1.131"}
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Http Port</p>
              <p className="font-medium text-textPrimary">80</p>
            </div>
            <div></div>
            <div>
              <p className="font-medium text-textSecondary">Created By</p>
              <p className="font-medium text-textPrimary">Jake Donoban</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Created On</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice?.createdAt
                  ? new Date(selectedDevice.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "Mar 24, 2024 . 08:00:00 AM"}
              </p>
            </div>
          </div>
        </div>

        {/* NVR Recording Storage */}
        <div className="rounded-md border border-neutral-700 bg-surface px-[24px] py-[16px]">
          <div className="flex items-center gap-3 border-b border-b-neutral-700 pb-[16px]">
            <img src="/icons/recordStorage.svg" alt="Storage" />
            <span className="font-medium text-textPrimary">NVR Recording Storage</span>
          </div>

          <div className="my-[16px] space-y-4">
            {/* Storage Capacity Bar */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-textSecondary">Storage Capacity</span>
                <span className="text-textPrimary">
                  {usedStorage} Gb of {totalStorage} Gb used
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-700">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
            </div>

            {/* Storage Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-textSecondary">Total Storage</p>
                <p className="font-medium text-textPrimary">{totalStorage} Gb</p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">Retention Period</p>
                <p className="font-medium text-textPrimary">30 Days</p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">Used Space</p>
                <p className="font-medium text-textPrimary">
                  {usedStorage} Gb ({storagePercentage.toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">Est Time Remaining</p>
                <p className="font-medium text-textPrimary">12 Days</p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">Available Space</p>
                <p className="font-medium text-textPrimary">
                  {availableStorage.toFixed(2)} Gb ({(100 - storagePercentage).toFixed(0)}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Statistics by Channel */}
        <div className="rounded-md border border-neutral-700 bg-surface px-[24px] py-[16px]">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-lg font-medium text-textPrimary">
              Recording Statistics by Channel
            </span>
            <div className="flex gap-2">
              <CustomButton
                className="flex items-center gap-2"
                buttonType="outline"
                color="#D4D4D4"
              >
                <img src="/icons/exportIcon.svg" alt="Export" className="h-4 w-4" />
                Export Recordings
              </CustomButton>
              <CustomButton
                className="flex items-center gap-2"
                onClick={() => setIsCleanUpModalOpen(true)}
              >
                <img src="/icons/cleanUpIcon.svg" alt="Analytics" className="h-4 w-4" />
                Clean Up Storage
              </CustomButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                    Channel No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                    Camera ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                    Camera Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                    Site Location
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                    Storage Used
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                    Recordings
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-textSecondary">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {nvrChannels.map((channel, index) => (
                  <tr key={index} className="border-b border-neutral-700 hover:bg-surface-raised">
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.channelNo}</td>
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.cameraId}</td>
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.cameraName}</td>
                    <td className="px-4 py-3 text-sm text-textPrimary">
                      <div>{channel.siteLocation}</div>
                      <div className="text-xs text-textSecondary">{channel.area}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.storageUsed}</td>
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.recordings}</td>
                    <td className="px-4 py-3 text-center">
                      <CustomButton buttonType="outline" color="#404040" className="p-2">
                        <img src="/icons/cheveron-right.svg" alt="View" className="h-4 w-4" />
                      </CustomButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clean Up Storage Modal */}
      <CleanUpStorageModal
        isOpen={isCleanUpModalOpen}
        onClose={() => setIsCleanUpModalOpen(false)}
        onConfirm={() => {
          setIsCleanUpModalOpen(false);
          setTimeout(() => {
            setShowConfirmation(true);
          }, 100);
        }}
      />

      {/* Clean Up Confirmation Modal */}
      <CleanUpConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={() => {
          console.log("Clean up confirmed");
          setShowConfirmation(false);
          setTimeout(() => {
            setShowSuccess(true);
          }, 100);
          // TODO: Implement API call to clean up storage
        }}
      />

      {/* Clean Up Success Modal */}
      <CleanUpSuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} />
    </div>
  );
};

export default DeviceNVROverview;
