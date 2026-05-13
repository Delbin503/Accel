import { useState } from "react";
import { useQueryClient } from "react-query";
import Badge from "components/common/Badge";
import InputSelect from "components/common/InputSelect";
import { useNewAlertsQuery, markAllAlertsOpened } from "services/alertApi";

const AlertPopup = () => {
  const queryClient = useQueryClient();
  const [isEventsPopupOpen, setIsEventsPopupOpen] = useState(false);
  const [popupSeverityFilter, setPopupSeverityFilter] = useState("all");

  const { data: alertsData } = useNewAlertsQuery();
  const alerts = alertsData?.data || [];

  const handleMarkAllOpened = async () => {
    await markAllAlertsOpened();
    queryClient.invalidateQueries("newAlerts");
  };

  return (
    <>
      {/* Floating Alert Button */}
      <button
        onClick={() => setIsEventsPopupOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-700 shadow-lg hover:bg-neutral-600 border border-neutral-600"
      >
        <img src="/icons/exclamationRedIcon.svg" alt="Alert Icon" />
        {alerts?.length > 0 && (
          <span className="absolute right-0 top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gradient-to-r from-[#EE4D2D] to-[#AC0001] py-0.5 px-2 text-[10px] text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {/* Recent Detected Events Popup */}
      {isEventsPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50" onClick={() => setIsEventsPopupOpen(false)}>
          <div
            className="flex mt-40 h-full w-full rounded-lg max-w-[552px] flex-col bg-black border border-neutral-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-600 px-6 pt-6 pb-4">
              <p className="font-bold text-xl text-textPrimary">
                Recent Detected Events ({alerts?.length || 0})
              </p>
              <button
                onClick={() => setIsEventsPopupOpen(false)}
              >
                <img src="/icons/xIcon.svg" className="h-3 w-3" />
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4 border-neutral-700 px-4 py-3">
              <InputSelect
                className="flex-1"
                options={[
                  { value: "all", label: "All Severity" },
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
                value={
                  popupSeverityFilter
                    ? { value: popupSeverityFilter, label: popupSeverityFilter === "all" ? "All Severity" : popupSeverityFilter.charAt(0).toUpperCase() + popupSeverityFilter.slice(1) }
                    : { value: "all", label: "All Severity" }
                }
                onChange={(selected) => setPopupSeverityFilter(selected?.value || "all")}
                placeholder="All Severity"
                isSearchable={false}
                isClearable={false}
                fontSize="0.875rem"
              />
              <button
                onClick={handleMarkAllOpened}
                className="text-sm text-neutral-400 hover:text-neutral-200"
              >
                Clear All
              </button>
            </div>

            {/* Events List */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 mt-4">
              {alerts
                ?.filter((e) => popupSeverityFilter === "all" || e.severity === popupSeverityFilter)
                .map((event) => (
                  <div
                    key={event._id || event.id}
                    className="flex gap-3 w-[504px] rounded-lg bg-neutral-750 p-3"
                  >
                    <img
                      src={process.env.REACT_APP_API_URL + event?.thumbnail}
                      alt="thumbnail"
                      className="h-[140px] w-[211px] rounded border border-neutral-600 object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-neutral-50">
                            {event?.title || "Unknown Detection"}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {event?.area?.name || "Area Name"} / {event?.lane?.name || "Lane Name"} / {event?.cameraId || "Camera Name"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            event?.severity === "high"
                              ? "error"
                              : event?.severity === "medium"
                                ? "warning"
                                : "success"
                          }
                        >
                          {event?.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-300">
                        <img src="/icons/clockIcon-white.svg" className="h-3 w-3" />
                        <p>
                          {event?.datetime
                            ? `${new Date(event.datetime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}  •  ${new Date(event.datetime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                            : "Unknown Time"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-300">
                        <img src="/icons/detectionZoneWhiteIcon.svg" className="h-3 w-3" />
                        <p>{event?.detectionClasses?.length || 0} Classes Detected</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-300">
                        <p>Confidence Score</p>
                        <Badge variant="success">
                          {event?.confidenceScore ? `${event.confidenceScore}` : "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              {alerts?.filter((e) => popupSeverityFilter === "all" || e.severity === popupSeverityFilter).length === 0 && (
                <p className="py-8 text-center text-sm text-neutral-500">No events found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertPopup;
