import React, { useState } from "react";
import Modal from "components/common/Modal";
import InputSelect from "components/common/InputSelect";

const LinkCameraModal = ({ isOpen, onClose, channel, selectedDevice }) => {
  const [formData, setFormData] = useState({
    siteLocation: null,
    cameraName: null,
    nvrDevice: { value: selectedDevice?.uID || "nvr-001", label: selectedDevice?.name || "Primary Recorder 1" },
    nvrChannel: null,
  });

  // Options for dropdowns
  const siteLocationOptions = [
    { value: "fedex-hub", label: "FedEx Changi Hub" },
    { value: "changi-hub", label: "Changi Hub" },
    { value: "main-building", label: "Main Building" },
  ];

  const cameraNameOptions = [
    { value: "cam-001", label: "ChangiHub_Cam_01" },
    { value: "cam-002", label: "ChangiHub_Cam_02" },
    { value: "cam-003", label: "ChangiHub_Cam_03" },
    { value: "cam-004", label: "ChangiHub_Cam_04" },
    { value: "cam-005", label: "ChangiHub_Cam_05" },
  ];

  const nvrDeviceOptions = [
    { value: "nvr-001", label: "Primary Recorder 1" },
    { value: "nvr-002", label: "Secondary Recorder 1" },
  ];

  const nvrChannelOptions = [
    { value: "channel-1", label: "Channel 1" },
    { value: "channel-2", label: "Channel 2" },
    { value: "channel-3", label: "Channel 3" },
    { value: "channel-4", label: "Channel 4" },
    { value: "channel-5", label: "Channel 5" },
    { value: "channel-6", label: "Channel 6" },
    { value: "channel-7", label: "Channel 7" },
    { value: "channel-8", label: "Channel 8" },
    { value: "channel-9", label: "Channel 9" },
    { value: "channel-10", label: "Channel 10" },
    { value: "channel-11", label: "Channel 11" },
    { value: "channel-12", label: "Channel 12" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirm = (e) => {
    if (e) e.stopPropagation();
    console.log("Link camera data:", formData);
    // TODO: Implement API call to link camera to channel
    onClose();
  };

  const handleCancel = (e) => {
    if (e) e.stopPropagation();
    // Reset form
    setFormData({
      siteLocation: null,
      cameraName: null,
      nvrDevice: { value: selectedDevice?.uID || "nvr-001", label: selectedDevice?.name || "Primary Recorder 1" },
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

          {/* Site Location */}
          <div>
            <label className="mb-2 block text-sm font-normal text-white">
              Site Location <span className="text-red-500">*</span>
            </label>
            <InputSelect
              options={siteLocationOptions}
              value={formData.siteLocation}
              onChange={(value) => handleInputChange("siteLocation", value)}
              placeholder="Select site location"
              isClearable={false}
            />
          </div>

          {/* Camera Name */}
          <div>
            <label className="mb-2 block text-sm font-normal text-white">
              Camera Name <span className="text-red-500">*</span>
            </label>
            <InputSelect
              options={cameraNameOptions}
              value={formData.cameraName}
              onChange={(value) => handleInputChange("cameraName", value)}
              placeholder="Select camera"
              isClearable={false}
            />
          </div>

          {/* NVR Device */}
          <div>
            <label className="mb-2 block text-sm font-normal text-white">
              NVR Device <span className="text-red-500">*</span>
            </label>
            <InputSelect
              options={nvrDeviceOptions}
              value={formData.nvrDevice}
              onChange={(value) => handleInputChange("nvrDevice", value)}
              placeholder="Select NVR device"
              isClearable={false}
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
              placeholder="Select available channel"
              isClearable={false}
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="rounded-md border border-neutralMuted bg-transparent px-6 py-2.5 text-sm text-white transition-colors hover:border-neutralMutedHover"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-md bg-danger px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkCameraModal;
