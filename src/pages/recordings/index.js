import React, { useEffect, useRef, useState } from "react";
import InputSelect from "components/common/InputSelect";
import InputDate from "components/common/InputDate";
import EmptyState from "components/common/EmptyState";
import { successAlert, errorAlert } from "components/common/Toast";
import RecordingCard from "components/recordings/RecordingCard";
import RecordingDetailModal from "components/recordings/RecordingDetailModal";
import { useGetStationsQuery, useGetLanes } from "services/sitemanagement";
import { useGetRecordingsQuery } from "services/recording";
import { useGetCamerasQuery } from "services/camera";

const RecordingsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [siteOptions, setSiteOptions] = useState([]);
  const hasInitializedSiteOptions = useRef(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter state for input values
  const [filters, setFilters] = useState({
    siteLocation: null,
    areas: [],
    cameras: [],
    startDate: "",
    endDate: "",
    search: "",
  });

  // Applied filters - only updated when Search button is clicked
  const [appliedFilters, setAppliedFilters] = useState({
    siteLocation: null,
    areas: [],
    cameras: [],
    startDate: "",
    endDate: "",
    search: "",
  });

  // Get Stations for Area options
  const { data: dataStationsQuery } = useGetStationsQuery({
    entityPerPage: 999,
    pageNum: 1,
  });

  // Get Lanes
  const { data: dataLanes } = useGetLanes();

  // Get Devices for Camera options
  const { data: dataDevices } = useGetCamerasQuery({
    page: 1,
    limit: 999,
    deviceType: "CAM",
  });

  // Get Recordings - using appliedFilters instead of filters
  const {
    data: dataRecordings,
    isLoading: isLoadingRecordings,
  } = useGetRecordingsQuery({
    page: currentPage,
    limit: pageSize,
    search: appliedFilters.search,
    siteLocation: appliedFilters.siteLocation?.label || "",
    areas: appliedFilters.areas?.map((a) => a.value) || [],
    cameras: appliedFilters.cameras?.map((c) => c.value) || [],
    startDate: appliedFilters.startDate,
    endDate: appliedFilters.endDate,
  });

  // Prepare options for filters
  const areaOptions = dataStationsQuery?.data?.map((station) => ({
    value: station.uID,
    label: station.name,
  })) || [];

  const cameraOptions = dataDevices?.data?.map((device) => ({
    value: device.uID,
    label: device.name,
  })) || [];

  // Initialize site options from recordings data
  useEffect(() => {
    if (dataRecordings?.data && !hasInitializedSiteOptions.current) {
      const uniqueSiteOptions = [
        ...new Map(
          dataRecordings.data.map((v) => [
            v.siteLocation,
            {
              value: v.siteLocation,
              label: v.siteLocation,
            },
          ])
        ).values(),
      ];

      setSiteOptions(uniqueSiteOptions);
      hasInitializedSiteOptions.current = true;
    }
  }, [dataRecordings]);

  // Handle search - apply current filters
  const handleSearch = () => {
    if (
      !filters.siteLocation &&
      (!filters.areas || filters.areas.length === 0) &&
      (!filters.cameras || filters.cameras.length === 0) &&
      !filters.startDate &&
      !filters.endDate &&
      !filters.search
    ) {
      errorAlert("Please fill in at least one filter field before searching.", "Validation Error");
      return;
    }
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
    successAlert(
      "Filter Applied",
      "Your recording list has been updated based on the selected filters.",
      3000
    );
  };

  // Handle reset filters
  const handleReset = () => {
    const resetFilters = {
      siteLocation: null,
      areas: [],
      cameras: [],
      startDate: "",
      endDate: "",
      search: "",
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setCurrentPage(1);
  };

  // Handle card click
  const handleCardClick = (recording) => {
    setSelectedRecording(recording);
    setIsDetailModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRecording(null);
  };

  // Transform API data to card format
  const recordings =
    dataRecordings?.data?.map((recording) => {
      // Format duration from seconds to MM:SS or HH:MM:SS
      const formatDuration = (seconds) => {
        if (!seconds) return null;
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
          return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      return {
        id: recording.recordingId || recording.uID || recording._id,
        title: recording.title || `Recording_${recording.recordingId}`,
        type: recording.type || "Continuous Recording",
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
          date: recording.date
            ? new Date(recording.date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : null,
        },
        events: {
          count: recording.eventsCount || 0,
          detected: recording.eventsCount > 0,
        },
        file: {
          size: recording.fileSize || "0 Gb",
        },
        // Video player fields
        videoUrl: recording.videoUrl || recording.url || null,
        thumbnail: recording.thumbnailUrl || recording.thumbnail || null,
        duration: formatDuration(recording.duration || recording.durationSeconds),
      };
    }) || [];

  const totalResults = dataRecordings?.pagination?.totalCount || 0;

  return (
    <div className="p-6 bg-surface min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Recordings</h1>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg p-6 mb-6 border border-neutral-700">
        {/* First Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Site Location */}
          <InputSelect
            label="Site Location"
            required
            options={siteOptions}
            value={filters.siteLocation}
            onChange={(value) =>
              setFilters({ ...filters, siteLocation: value })
            }
            placeholder="Select site"
            isClearable
          />

          {/* Area(s) - Multi-select */}
          <InputSelect
            label="Area(s)"
            required
            options={areaOptions}
            value={filters.areas}
            onChange={(value) => setFilters({ ...filters, areas: value })}
            placeholder="Select areas"
            isMulti
            isClearable
          />

          {/* Camera(s) - Multi-select */}
          <InputSelect
            label="Camera(s)"
            required
            options={cameraOptions}
            value={filters.cameras}
            onChange={(value) => setFilters({ ...filters, cameras: value })}
            placeholder="Select cameras"
            isMulti
            isClearable
          />
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Start Date */}
          <InputDate
            label="Start Date"
            required
            value={filters.startDate}
            onChange={(value) => setFilters({ ...filters, startDate: value })}
            maxDate={filters.endDate || undefined}
            placeholder="Select start date"
          />

          {/* End Date */}
          <InputDate
            label="End Date"
            required
            value={filters.endDate}
            onChange={(value) => setFilters({ ...filters, endDate: value })}
            minDate={filters.startDate || undefined}
            placeholder="Select end date"
          />

          {/* Search */}
          <div>
            <label className="block text-sm text-textSecondary font-medium mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search recording (e.g. REC_001)"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="text-sm w-full px-4 py-2.5 bg-transparent text-textSecondary rounded-lg border border-neutral-700 focus:border-brand focus:outline-none placeholder-textSecondary hover:border-neutralHover"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-4">
          <button
            onClick={handleReset}
            className="rounded-lg border border-neutral-700 bg-neutral-700 px-[16px] py-[10px] text-[14px] font-medium text-neutral-400 transition-all duration-200 hover:bg-neutral-active active:scale-95"
          >
            Reset
          </button>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-lg px-[16px] py-[10px] text-[14px] font-medium text-textLight transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(77.14deg, #EE4D2D 14.94%, #AC0001 93.95%)",
            }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
        </div>
      </div>

      {/* Results Count */}
      {!isLoadingRecordings && (
        <div className="mb-4">
          <p className="text-textSecondary text-sm">
            {totalResults > 0
              ? `${totalResults} Results Found:`
              : "No Recordings Found."}
          </p>
        </div>
      )}

      {/* Recording Cards Grid */}
      {isLoadingRecordings ? (
        <div className="flex justify-center items-center h-64">
          <span className="text-textSecondary">Loading recordings...</span>
        </div>
      ) : recordings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={recording}
              onClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="cursor"
          message="There's nothing to show here at the moment."
        />
      )}

      {/* Pagination (Optional - can add later if needed) */}
      {recordings.length > 0 && dataRecordings?.pagination?.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-surface-elevated text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
            >
              Previous
            </button>
            <span className="text-textSecondary px-4">
              Page {currentPage} of {dataRecordings?.pagination?.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage >= dataRecordings?.pagination?.totalPages}
              className="px-4 py-2 bg-surface-elevated text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Recording Detail Modal */}
      <RecordingDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        recording={selectedRecording}
      />
    </div>
  );
};

export default RecordingsPage;
