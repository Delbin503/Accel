import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactPlayer from "react-player";
import Modal from "components/common/Modal";
import EventDetailsModal from "./EventDetailsModal";

const RecordingDetailModal = ({ isOpen, onClose, recording }) => {
  const [activeTab, setActiveTab] = useState("video");
  const [selectedSeverity, setSelectedSeverity] = useState(["all"]);
  const [isSeverityOpen, setIsSeverityOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const severityRef = useRef(null);

  // Video player state
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const formatTime = useCallback((seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSkip = (seconds) => {
    const current = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(current + seconds);
  };

  // Close severity dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (severityRef.current && !severityRef.current.contains(event.target)) {
        setIsSeverityOpen(false);
      }
    };

    if (isSeverityOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSeverityOpen]);

  // Reset event modal state when RecordingDetailModal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEventDetailsOpen(false);
      setSelectedEvent(null);
    }
  }, [isOpen]);

  if (!recording) return null;

  const { title = "Recording_25.2.2025", location = {}, events = { count: 0 } } = recording;

  // Mock events data - replace with actual API data
  const detectedEvents = [
    {
      id: 1,
      type: "Intrusion Detected",
      severity: "High",
      timestamp: "00:00:15",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 2,
      thumbnail: null,
    },
    {
      id: 2,
      type: "Object Detected",
      severity: "Low",
      timestamp: "00:05:30",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 1,
      thumbnail: null,
    },
    {
      id: 3,
      type: "Object Detected",
      severity: "Medium",
      timestamp: "00:07:01",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 2,
      thumbnail: null,
    },
    {
      id: 4,
      type: "Intrusion Detected",
      severity: "Low",
      timestamp: "00:09:15",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 2,
      thumbnail: null,
    },
    {
      id: 5,
      type: "Intrusion Detected",
      severity: "High",
      timestamp: "00:12:45",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 2,
      thumbnail: null,
    },
    {
      id: 6,
      type: "Motion Detected",
      severity: "Medium",
      timestamp: "00:15:22",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 1,
      thumbnail: null,
    },
    {
      id: 7,
      type: "Intrusion Detected",
      severity: "High",
      timestamp: "00:18:30",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 3,
      thumbnail: null,
    },
    {
      id: 8,
      type: "Object Detected",
      severity: "Low",
      timestamp: "00:20:45",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 1,
      thumbnail: null,
    },
    {
      id: 9,
      type: "Intrusion Detected",
      severity: "Medium",
      timestamp: "00:23:10",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 2,
      thumbnail: null,
    },
    {
      id: 10,
      type: "Motion Detected",
      severity: "Low",
      timestamp: "00:25:50",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 1,
      thumbnail: null,
    },
    {
      id: 11,
      type: "Intrusion Detected",
      severity: "High",
      timestamp: "00:28:15",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 4,
      thumbnail: null,
    },
    {
      id: 12,
      type: "Object Detected",
      severity: "Medium",
      timestamp: "00:30:30",
      date: "23 Mar. 2025",
      location: "Station H Lane 11 Changhwu_Cam_001",
      objectsCount: 2,
      thumbnail: null,
    },
  ];

  const severityOptions = [
    { value: "all", label: "All Severity" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const handleSeverityToggle = (value) => {
    let newValue;

    if (value === "all") {
      if (selectedSeverity.includes("all")) {
        newValue = [];
      } else {
        newValue = ["all", "high", "medium", "low"];
      }
    } else {
      if (selectedSeverity.includes(value)) {
        newValue = selectedSeverity.filter((v) => v !== value && v !== "all");
      } else {
        newValue = [...selectedSeverity.filter((v) => v !== "all"), value];

        if (newValue.length === 3) {
          newValue = ["all", ...newValue];
        }
      }
    }

    setSelectedSeverity(newValue);
  };

  const getSeverityDisplayText = () => {
    if (selectedSeverity.length === 0) {
      return "Select severity";
    }

    if (selectedSeverity.includes("all")) {
      return "All Severity";
    }

    const selectedLabels = severityOptions
      .filter((opt) => selectedSeverity.includes(opt.value))
      .map((opt) => opt.label);

    return selectedLabels.join(", ");
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High":
        return "text-red-500";
      case "Medium":
        return "text-orange-500";
      case "Low":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleCloseEventDetails = () => {
    setIsEventDetailsOpen(false);
    setSelectedEvent(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm text-gray-400">{location.camera || "Changi_Hub_Cam_001"}</p>
          </div>
        }
        size="full"
        closeOnOverlayClick={true}
        showCloseButton={true}
        maxHeight="h-[calc(100vh-64px)]"
        closeButtonPosition="absolute"
        verticalAlign="top"
        offsetSidebar={true}
        topPadding="pt-[54px]"
        containerPadding="p-0"
        bodyScrollable={false}
        animationType="slide-right"
      >
        {/* Tabs */}
        <div className="mb-6 flex flex-shrink-0 space-x-6 border-b border-neutral-700">
          <button
            onClick={() => setActiveTab("video")}
            className={`relative px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "video" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Video Stream
            {activeTab === "video" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cream" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`relative px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === "events" ? "text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Events List
            {activeTab === "events" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cream" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
          {/* Video Player Section - Show when video tab is active */}
          {activeTab === "video" && (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Video Stream Label */}
                <p className="mb-2 flex-shrink-0 text-sm font-medium text-textSecondary">Video Stream</p>

                {/* Video Player with Custom Controls */}
                <div className="flex-shrink-0 overflow-hidden rounded-lg bg-black">
                  {recording?.videoUrl ? (
                    <>
                      <div style={{ aspectRatio: "16/9" }}>
                        <ReactPlayer
                          ref={playerRef}
                          url={recording.videoUrl}
                          playing={playing}
                          controls={false}
                          width="100%"
                          height="100%"
                          onProgress={handleProgress}
                          onDuration={setDuration}
                          config={{
                            file: {
                              attributes: {
                                poster: recording.thumbnail || undefined,
                              },
                            },
                          }}
                        />
                      </div>

                      {/* Custom Controls */}
                      <div className="flex flex-col gap-3 bg-surface-deeper px-4 py-3">
                        {/* Seek Bar Row */}
                        <div className="flex items-center gap-3">
                          <span className="min-w-[40px] text-sm font-medium text-green-500">{formatTime(played * duration)}</span>
                          <div className="relative flex-1 flex items-center">
                            <div className="absolute h-1.5 w-full rounded-full bg-neutral-600" />
                            <div
                              className="absolute h-1.5 rounded-full bg-white"
                              style={{ width: `${played * 100}%` }}
                            />
                            <input
                              type="range"
                              min={0}
                              max={0.999999}
                              step="any"
                              value={played}
                              onMouseDown={handleSeekMouseDown}
                              onChange={handleSeekChange}
                              onMouseUp={handleSeekMouseUp}
                              className="relative z-10 h-1.5 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
                            />
                          </div>
                          <span className="min-w-[40px] text-right text-sm text-gray-400">{formatTime(duration)}</span>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-center relative">
                          {/* Center Controls */}
                          <div className="flex items-center gap-4">
                            {/* Rewind */}
                            <button onClick={() => handleSkip(-10)} className="text-gray-300 hover:text-white transition-colors">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11 18l-6-6 6-6v12zm7 0l-6-6 6-6v12z" />
                              </svg>
                            </button>

                            {/* Play/Pause */}
                            <button onClick={() => setPlaying(!playing)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-700 text-white transition-colors hover:bg-neutral-600">
                              {playing ? (
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>

                            {/* Forward */}
                            <button onClick={() => handleSkip(10)} className="text-gray-300 hover:text-white transition-colors">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6l6 6-6 6V6zm7 0l6 6-6 6V6z" />
                              </svg>
                            </button>
                          </div>

                          {/* Right Controls */}
                          <div className="absolute right-0 flex items-center gap-3">
                            {/* Volume */}
                            <button className="text-gray-400 hover:text-white transition-colors">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                              </svg>
                            </button>

                            {/* Fullscreen */}
                            <button
                              onClick={() => {
                                const el = playerRef.current?.wrapper;
                                if (el?.requestFullscreen) el.requestFullscreen();
                              }}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center bg-surface-dark" style={{ aspectRatio: "16/9" }}>
                      <div className="text-center">
                        <svg className="mx-auto mb-4 h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500">Video Not Available</p>
                        <p className="mt-1 text-sm text-gray-600">Video URL not provided</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detected Events Panel */}
              <div className="flex min-h-0 w-[680px] flex-1 flex-col overflow-hidden">
                <div className="mb-4 flex flex-shrink-0 items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Detected Events</h3>
                  <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white">
                    {detectedEvents.length}
                  </span>
                </div>

                {/* Filters */}
                <div className="mb-4 grid flex-shrink-0 grid-cols-2 gap-2">
                  {/* Severity Filter with Checkboxes */}
                  <div className="relative" ref={severityRef}>
                    <button
                      type="button"
                      onClick={() => setIsSeverityOpen(!isSeverityOpen)}
                      className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-textSecondary transition-colors focus:outline-none ${
                        isSeverityOpen
                          ? "border-amber-500 bg-surface-dark"
                          : "border-neutral-700 bg-surface-dark hover:border-neutralHover"
                      }`}
                    >
                      <span className="truncate">{getSeverityDisplayText()}</span>
                      <svg
                        className={`ml-2 h-4 w-4 transition-transform ${
                          isSeverityOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isSeverityOpen && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-surface-dark shadow-xl">
                        <div className="py-1">
                          {severityOptions.map((option) => {
                            const isChecked = selectedSeverity.includes(option.value);

                            return (
                              <label
                                key={option.value}
                                className="flex cursor-pointer items-center px-4 py-2.5 transition-colors hover:bg-surface-elevated"
                              >
                                {/* Custom Checkbox */}
                                <div className="relative flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleSeverityToggle(option.value)}
                                    className="sr-only"
                                  />
                                  <div
                                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                      isChecked
                                        ? "border-amber-500 bg-amber-500"
                                        : "border-neutralHover bg-transparent"
                                    }`}
                                  >
                                    {isChecked && (
                                      <svg
                                        className="h-3 w-3 text-white"
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
                                    )}
                                  </div>
                                </div>

                                {/* Label */}
                                <span className="ml-3 text-sm text-textSecondary">{option.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <select className="rounded-lg border border-neutral-700 bg-surface-dark px-3 py-2.5 text-sm text-textSecondary focus:border-brand focus:outline-none">
                    <option>All Detections</option>
                    <option>Intrusion</option>
                    <option>Object</option>
                  </select>
                </div>

                {/* Events List */}
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                  {detectedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="cursor-pointer rounded-lg bg-transparent p-2 transition-colors hover:bg-surface-dark"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="relative h-[144px] w-[208px] flex-shrink-0 overflow-hidden rounded bg-neutral-950">
                          {event.thumbnail || recording?.videoUrl ? (
                            <ReactPlayer
                              url={event.videoUrl || recording?.videoUrl}
                              playing={false}
                              controls={false}
                              light={event.thumbnail || true}
                              width="100%"
                              height="100%"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg
                                className="h-10 w-10 text-gray-600"
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
                          {/* Timestamp overlay - top left */}
                          <div className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                            {event.timestamp}
                          </div>
                          {/* EVT Badge - top right */}
                          <div className="absolute right-1.5 top-1.5 rounded bg-neutral-700 px-1.5 py-0.5 text-[11px] font-medium text-white">
                            EVT-{event.id}
                          </div>
                        </div>

                        {/* Event Info - Three Row Layout */}
                        <div className="flex min-w-0 flex-1 flex-col gap-5 py-2">
                          {/* Row 1: Title + Severity | Classes Detected */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-normal text-white">
                                {event.type}
                              </span>
                              <span
                                className={`flex-shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${
                                  event.severity === "High"
                                    ? "bg-red-600 text-white"
                                    : event.severity === "Medium"
                                      ? "bg-amber-500 text-white"
                                      : "bg-emerald-600 text-white"
                                }`}
                              >
                                {event.severity}
                              </span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-neutral-700 bg-surface-elevated px-2.5 py-1.5">
                              <svg
                                className="h-3.5 w-3.5 flex-shrink-0"
                                viewBox="0 0 16 16"
                                fill="none"
                              >
                                <path
                                  d="M2 5C2 3.34315 3.34315 2 5 2H6"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M2 6V5C2 3.34315 3.34315 2 5 2"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M14 5C14 3.34315 12.6569 2 11 2H10"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M14 6V5C14 3.34315 12.6569 2 11 2"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M14 11C14 12.6569 12.6569 14 11 14H10"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M14 10V11C14 12.6569 12.6569 14 11 14"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M2 11C2 12.6569 3.34315 14 5 14H6"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M2 10V11C2 12.6569 3.34315 14 5 14"
                                  stroke="#D4D4D4"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="whitespace-nowrap text-xs text-white">
                                {event.objectsCount} Classes Detected
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Camera name | Precision Score */}
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="truncate text-gray-400">{event.location}</span>
                            <div className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap">
                              <span className="text-gray-400">Precision Score</span>
                              <span className="font-medium text-emerald-500">0.99</span>
                            </div>
                          </div>

                          {/* Row 3: Timestamp | Confidence Score */}
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <div className="flex min-w-0 items-center gap-1.5 text-gray-400">
                              <svg
                                className="h-3.5 w-3.5 flex-shrink-0"
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
                              <span className="truncate">
                                {event.timestamp} • {event.date}
                              </span>
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap">
                              <span className="text-gray-400">Confidence Score</span>
                              <span className="font-medium text-emerald-500">0.99</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Events List Tab - Full Width */}
          {activeTab === "events" && (
            <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
              <h3 className="mb-4 flex-shrink-0 text-lg font-semibold text-white">Events List</h3>

              {/* Filters */}
              <div className="mb-4 grid flex-shrink-0 grid-cols-2 gap-2">
                {/* Severity Filter with Checkboxes */}
                <div className="relative" ref={severityRef}>
                  <button
                    type="button"
                    onClick={() => setIsSeverityOpen(!isSeverityOpen)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm text-textSecondary transition-colors focus:outline-none ${
                      isSeverityOpen
                        ? "border-amber-500 bg-surface-dark"
                        : "border-neutral-700 bg-surface-dark hover:border-neutralHover"
                    }`}
                  >
                    <span className="truncate">{getSeverityDisplayText()}</span>
                    <svg
                      className={`ml-2 h-4 w-4 transition-transform ${
                        isSeverityOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isSeverityOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-700 bg-surface-dark shadow-xl">
                      <div className="py-1">
                        {severityOptions.map((option) => {
                          const isChecked = selectedSeverity.includes(option.value);

                          return (
                            <label
                              key={option.value}
                              className="flex cursor-pointer items-center px-4 py-2.5 transition-colors hover:bg-surface-elevated"
                            >
                              {/* Custom Checkbox */}
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSeverityToggle(option.value)}
                                  className="sr-only"
                                />
                                <div
                                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                    isChecked
                                      ? "border-amber-500 bg-amber-500"
                                      : "border-neutralHover bg-transparent"
                                  }`}
                                >
                                  {isChecked && (
                                    <svg
                                      className="h-3 w-3 text-white"
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
                                  )}
                                </div>
                              </div>

                              {/* Label */}
                              <span className="ml-3 text-sm text-textSecondary">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <select className="rounded-lg border border-neutral-700 bg-surface-dark px-3 py-2.5 text-sm text-textSecondary focus:border-brand focus:outline-none">
                  <option>All Detections</option>
                  <option>Intrusion</option>
                  <option>Object</option>
                </select>
              </div>

              {/* Events List - Single Column */}
              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="space-y-3">
                  {detectedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="cursor-pointer rounded-lg border-2 border-accent-brown bg-surface-dark p-4 transition-colors hover:border-accent-brown-hover"
                    >
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-36 w-52 flex-shrink-0 overflow-hidden rounded bg-neutral-950">
                          {event.thumbnail || recording?.videoUrl ? (
                            <ReactPlayer
                              url={event.videoUrl || recording?.videoUrl}
                              playing={false}
                              controls={false}
                              light={event.thumbnail || true}
                              width="100%"
                              height="100%"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <svg
                                className="h-12 w-12 text-gray-600"
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
                          {/* Timestamp overlay - top left */}
                          <div className="absolute left-2 top-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
                            {event.timestamp}
                          </div>
                          {/* EVT Badge - top right */}
                          <div className="absolute right-2 top-2 rounded bg-brand px-2 py-1 text-xs font-semibold text-white">
                            EVT-{event.id}
                          </div>
                        </div>

                        {/* Event Info - Two Column Layout */}
                        <div className="flex flex-1 gap-6">
                          {/* Left Column */}
                          <div className="flex flex-1 flex-col gap-2">
                            {/* Title and Severity */}
                            <div className="flex items-center gap-3">
                              <span className="text-base font-semibold text-white">
                                {event.type}
                              </span>
                              <span
                                className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
                                  event.severity === "High"
                                    ? "bg-red-500/20 text-red-400"
                                    : event.severity === "Medium"
                                      ? "bg-orange-500/20 text-orange-400"
                                      : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {event.severity}
                              </span>
                            </div>

                            {/* Camera name */}
                            <div className="text-xs text-textSecondary">{event.location}</div>

                            {/* Timestamp with icon */}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <svg
                                className="h-4 w-4"
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
                              <span>
                                {event.timestamp} • {event.date}
                              </span>
                            </div>
                          </div>

                          {/* Right Column */}
                          <div className="flex min-w-[200px] flex-col items-end justify-center gap-2">
                            {/* Classes detected badge */}
                            <div className="flex items-center gap-2 rounded bg-surface-elevated px-3 py-1.5">
                              <svg
                                className="h-4 w-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                              </svg>
                              <span className="text-xs font-medium text-white">
                                {event.objectsCount} Classes Detected
                              </span>
                            </div>

                            {/* Scores */}
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-gray-400">Precision Score</span>
                              <span className="font-semibold text-green-500">0.99</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-gray-400">Confidence Score</span>
                              <span className="font-semibold text-green-500">0.99</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isEventDetailsOpen}
        onClose={handleCloseEventDetails}
        event={selectedEvent}
      />
    </>
  );
};

export default RecordingDetailModal;
