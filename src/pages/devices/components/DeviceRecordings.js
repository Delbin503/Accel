import React, { useState } from "react";
import InputSelect from "components/common/InputSelect";
import InputDate from "components/common/InputDate";
import RecordingCard from "components/recordings/RecordingCard";
import RecordingDetailModal from "components/recordings/RecordingDetailModal";
import { useGetRecordingsQuery } from "services/recording";

const DeviceRecordings = ({ selectedDevice }) => {
  const [filters, setFilters] = useState({
    recordingType: { value: "all", label: "All recordings" },
    selectedDate: "",
  });
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Recording type options
  const recordingTypeOptions = [
    { value: "all", label: "All recordings" },
    { value: "Continuous Recording", label: "Continuous Recording" },
    { value: "Event Recording", label: "Event Recording" },
  ];

  // Fetch recordings for this device
  // Use uID, id, or _id as fallback
  const deviceId = selectedDevice?.uID || selectedDevice?.id || selectedDevice?._id;

  const { data: recordingsData, isLoading } = useGetRecordingsQuery({
    cameras: deviceId ? [deviceId] : [],
    page: 1,
    limit: 100, // Show all recordings for this device
  });

  // Filter recordings based on type and date
  const filteredRecordings = React.useMemo(() => {
    let recordings = recordingsData?.data || [];

    // Filter by recording type
    if (filters.recordingType?.value !== "all") {
      recordings = recordings.filter(
        (rec) => rec.type === filters.recordingType.value
      );
    }

    // Filter by date
    if (filters.selectedDate) {
      recordings = recordings.filter((rec) => {
        const recordingDate = new Date(rec.date).toISOString().split("T")[0];
        return recordingDate === filters.selectedDate;
      });
    }

    return recordings;
  }, [recordingsData, filters]);

  // Transform recording data for RecordingCard and DetailModal
  const transformRecording = (recording) => ({
    id: recording.uID,
    title: recording.title,
    type: recording.type,
    location: {
      site: recording.siteLocation,
      area: recording.area,
      station: recording.station,
      lane: recording.lane,
      camera: recording.camera,
    },
    time: {
      startTime: recording.startTime,
      endTime: recording.endTime,
      date: new Date(recording.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    },
    events: {
      detected: recording.eventsCount > 0,
      count: recording.eventsCount,
    },
    file: {
      size: recording.fileSize,
    },
    videoUrl: recording.videoUrl || recording.url || null,
    thumbnail: recording.thumbnailUrl || recording.thumbnail || null,
  });

  return (
    <div className="space-y-4">
      {/* Header with title and filters */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-medium text-textPrimary">Recordings</span>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="w-[180px]">
            <InputSelect
              options={recordingTypeOptions}
              value={filters.recordingType}
              onChange={(selected) =>
                setFilters((prev) => ({ ...prev, recordingType: selected }))
              }
              placeholder="All recordings"
              isClearable={false}
              fontSize="14px"
            />
          </div>
          <div className="w-[180px]">
            <InputDate
              value={filters.selectedDate}
              onChange={(date) =>
                setFilters((prev) => ({ ...prev, selectedDate: date }))
              }
              placeholder="Select date"
              fontSize="14px"
            />
          </div>
        </div>
      </div>

      {/* Recordings Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="text-textSecondary">Loading recordings...</span>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center">
          <svg
            className="mb-4 h-16 w-16 text-neutral-700"
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
          <span className="text-textSecondary">No recordings found</span>
          <span className="text-sm text-textMuted">
            {filters.recordingType?.value !== "all" || filters.selectedDate
              ? "Try adjusting your filters"
              : "This device has no recordings yet"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map((recording) => (
            <RecordingCard
              key={recording.uID}
              recording={transformRecording(recording)}
              onClick={(rec) => {
                setSelectedRecording(rec);
                setIsDetailModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredRecordings.length > 0 && (
        <div className="flex justify-between border-t border-neutral-700 pt-4 text-sm text-textMuted">
          <span>
            Showing {filteredRecordings.length} recording
            {filteredRecordings.length !== 1 ? "s" : ""}
          </span>
          <span>Total: {recordingsData?.pagination?.totalCount || 0}</span>
        </div>
      )}

      {/* Recording Detail Modal */}
      <RecordingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecording(null);
        }}
        recording={selectedRecording}
      />
    </div>
  );
};

export default DeviceRecordings;
