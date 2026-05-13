import React, { useState } from "react";
import Modal from "components/common/Modal";

const CleanUpStorageModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [daysOlderThan, setDaysOlderThan] = useState("30");
  const [selectedChannels, setSelectedChannels] = useState([]);

  // Storage stats
  const totalStorage = 100; // GB
  const usedStorage = 83.5; // GB
  const storagePercentage = (usedStorage / totalStorage) * 100;

  // Available channels data
  const availableChannels = [
    { id: "channel-1", name: "ChangiHub_Cam_01", channel: "Channel 1", location: "FedEX / Camp Area", storage: "8.32 Gb", recordings: "31 Recordings" },
    { id: "channel-2", name: "ChangiHub_Cam_01", channel: "Channel 2", location: "FedEX / Camp Area", storage: "8.32 Gb", recordings: "31 Recordings" },
    { id: "channel-3", name: "ChangiHub_Cam_01", channel: "Channel 3", location: "FedEX / Camp Area", storage: "8.32 Gb", recordings: "31 Recordings" },
    { id: "channel-4", name: "ChangiHub_Cam_01", channel: "Channel 4", location: "FedEX / Camp Area", storage: "8.32 Gb", recordings: "31 Recordings" },
    { id: "channel-5", name: "ChangiHub_Cam_01", channel: "Channel 5", location: "FedEX / Camp Area", storage: "8.32 Gb", recordings: "31 Recordings" },
    { id: "channel-6", name: "ChangiHub_Cam_01", channel: "Channel 6", location: "FedEX / Camp Area", storage: "8.32 Gb", recordings: "31 Recordings" },
  ];

  const handleToggleChannel = (channelId) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleConfirmClick = (e) => {
    if (e) e.stopPropagation();
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = (e) => {
    if (e) e.stopPropagation();
    setSelectedMethod(null);
    setDaysOlderThan("30");
    setSelectedChannels([]);
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
      maxHeight="max-h-[90vh]"
      zIndex={100}
      closeOnOverlayClick={false}
      showCloseButton={false}
      bodyPadding="p-6"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Clean-up Storage</h2>
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

        {/* Clean-up Method */}
        <div className="space-y-4">
          <h3 className="text-sm font-normal text-textSecondary">Clean-up Method</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Age-Based Clean-up */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-md border bg-transparent p-4 transition-colors ${
                selectedMethod === "age-based"
                  ? "border-brand"
                  : "border-neutral-700 hover:border-neutralHover"
              }`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[3px] transition-colors ${
                  selectedMethod === "age-based" ? "border-amber-500" : "border-neutralHover"
                }`}
              >
                {selectedMethod === "age-based" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                )}
                <input
                  type="radio"
                  name="cleanup-method"
                  checked={selectedMethod === "age-based"}
                  onChange={() => setSelectedMethod("age-based")}
                  className="sr-only"
                />
              </div>
              <div className="flex-1">
                <h4 className="mb-2 text-sm font-medium text-white">Age-Based Clean-up</h4>
                <p className="text-xs text-textSecondary">
                  Remove recordings older than a specific number of days
                </p>
              </div>
            </label>

            {/* Channel-Based Clean-up */}
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-md border bg-transparent p-4 transition-colors ${
                selectedMethod === "channel-based"
                  ? "border-brand"
                  : "border-neutral-700 hover:border-neutralHover"
              }`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[3px] transition-colors ${
                  selectedMethod === "channel-based" ? "border-amber-500" : "border-neutralHover"
                }`}
              >
                {selectedMethod === "channel-based" && (
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                )}
                <input
                  type="radio"
                  name="cleanup-method"
                  checked={selectedMethod === "channel-based"}
                  onChange={() => setSelectedMethod("channel-based")}
                  className="sr-only"
                />
              </div>
              <div className="flex-1">
                <h4 className="mb-2 text-sm font-medium text-white">Channel-Based Clean-up</h4>
                <p className="text-xs text-textSecondary">
                  Remove all recordings from specific channels
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Age-Based Input */}
        {selectedMethod === "age-based" && (
          <div className="w-1/2 pr-2">
            <label className="mb-2 block text-sm font-normal text-textSecondary">
              Delete Recordings Older than
            </label>
            <div className="relative">
              <input
                type="text"
                value={daysOlderThan}
                onChange={(e) => setDaysOlderThan(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-transparent px-4 py-2.5 pr-10 text-sm text-white focus:border-brand focus:outline-none"
                placeholder="30 Days"
              />
              <svg
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-textSecondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Channel-Based List */}
        {selectedMethod === "channel-based" && (
          <div>
            <h3 className="mb-3 text-sm font-normal text-textSecondary">Available Channels</h3>
            <div className="grid grid-cols-2 gap-3">
              {availableChannels.map((channel) => (
                <label
                  key={channel.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-neutral-700 bg-transparent p-3 transition-colors hover:border-neutralHover"
                >
                  <div className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => handleToggleChannel(channel.id)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-5 cursor-pointer rounded border-2 border-neutralHover bg-transparent transition-colors peer-checked:border-amber-500 peer-checked:bg-amber-500"></div>
                    <svg
                      className="pointer-events-none absolute h-3 w-3 hidden text-white peer-checked:block"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 text-sm font-medium text-white">
                        {channel.name} ({channel.channel})
                      </div>
                      <div className="text-xs text-textSecondary">{channel.location}</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm text-white">{channel.storage}</div>
                      <div className="text-xs text-textSecondary">{channel.recordings}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="rounded-md border border-neutralMuted bg-transparent px-6 py-2.5 text-sm text-white transition-colors hover:border-neutralMutedHover"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            className="rounded-md bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
          >
            Clean Up
          </button>
        </div>
      </div>

    </Modal>
  );
};

const CleanUpConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-[600px] w-full"
      zIndex={100}
      closeOnOverlayClick={false}
      showCloseButton={false}
      bodyPadding="p-6"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Clean Up Recording</h2>
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

        {/* Message */}
        <p className="text-sm text-textPrimary">
          Are you sure you want to delete the recordings from this NVR device?
        </p>

        {/* Estimated Impact */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-textSecondary">Estimated Impact</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-textPrimary">Space to be Freed:</span>
              <span className="text-sm font-medium text-brand">~13.5 Gb</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-textPrimary">Current Usage:</span>
              <span className="text-sm text-textPrimary">83.5 Gb (74.2% Used)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-textPrimary">Available Space after Clean Up:</span>
              <span className="text-sm font-medium text-green-500">80.0 Gb (4.2%)</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="rounded-md border border-neutralMuted bg-transparent px-6 py-2.5 text-sm text-white transition-colors hover:border-neutralMutedHover"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
            className="rounded-md bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CleanUpStorageModal;
export { CleanUpConfirmationModal };
