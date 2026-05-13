import React, { useEffect, useState } from "react";
import LinkCameraToNVRModal from "./LinkCameraToNVRModal";
import UnlinkCameraModal from "./UnlinkCameraModal";
import AddZoneModal from "components/devices/AddZoneModal";
import { CustomButton, PrimaryButton, SecondaryButton } from "components/common/Button";
import { useUpdateCameraMutation } from "services/camera";
import { successAlert, errorAlert } from "components/common/Toast";
import HLSViewer from "components/videoViewer/HLSViewer";

const CameraOverview = ({ selectedDevice, setSelectedDevice, refetchDeviceDetail, refetchDevices, setSelectedPanelMenu }) => {
  const [isLinkNVRModalOpen, setIsLinkNVRModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [camera, setCamera] = useState(null);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [showZoneArea, setShowZoneArea] = useState(false);
  const [zones, setZones] = useState([]);

  const updateDeviceMutation = useUpdateCameraMutation();

  useEffect(() => {
    if (selectedDevice) {
      const camera = {
        id: selectedDevice.uID,
        name: selectedDevice.name,
        location: selectedDevice.siteLocation,
        status: selectedDevice.status,
        site: selectedDevice.siteLocation,
        stream: selectedDevice.rtspStreamLink,
        base64frame: selectedDevice.base64frame,
        isStreaming: selectedDevice.isStreaming,
        isStarted: selectedDevice.isStarted,
        isGetFrame: selectedDevice.isGetFrame,
      };
      const zones = selectedDevice.zones || [];
      setCamera(camera);
      setZones(zones);
    }
  }, [selectedDevice]);

  const handleUnlinkSuccess = () => {
    if (refetchDeviceDetail) {
      refetchDeviceDetail();
    }
  };

  const onClose = async () => {
    await updateDeviceMutation.mutateAsync({
      uId: selectedDevice.uID,
      payload: { base64frame: "" },
    });
    setIsAddZoneModalOpen(false);
    setZones(selectedDevice?.zones);
    setShowZoneArea(false);
  };

  const onConfirm = async () => {
    await updateDeviceMutation.mutateAsync({
      uId: selectedDevice.uID,
      payload: { zones, base64frame: "", isStreaming: false },
    });
    
    const refetch = await refetchDeviceDetail();
    setSelectedDevice(refetch?.data?.data);
    setIsAddZoneModalOpen(false);
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <SecondaryButton onClick={onClose} type="button">
        Cancel
      </SecondaryButton>
      <PrimaryButton type="button" onClick={onConfirm}>
        Confirm
      </PrimaryButton>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4 pb-24">
      <AddZoneModal
        isOpen={isAddZoneModalOpen}
        onClose={onClose}
        zones={zones}
        setZones={setZones}
        rtspStreamLink={camera?.stream}
        camera={camera}
        footer={footer}
        showZoneArea={showZoneArea}
        setShowZoneArea={setShowZoneArea}
      />

      <div className="flex items-center justify-between ">
        <span className="text-lg font-medium text-textPrimary">Camera Overview</span>
        <div className="flex items-center gap-3">
          {/* Start/Stop Streaming Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-textSecondary">Start/Stop Streaming</span>
            <button
              type="button"
              onClick={async () => {
                try {
                  const newState = !selectedDevice.isStarted;
                  await updateDeviceMutation.mutateAsync({
                    uId: selectedDevice.uID,
                    payload: { isStarted: newState },
                  });
                  successAlert(
                    newState ? "Streaming Started" : "Streaming Stopped",
                    `Camera ${selectedDevice.name} streaming has been ${newState ? "started" : "stopped"}.`
                  );
                  if (refetchDevices) refetchDevices();
                  if (refetchDeviceDetail) refetchDeviceDetail();
                } catch (err) {
                  errorAlert("Failed to update streaming status.", "Error");
                }
              }}
              disabled={updateDeviceMutation.isLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                selectedDevice?.isStarted ? "bg-brand" : "bg-neutral-700"
              } ${updateDeviceMutation.isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                  selectedDevice?.isStarted ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Delete Button */}
          <SecondaryButton
            onClick={() => setIsUnlinkModalOpen(true)}
            className="flex items-center gap-1"
          >
            <img src="/icons/trashIcon.svg" className="h-4 w-4" alt="Delete" />
            Delete
          </SecondaryButton>

          {/* Edit Zone Button */}
          <CustomButton
            className="flex items-center gap-1"
            onClick={() => setIsAddZoneModalOpen(true)}
            buttonType="outline"
            disabled={!selectedDevice?.isStarted}
          >
            <img src="/icons/pencilIcon.svg" alt="Edit" />
            Edit Zone
          </CustomButton>

          {/* Edit Site Button */}
          <PrimaryButton
            onClick={() => setSelectedPanelMenu && setSelectedPanelMenu("settings")}
            className="flex items-center gap-1"
          >
            <img src="/icons/pencilIcon.svg" alt="Edit" />
            Edit Site
          </PrimaryButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="h-[440px] w-[866px]">
          <HLSViewer
            camera={camera}
          />
        </div>

        <div className="flex justify-between gap-2">
          <div className="flex w-full gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/recordIcon.svg" className="h-[32px] w-[32px]" alt="Events" />
            <div className="flex flex-col">
              <span className="text-lg font-medium text-textPrimary">Events Today</span>
              <span className="text-[28px] font-semibold text-textPrimary">8</span>
            </div>
          </div>
          <div className="flex w-full gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/databaseIcon.svg" className="h-[32px] w-[32px]" alt="Recordings" />
            <div className="flex flex-col">
              <span className="text-lg font-medium text-textPrimary">Recordings</span>
              <span className="text-[28px] font-semibold text-textPrimary">8</span>
            </div>
          </div>
          <div className="flex w-full gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/networkIcon.svg" className="h-[32px] w-[32px]" alt="Network" />
            <div className="flex flex-col">
              <span className="text-lg font-medium text-textPrimary">Network Status</span>
              <img src="/icons/strong.svg" className="h-[34px] w-[90px]" alt="Signal Strength" />
            </div>
          </div>
          <div className="flex w-full gap-4 rounded-md border border-neutral-700 bg-surface-raised p-[24px]">
            <img src="/icons/clockIcon.svg" className="h-[32px] w-[32px]" alt="Clock" />
            <div className="flex flex-col">
              <span className="text-lg font-medium text-textPrimary">Last Activity</span>
              <span className="text-textPrimary">May 24, 2025 . 08:00:00 AM</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-neutral-700 bg-surface px-[24px] py-[16px] ">
          <div className="flex items-center gap-3 border-b border-b-neutral-700 pb-[16px]">
            <img src="/icons/deviceInformation.svg" alt="Info" />
            <span className="font-medium text-textPrimary">Device Information</span>
          </div>

          <div className="my-[16px] grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-textSecondary">Device Type</p>
              <p className="font-medium text-textPrimary">Camera</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Camera Name</p>
              <p className="font-medium text-textPrimary">{selectedDevice.name}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">CameraID</p>
              <p className="font-medium text-textPrimary">{selectedDevice.uID}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Site Location</p>
              <p className="font-medium text-textPrimary">{selectedDevice.siteLocation}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Area Name</p>
              <p className="font-medium text-textPrimary">{selectedDevice.area}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Lane</p>
              <p className="font-medium text-textPrimary">{selectedDevice?.lane.join(", ")}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">NVR Link</p>
              <p className="font-medium text-green-500">Linked</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">IP Address</p>
              <p className="font-medium text-textPrimary">{selectedDevice.ipAddress}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">RTSP Port</p>
              <p className="font-medium text-textPrimary">{selectedDevice.camera?.rtspPort}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">RTSP Link</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice.camera?.rtspStreamLink}
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Created By</p>
              <p className="font-medium text-textPrimary">Jake Paul</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Created On</p>
              <p className="font-medium text-textPrimary">{selectedDevice?.createdAt}</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Last Activity Date</p>
              <p className="font-medium text-textPrimary">{selectedDevice?.updatedAt}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-neutral-700 bg-surface px-[24px] py-[16px] ">
          <div className="flex items-center gap-3 border-b border-b-neutral-700 pb-[16px]">
            <img src="/icons/videoSpec.svg" alt="Specs" />
            <span className="font-medium text-textPrimary">Video Specifications</span>
          </div>

          <div className="my-[16px] grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-textSecondary">Resolution</p>
              <p className="font-medium text-textPrimary">
                {selectedDevice.camera?.videoResolution}
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Frame Rate (FPS)</p>
              <p className="font-medium text-textPrimary">{selectedDevice.camera?.frameRate} FPS</p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">
                Pre-event Recording (Seconds before detection)
              </p>
              <p className="font-medium text-textPrimary">
                {selectedDevice.camera?.preRecordingBuffer} Seconds
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">
                Post-event Recording (Seconds after detection)
              </p>
              <p className="font-medium text-textPrimary">
                {selectedDevice.camera?.postRecordingBuffer} Seconds
              </p>
            </div>
            <div>
              <p className="font-medium text-textSecondary">Video Codec</p>
              <p className="font-medium text-textPrimary">{selectedDevice.camera?.videoCodec}</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-neutral-700 bg-surface px-[24px] py-[16px] ">
          <div className="flex items-center justify-between border-b border-b-neutral-700 pb-[16px]">
            <div className="flex items-center gap-3">
              <img src="/icons/recordStorage.svg" alt="Storage" />
              <span className="font-medium text-textPrimary">
                {selectedDevice?.camera?.nvr || selectedDevice?.camera?.nvrID
                  ? "NVR Storage & Recordings"
                  : "Recording & Storage"}
              </span>
            </div>
            {selectedDevice?.camera?.nvr || selectedDevice?.camera?.nvrID ? (
              <CustomButton
                onClick={() => setSelectedPanelMenu && setSelectedPanelMenu("settings")}
              >
                View Details
              </CustomButton>
            ) : (
              <CustomButton
                onClick={() => setIsLinkNVRModalOpen(true)}
                buttonType="outline"
                color="#404040"
                className="flex items-center gap-1"
              >
                <img src="/icons/linkIcon.svg" alt="Link" className="h-4 w-4" />
                Link to NVR
              </CustomButton>
            )}
          </div>

          <div className="my-[16px] space-y-4">
            {/* Success Message - Show when linked */}
            {selectedDevice?.camera?.nvr || selectedDevice?.camera?.nvrID ? (
              <div className="flex items-start gap-3 rounded-md border border-green-800 bg-green-900 p-4">
                <p className="text-sm text-green-200">
                  <span className="font-semibold">Recording Active:</span> This camera is linked to
                  an NVR and currently recording footage as scheduled.
                </p>
              </div>
            ) : (
              /* Warning Message - Show when not linked */
              <div className="flex items-start gap-3 rounded-md border border-yellow-800 bg-amber-deep p-4">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-amber-100">
                  This camera is not connected to any Network Video Recorder. Video recordings will
                  not be saved.
                </p>
              </div>
            )}

            {/* NVR Information Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-textSecondary">NVR Name</p>
                <p className="font-medium text-textPrimary">
                  {selectedDevice?.camera?.nvr?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">NVR Model</p>
                <p className="font-medium text-textPrimary">
                  {selectedDevice?.camera?.nvr?.model || "N/A"}
                </p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">Channel Number</p>
                <p className="font-medium text-textPrimary">
                  {selectedDevice?.camera?.channelNumber
                    ? `Channel${selectedDevice.camera.channelNumber}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">NVR IP</p>
                <p className="font-medium text-textPrimary">
                  {selectedDevice?.camera?.nvr?.ipAddress || "N/A"}
                </p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">NVR Status</p>
                {selectedDevice?.camera?.nvr?.status ? (
                  <span
                    className={`inline-flex items-center rounded-md border px-[10px] py-[4px] !text-xs font-medium ${
                      selectedDevice?.camera?.nvr?.status === "online"
                        ? "border-green-500 text-green-500"
                        : "border-red-500 text-red-500"
                    }`}
                  >
                    {selectedDevice?.camera?.nvr?.status === "online" ? "Live" : "Offline"}
                  </span>
                ) : (
                  <p className="font-medium text-textPrimary">N/A</p>
                )}
              </div>
              <div>
                <p className="font-medium text-textSecondary">NVR Recording Status</p>
                <p className="font-medium text-green-500">
                  {selectedDevice?.camera?.nvr?.recordingStatus || "Recording"}
                </p>
              </div>
              <div>
                <p className="font-medium text-textSecondary">Used Space</p>
                <p className="font-medium text-red-500">
                  {selectedDevice?.camera?.nvr?.usedSpace || "83.5 Gb (62%)"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Link Camera to NVR Modal */}
      <LinkCameraToNVRModal
        isOpen={isLinkNVRModalOpen}
        onClose={() => setIsLinkNVRModalOpen(false)}
        selectedDevice={selectedDevice}
        onSuccess={() => {
          if (refetchDeviceDetail) {
            refetchDeviceDetail();
          }
        }}
      />

      {/* Unlink Camera Modal */}
      <UnlinkCameraModal
        isOpen={isUnlinkModalOpen}
        onClose={() => setIsUnlinkModalOpen(false)}
        channel={selectedDevice}
        onSuccess={handleUnlinkSuccess}
      />
    </div>
  );
};

export default CameraOverview;
