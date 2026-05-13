import React, { useState } from "react";
import { useQueryClient } from "react-query";
import Modal from "components/common/Modal";
import InputSelect from "components/common/InputSelect";
import { useGetCamerasQuery, useGetCameraByIdQuery, useLinkCameraNVRMutation } from "services/camera";

const LinkCameraToNVRModal = ({ isOpen, onClose, selectedDevice, onSuccess }) => {
  const [formData, setFormData] = useState({
    nvrDevice: null,
    nvrChannel: null,
  });

  const queryClient = useQueryClient();

  // Link camera to NVR mutation
  const linkCameraMutation = useLinkCameraNVRMutation();

  // Fetch NVR devices
  const { data: dataNVRDevices, isLoading: isLoadingNVR } = useGetCamerasQuery({
    page: 1,
    limit: 999,
    deviceType: "NVR",
  });

  // Fetch selected NVR device details
  const { data: selectedNVRData, isLoading: isLoadingNVRDetail } = useGetCameraByIdQuery(
    formData.nvrDevice?.value,
    {
      enabled: !!formData.nvrDevice?.value,
    }
  );

  // Transform NVR data to options
  const nvrDeviceOptions =
    dataNVRDevices?.data?.map((nvr) => ({
      value: nvr.uID,
      label: nvr.name,
    })) || [];

  // Generate channel options based on selected NVR
  const nvrChannelOptions = (() => {
    if (!formData.nvrDevice) return [];

    const nvrDevice = selectedNVRData?.data;

    // If NVR has channels data, use it
    if (nvrDevice?.nvr?.channels) {
      return nvrDevice.nvr.channels
        .filter((channel) => !channel.cameraID || channel.status === "available")
        .map((channel) => ({
          value: channel.channelNumber || channel.number,
          label: `Channel ${channel.channelNumber || channel.number}`,
        }));
    }

    // Otherwise, generate channel options based on total channels (default 12)
    const totalChannels = nvrDevice?.nvr?.totalChannels || nvrDevice?.totalChannels || 12;
    const channels = [];

    for (let i = 1; i <= totalChannels; i++) {
      channels.push({
        value: i,
        label: `Channel ${i}`,
      });
    }

    return channels;
  })();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Reset channel when NVR device changes
      ...(field === "nvrDevice" && { nvrChannel: null }),
    }));
  };

  const handleConfirm = async (e) => {
    if (e) e.stopPropagation();

    // Validation
    if (!formData.nvrDevice || !formData.nvrChannel) {
      alert("Please select both NVR device and channel");
      return;
    }

    try {
      const payload = {
        nvrID: formData.nvrDevice.value,
        channelNumber: formData.nvrChannel.value,
      };

      await linkCameraMutation.mutateAsync({
        cameraUID: selectedDevice.uID,
        payload,
      });

      // Invalidate queries to refetch device data
      await queryClient.invalidateQueries(["device", selectedDevice.uID]);
      await queryClient.invalidateQueries(["devices"]);

      // Reset form
      setFormData({
        nvrDevice: null,
        nvrChannel: null,
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Failed to link camera to NVR:", error);
      alert(error?.response?.data?.message || "Failed to link camera to NVR");
    }
  };

  const handleCancel = (e) => {
    if (e) e.stopPropagation();
    // Reset form
    setFormData({
      nvrDevice: null,
      nvrChannel: null,
    });
    onClose();
  };

  const handleClose = (e) => {
    if (e) {
      e.stopPropagation();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-[900px] w-full"
      zIndex={100}
      closeOnOverlayClick={false}
      showCloseButton={false}
      bodyPadding="p-6"
      bodyScrollable={false}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Link Camera to NVR Channel</h2>
          <button
            onClick={handleClose}
            className="text-textSecondary transition-colors hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <h3 className="text-sm font-normal text-textSecondary">Device Information</h3>

          {/* NVR Device */}
          <div>
            <label className="mb-2 block text-sm font-normal text-white">
              NVR Device <span className="text-red-500">*</span>
            </label>
            <InputSelect
              options={nvrDeviceOptions}
              value={formData.nvrDevice}
              onChange={(value) => handleInputChange("nvrDevice", value)}
              placeholder={isLoadingNVR ? "Loading NVR devices..." : "Select NVR device"}
              isClearable={false}
              isDisabled={isLoadingNVR}
            />
          </div>

          {/* NVR Channel */}
          <div>
            <label className="mb-2 block text-sm font-normal text-white">
              NVR Channel <span className="text-red-500">*</span>
            </label>
            <InputSelect
              options={nvrChannelOptions}
              value={formData.nvrChannel}
              onChange={(value) => handleInputChange("nvrChannel", value)}
              placeholder={
                !formData.nvrDevice
                  ? "Select NVR device first"
                  : isLoadingNVRDetail
                    ? "Loading channels..."
                    : "Select available channel"
              }
              isClearable={false}
              isDisabled={!formData.nvrDevice || isLoadingNVRDetail}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleCancel}
            disabled={linkCameraMutation.isLoading}
            className="rounded-md border border-neutralMuted bg-transparent px-6 py-2.5 text-sm text-white transition-colors hover:border-neutralMutedHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={linkCameraMutation.isLoading || !formData.nvrDevice || !formData.nvrChannel}
            className="rounded-md bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {linkCameraMutation.isLoading ? "Linking..." : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkCameraToNVRModal;
