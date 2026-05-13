import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useRef, useEffect } from "react";
import Badge from "components/common/Badge";
import { useDashboardQuery } from "services/dashboard";
import InputSelect from "components/common/InputSelect";

const Dashboard = () => {
  const [sortBy, setSortBy] = useState("today");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedDetection, setSelectedDetection] = useState("all");
  const [selectedTrends, setSelectedTrends] = useState([
    "object_detection",
    "intrusion_detection",
    "motion_detection",
    "vehicle_detection",
    "loitering_detection",
  ]);
  const [isTrendFilterOpen, setIsTrendFilterOpen] = useState(false);
  const trendFilterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (trendFilterRef.current && !trendFilterRef.current.contains(e.target)) {
        setIsTrendFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTrendFilter = (key) => {
    setSelectedTrends((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Fetch dashboard data from backend
  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useDashboardQuery({
    timeRange: sortBy,
    eventLimit: 50,
    eventFilters: {
      severity: selectedSeverity !== "all" ? selectedSeverity : undefined,
      type: selectedDetection !== "all" ? selectedDetection : undefined,
    },
  });

  // Extract data with fallbacks
  const metrics = dashboardData?.metrics || {};
  const rawChartData = dashboardData?.trends?.data || [];
  const chartData = rawChartData.map((item) => ({
    date: item.date,
    ...item.events,
    totalEvents: Object.values(item.events || {}).reduce((sum, val) => sum + val, 0),
  }));
  const recentEvents = dashboardData?.recentEvents?.data || [];
  const rawSeverity = dashboardData?.severityData || {};
  const severityTotal = (rawSeverity.high || 0) + (rawSeverity.medium || 0) + (rawSeverity.low || 0);
  const severityData = [
    { name: "High", value: severityTotal ? Math.round(((rawSeverity.high || 0) / severityTotal) * 100) : 0, color: "#EF4444" },
    { name: "Medium", value: severityTotal ? Math.round(((rawSeverity.medium || 0) / severityTotal) * 100) : 0, color: "#FEAA01" },
    { name: "Low", value: severityTotal ? Math.round(((rawSeverity.low || 0) / severityTotal) * 100) : 0, color: "#22C55E" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1D1D1D]">
        <p className="text-lg text-textPrimary">Loading dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1D1D1D]">
        <p className="text-lg text-red-500">Failed to load dashboard data</p>
      </div>
    );
  }

  // Detection health score
  const detectionScore = 93;
  const maxScore = 100;

  const metricCard = ({ title, value, secondValue, icon }) => {
    return (
      <div className="flex gap-4 rounded-md bg-neutral-850 p-6">
        <div className="h-fit rounded-md bg-neutral-600 p-1">
          <img src={icon} className="h-6 w-6" />
        </div>
        <div className="flex flex-col gap-1 text-textPrimary">
          <p className="text-lg">{title}</p>
          {secondValue ? (
            <div className="flex items-baseline gap-1">
              <p className="text-[28px] font-semibold text-green-500">{value}</p>
              <p className="text-lg text-neutral-300">/{secondValue}</p>
            </div>
          ) : (
            <p className="text-[28px] font-semibold">{value}</p>
          )}
        </div>
      </div>
    );
  };

  const detectionTrendsNames = [
    { name: "Object Detection", key: "object_detection", color: "#FE5C01", hover_color: "#F2A070" },
    {
      name: "Intrusion Detection",
      key: "intrusion_detection",
      color: "#FEAA01",
      hover_color: "#FCD34D",
    },
    { name: "Motion Detection", key: "motion_detection", color: "#A30B95", hover_color: "#C4B5FD" },
    {
      name: "Vehicle Detection",
      key: "vehicle_detection",
      color: "#14B8A6",
      hover_color: "#5EEAD4",
    },
    {
      name: "Loitering Detection",
      key: "loitering_detection",
      color: "#84CC16",
      hover_color: "#BEF264",
    },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-[#1D1D1D] p-6">
      <h1 className="text-2xl font-bold text-textPrimary">Dashboard</h1>

      {/* Top metrics cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCard({
          title: "Sites (Total)",
          value: metrics?.sites,
          icon: "/icons/detectedZoneRedIcon.svg",
        })}
        {metricCard({
          title: "Areas (Total)",
          value: metrics?.areas?.active,
          secondValue: metrics?.areas?.total,
          icon: "/icons/locationMarkerRedIcon.svg",
        })}
        {metricCard({
          title: "Active Cameras",
          value: metrics?.cameras?.active,
          secondValue: metrics?.cameras?.total,
          icon: "/icons/videoCameraRedIcon.svg",
        })}
        {metricCard({
          title: "Active NVRs",
          value: metrics?.nvrs?.active,
          secondValue: metrics?.nvrs?.total,
          icon: "/icons/serverRedIcon.svg",
        })}
      </div>

      {/* Event Severity Breakdown and Detection Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Event Severity Breakdown */}
        <div className="rounded-lg bg-neutral-850 p-6">
          <h2 className="mb-6 text-lg font-semibold text-textPrimary">Event Severity Breakdown</h2>
          <div className="flex items-center justify-between">
            {/* Donut Chart */}
            <div className="relative h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-1/2 space-y-4">
              {severityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <p className="text-sm text-textPrimary">{item.name}</p>
                  </div>
                  <p className="text-lg font-semibold text-textPrimary">{item.value}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detection Health */}
        <div className="rounded-lg bg-neutral-850 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-textPrimary">Detection Health</h2>
            <Badge variant="high">High</Badge>
          </div>
          <div className="flex items-center justify-between">
            {/* Circular Progress */}
            <div className="relative h-48 w-48">
              <svg className="h-full w-full -rotate-90 transform">
                {/* Background circle */}
                <circle cx="96" cy="96" r="80" stroke="#333" strokeWidth="16" fill="none" />
                {/* Progress circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#22C55E"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${(detectionScore / maxScore) * 502.65} 502.65`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-textPrimary">{detectionScore}</span>
                <span className="text-sm text-gray-400">out of {maxScore}</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex max-w-xs flex-col gap-8">
              <div className="flex gap-4 rounded-md bg-neutral-700 p-3">
                <img
                  src={"/icons/trendingUpRedIcon.svg"}
                  className="rounded-md bg-neutral-600 p-1"
                />
                <p className="text-neutral-300">Tracked in the last 24 hours</p>
              </div>
              <p className="text-sm text-neutral-300">
                Safety score is derived from Coverage % (25%), Detection Score (30%), Response Score
                (25%), and Availability (20%) over the selected time period.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Analysis Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-textPrimary">Event Analysis</h2>
          <InputSelect
            options={[
              { value: "today", label: "Sort By: Today" },
              { value: "week", label: "Sort By: This Week" },
              { value: "month", label: "Sort By: This Month" },
              { value: "year", label: "Sort By: This Year" },
            ]}
            value={{ value: sortBy, label: `Sort By: ${sortBy === "today" ? "Today" : sortBy === "week" ? "This Week" : sortBy === "month" ? "This Month" : "This Year"}` }}
            onChange={(selected) => setSortBy(selected?.value || "today")}
            isSearchable={false}
            isClearable={false}
            fontSize="0.875rem"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Detection Trends */}
          <div className="rounded-lg bg-neutral-850 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-textPrimary">Detection Trends</h3>
              <div className="relative" ref={trendFilterRef}>
                <button
                  onClick={() => setIsTrendFilterOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-md border border-neutral-600 bg-transparent px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-textPrimary">Filter:</span>
                    <span className="flex items-center justify-center rounded-full bg-[#F5722780] px-[10px] py-[5px] text-xs font-medium text-white">
                      {selectedTrends.length}
                    </span>
                  </div>
                  <img src={"/icons/filterWhiteIcon.svg"} />
                </button>
                {isTrendFilterOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-[#404040] bg-[#242424] py-1 shadow-lg">
                    {detectionTrendsNames.map((item) => (
                      <label
                        key={item.key}
                        className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-[#333333]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTrends.includes(item.key)}
                          onChange={() => toggleTrendFilter(item.key)}
                          className="h-4 w-4 rounded border-gray-600 accent-[#F59E0B]"
                        />
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-xs text-textPrimary">{item.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke="#404040"
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888888", fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    label={{
                      value: "Detected Events",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: { fill: "#D4D4D4", fontSize: 14, textAnchor: "middle" },
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888888", fontSize: 13 }}
                    domain={[0, 300]}
                    ticks={[0, 50, 100, 150, 200, 250, 300]}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1D1D1D",
                      border: "1px solid #404040",
                      borderRadius: "8px",
                      color: "#FCFCFD",
                    }}
                    labelStyle={{ color: "#888888" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="flex flex-col gap-2 rounded-lg border border-[#404040] bg-[#1D1D1D] px-4 py-3">
                          <p className="text-xs text-neutral-50">
                            Total Detections ({detectionTrendsNames.length})
                          </p>
                          <p className="mb-2 text-xs text-neutral-300">{label}</p>
                          <div className="flex flex-col gap-1">
                            {[...payload]
                              .sort((a, b) => b.value - a.value)
                              .map((entry) => {
                                const trend = detectionTrendsNames.find(
                                  (t) => t.key === entry.dataKey
                                );
                                return (
                                  <p
                                    key={entry.dataKey}
                                    className="text-ellipsis text-sm"
                                    style={{ color: trend?.hover_color || entry.color }}
                                  >
                                    {entry.value} ({entry.name})
                                  </p>
                                );
                              })}
                          </div>
                        </div>
                      );
                    }}
                  />
                  {detectionTrendsNames
                    .filter((item) => selectedTrends.includes(item.key))
                    .map((item) => (
                      <Line
                        key={item.key}
                        type="linear"
                        dataKey={item.key}
                        stroke={item.color}
                        strokeWidth={2}
                        dot={false}
                        name={item.name}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-6">
              {detectionTrendsNames.map((item, index) => (
                <div className="flex items-center gap-3" key={index}>
                  <div
                    className={`h-4 w-4 rounded-full`}
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-neutral-300">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Trends */}
          <div className="rounded-lg bg-neutral-850 p-6">
            <h3 className="mb-4 text-base font-semibold text-textPrimary">Event Trends</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke="#404040"
                    vertical={true}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888888", fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    label={{
                      value: "Detected Events",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: { fill: "#D4D4D4", fontSize: 14, textAnchor: "middle" },
                    }}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#888888", fontSize: 13 }}
                    domain={[0, 300]}
                    ticks={[0, 50, 100, 150, 200, 250, 300]}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1D1D1D",
                      border: "1px solid #404040",
                      borderRadius: "8px",
                      color: "#FCFCFD",
                    }}
                    labelStyle={{ color: "#888888" }}
                    itemStyle={{ color: "#F59E0B" }}
                  />
                  <Line
                    type="linear"
                    dataKey="totalEvents"
                    stroke="#FE5C01"
                    strokeWidth={2}
                    dot={false}
                    name="Detected Events"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Events Section */}
      <div className="rounded-lg bg-neutral-850 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-textPrimary">Detected Events</h2>
            <p className="rounded-3xl bg-red-100 px-2.5 py-1 text-center text-sm text-red-500">
              {recentEvents?.length}
            </p>
          </div>

          {/* Filters - Right aligned */}
          <div className="flex w-1/2 gap-3">
            {/* Severity Filter */}
            <InputSelect
              className="flex-1"
              options={[
                { value: "all", label: "All Severity" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
              value={
                selectedSeverity
                  ? { value: selectedSeverity, label: selectedSeverity === "all" ? "All Severity" : selectedSeverity.charAt(0).toUpperCase() + selectedSeverity.slice(1) }
                  : { value: "all", label: "All Severity" }
              }
              onChange={(selected) => setSelectedSeverity(selected?.value || "all")}
              placeholder="All Severity"
              isSearchable={false}
              isClearable={false}
              fontSize="0.875rem"
            />

            {/* Detection Type Filter */}
            <InputSelect
              className="flex-1"
              options={[
                { value: "all", label: "All Detections" },
                ...detectionTrendsNames.map((item) => ({ value: item.key, label: item.name })),
              ]}
              value={
                selectedDetection === "all"
                  ? { value: "all", label: "All Detections" }
                  : { value: selectedDetection, label: detectionTrendsNames.find((d) => d.key === selectedDetection)?.name || selectedDetection }
              }
              onChange={(selected) => setSelectedDetection(selected?.value || "all")}
              placeholder="All Detections"
              isSearchable={false}
              isClearable={false}
              fontSize="0.875rem"
            />
          </div>
        </div>

        {/* Events List */}
        <div className="grid max-h-[450px] grid-cols-2 gap-4 overflow-y-auto">
          {recentEvents?.length > 0 ? (
            recentEvents?.map((event) => (
              <div
                key={event.id}
                className="bg-neutral-750 flex w-full gap-4 rounded-md px-4 py-2.5"
              >
                <img
                  src={process.env.REACT_APP_API_URL + event?.thumbnail}
                  className="rounded-[4.53px] border-[0.75px] border-neutral-600"
                />
                <div className="flex w-full flex-col items-center gap-4">
                  <div className="flex w-full justify-between">
                    <div className="flex justify-center gap-3">
                      <p className="text-sm text-neutral-50">
                        {event?.title || "Unknown Detection"}
                      </p>
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

                    <div className="flex items-center gap-1 rounded-full bg-[#323232B2] px-2 py-0.5">
                      <img src={"/icons/detectionZoneWhiteIcon.svg"} className="h-4 w-4" />
                      <p className="text-xs text-neutral-300">
                        {event?.detectionClasses?.length || 0} Classes Detected
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-[25px]">
                    <div className="flex items-center justify-between text-xs text-neutral-300">
                      <p>{event?.cameraId || "Unknown Camera"}</p>
                      <div className="flex items-center gap-1">
                        <p>Precision Score</p>
                        <Badge variant="success">
                          {event?.precisionScore ? `${event.precisionScore}` : "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-[25px]">
                    <div className="flex items-center justify-between text-xs text-neutral-300">
                      <div className="flex items-center gap-1">
                        <img src="/icons/clockIcon-white.svg" />
                        <p>
                          {event?.datetime
                            ? `${new Date(event.datetime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}  •  ${new Date(event.datetime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                            : "Unknown Time"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p>Confidence Score</p>
                        <Badge variant="success">
                          {event?.confidenceScore ? `${event.confidenceScore}` : "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-[#888888]">No recent events</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
