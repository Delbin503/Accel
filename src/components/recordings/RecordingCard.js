import React from "react";

const RecordingCard = ({ recording, onClick }) => {
  const {
    id,
    title,
    type,
    location,
    time,
    events,
    file,
  } = recording;

  return (
    <div
      className="bg-surface-deeper rounded-lg border border-neutral-700 p-4 hover:border-neutralHover transition-colors cursor-pointer"
      onClick={() => onClick?.(recording)}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <h3 className="text-white font-medium text-base flex-1 min-w-[150px]">{title}</h3>
        {type && (
          <span className="text-xs px-2 py-1 rounded bg-brand/20 text-brand whitespace-nowrap">
            {type}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="space-y-3">
        {/* ID Tag */}
        {id && (
          <div className="inline-block">
            <span className="text-xs px-2 py-1 rounded bg-surface-elevated text-textSecondary">
              {id}
            </span>
          </div>
        )}

        {/* Location Info */}
        {location && (
          <div className="flex items-start space-x-2 min-w-0">
            <svg
              className="w-4 h-4 text-textSecondary flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-sm text-textSecondary truncate">
              {location.station && location.lane
                ? `${location.station}/ ${location.lane}`
                : location.station || location.lane || "-"}
            </span>
          </div>
        )}

        {/* Time Info */}
        {time && (
          <div className="flex items-start space-x-2 min-w-0">
            <svg
              className="w-4 h-4 text-textSecondary flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-textSecondary truncate">
              {time.startTime && time.endTime
                ? `${time.startTime} - ${time.endTime}${time.date ? ` • ${time.date}` : ""}`
                : time.date || "-"}
            </span>
          </div>
        )}

        {/* Event Detection */}
        {events && events.detected && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-textSecondary">
              {events.count || 0} Events Detected
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      {file && file.size && (
        <div className="mt-4 pt-3 border-t border-neutral-700 flex justify-end">
          <span className="text-sm text-gray-400">{file.size}</span>
        </div>
      )}
    </div>
  );
};

export default RecordingCard;
