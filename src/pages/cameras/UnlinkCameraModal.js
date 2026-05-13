import React from "react";
import Modal from "components/common/Modal";
import { useUnlinkCameraNVRMutation } from "services/camera";

const UnlinkCameraModal = ({ isOpen, onClose, channel, onSuccess }) => {
  const unlinkMutation = useUnlinkCameraNVRMutation();

  const handleConfirm = async (e) => {
    if (e) e.stopPropagation();

    try {
      await unlinkMutation.mutateAsync(channel?.uID);
      // Success
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Error unlinking camera from NVR:", error);
      // TODO: Show error notification
    }
  };

  const handleCancel = (e) => {
    if (e) e.stopPropagation();
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
      maxWidth="max-w-[700px] w-full"
      zIndex={100}
      closeOnOverlayClick={false}
      showCloseButton={false}
      bodyPadding="p-6"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Unlink NVR from Camera</h2>
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

        {/* Content */}
        <div className="space-y-2">
          <p className="text-sm text-textPrimary">
            Are you sure you want to unlink this camera from the NVR?
          </p>
          <p className="text-sm text-textPrimary">
            Once unlinked, recordings may no longer be stored on the NVR unless reconnected.
          </p>
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
            disabled={unlinkMutation.isLoading}
            className="rounded-md bg-danger px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {unlinkMutation.isLoading ? "Unlinking..." : "Confirm"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UnlinkCameraModal;
