import React from "react";
import Modal from "components/common/Modal";

const CleanUpSuccessModal = ({ isOpen, onClose }) => {
  // Storage stats
  const previousUsage = 83.5;
  const spaceFreed = 13.5;
  const newUsage = 80.0;
  const newUsagePercentage = 4.2;
  const totalStorage = 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[700px] w-full"
      zIndex={100}
      closeOnOverlayClick={false}
      showCloseButton={false}
      bodyPadding="p-6"
    >
      <div className="space-y-5">
        {/* Header with Close Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
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

        {/* Success Icon */}
        <div className="flex justify-center -mt-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-200">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center -mt-2">
          <h2 className="mb-3 text-xl font-semibold text-white">Clean Up Recording</h2>
          <p className="text-sm text-textSecondary">
            Are you sure you want to delete the recordings from this NVR device?
          </p>
        </div>

        {/* Usage Stats */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-textSecondary">Previous Usage:</span>
            <span className="text-sm text-white">{previousUsage} Gb</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-textSecondary">Space Freed:</span>
            <span className="text-sm font-medium text-brand">-{spaceFreed} Gb</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-textSecondary">New Usage:</span>
            <span className="text-sm font-medium text-green-500">{newUsage} Gb ({newUsagePercentage}%)</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark"
            style={{ width: `${newUsagePercentage}%` }}
          />
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-full rounded-md border border-neutralMuted bg-transparent px-6 py-2.5 text-sm text-white transition-colors hover:border-neutralMutedHover"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CleanUpSuccessModal;
