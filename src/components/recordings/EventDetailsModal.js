import React from "react";
import Modal from "components/common/Modal";

const EventDetailsModal = ({ isOpen, onClose, event }) => {
  if (!event) return null;


  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High":
        return "bg-red-500";
      case "Medium":
        return "bg-orange-500";
      case "Low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details"
      size="full"
      closeOnOverlayClick={true}
      showCloseButton={true}
      zIndex={60}
      offsetSidebar={false}
      verticalAlign="center"
      bodyPadding="p-0"
      containerPadding="px-20 py-10"
    >
      <div className="p-8">
      <div className="flex gap-6">
        {/* Left Column - Event Snapshot */}
        <div className="flex-1">
          <div className="w-full aspect-[4/3] bg-neutral-950 rounded-lg overflow-hidden relative">
            {event.thumbnail ? (
              <img
                src={event.thumbnail}
                alt="Event snapshot"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {/* Timestamp overlay */}
            <div className="absolute top-3 left-3 bg-black/70 text-white text-sm px-2 py-1 rounded font-medium">
              {event.timestamp}
            </div>
          </div>
        </div>

        {/* Right Column - Event Details */}
        <div className="flex-1 space-y-6">
          {/* Event Information */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Event Information
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Event ID</p>
                  <p className="text-sm text-white">EVT-{event.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Priority Level</p>
                  <span
                    className={`inline-block text-xs text-white px-2 py-1 rounded ${getSeverityColor(
                      event.severity
                    )}`}
                  >
                    {event.severity}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Camera</p>
                  <p className="text-sm text-white">
                    {event.location?.split(" ")[0] || "ChangiHub_Cam_001"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Site Location</p>
                  <p className="text-sm text-white">FedEx Changi Hub</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Area</p>
                  <p className="text-sm text-white">Station 1</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Lane</p>
                  <p className="text-sm text-white">Camp Area</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="text-sm text-white">{event.timestamp}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Timestamp</p>
                  <p className="text-sm text-white">{event.date}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Details */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Detection Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Objects Detected</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-block text-xs text-white px-3 py-1 rounded bg-surface-elevated border border-neutral-700">
                      Person
                    </span>
                    <span className="inline-block text-xs text-white px-3 py-1 rounded bg-surface-elevated border border-neutral-700">
                      Helmet
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Object Count</p>
                  <p className="text-sm text-white">{event.objectsCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Rule Triggered</p>
                  <p className="text-sm text-white">Object Detection Alert Rule</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Detection Coordinates</p>
                  <p className="text-sm text-white">X: 445, Y: 320</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-700">
        <button
          onClick={onClose}
          className="px-6 py-2.5 text-sm text-white border border-neutral-700 rounded-lg hover:border-neutralHover transition-colors"
        >
          Close
        </button>
        <button
          className="px-6 py-2.5 text-sm text-white bg-surface-elevated hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          View Recording
        </button>
      </div>
      </div>
    </Modal>
  );
};

export default EventDetailsModal;
