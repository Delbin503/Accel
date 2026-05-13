import React, { useEffect, useRef, useState } from "react";
import { SecondaryButton, PrimaryButton } from "components/common/Button";
import Table from "components/common/Table";
import InputSelect from "components/common/InputSelect";
import { useGetStationsQuery } from "services/sitemanagement";
import { useGetActivityLogsQuery } from "services/activityLog";

const ActivityLog = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [siteOptions, setSiteOptions] = useState([]);
  const hasInitializedSiteOptions = useRef(false);

  const [filters, setFilters] = useState({
    deviceType: { value: "all", label: "All devices" },
    siteLocation: null,
    area: null,
    search: "",
  });

  // Get Stations for area filter
  const { data: dataStationsQuery } = useGetStationsQuery({
    entityPerPage: 999,
    pageNum: 1,
  });

  // Get Activity Logs
  const {
    data: dataActivityLogs,
    refetch: refetchActivityLogs,
    isLoading: isLoadingActivityLogs,
  } = useGetActivityLogsQuery({
    page: currentPage,
    limit: pageSize,
    search: filters.search,
    deviceType:
      filters.deviceType?.value !== "all" ? filters.deviceType?.value : "",
    siteLocation: filters.siteLocation?.label || "",
    area: filters.area?.value || "",
  });

  const areaOptions = dataStationsQuery?.data.map((station) => ({
    value: station.uID,
    label: station.name,
  }));

  // getting the site option for the first time
  useEffect(() => {
    if (dataActivityLogs?.data && !hasInitializedSiteOptions.current) {
      const uniqueSiteOptions = [
        ...new Map(
          dataActivityLogs.data
            .filter((log) => log.metadata?.siteLocation)
            .map((log) => [
              log.metadata.siteLocation,
              {
                value: log.metadata.siteLocation,
                label: log.metadata.siteLocation,
              },
            ])
        ).values(),
      ];

      setSiteOptions(uniqueSiteOptions);
      hasInitializedSiteOptions.current = true;
    }
  }, [dataActivityLogs]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    refetchActivityLogs();
  };

  // Handle reset filters
  const handleReset = () => {
    setFilters({
      deviceType: { value: "all", label: "All devices" },
      siteLocation: null,
      area: null,
      search: "",
    });
    setCurrentPage(1);
  };

  // Options for select inputs
  const deviceTypeOptions = [
    { value: "all", label: "All devices" },
    { value: "CAM", label: "CAM" },
    { value: "NVR", label: "NVR" },
  ];

  // Transform API data to table format
  const activityLogs =
    dataActivityLogs?.data?.map((log) => ({
      id: log.uID || log._id,
      createdAt: log.createdAt,
      username: log.username || "N/A",
      nric: log.nric || "N/A",
      type: log.type || "N/A",
      module: log.module || "N/A",
      action: log.action || "N/A",
      description: log.description || "N/A",
      deviceType: log.metadata?.deviceType || "-",
      siteLocation: log.metadata?.siteLocation || "-",
      area: log.metadata?.area || "-",
    })) || [];

  const columns = [
    {
      accessorKey: "createdAt",
      header: "Time",
      cell: ({ getValue }) => {
        const raw = getValue();
        const dateObj = new Date(raw);

        const time = dateObj.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const day = dateObj.toLocaleString("en-US", { day: "2-digit" });
        const month = dateObj.toLocaleString("en-US", { month: "short" });
        const year = dateObj.getFullYear();

        const formattedDate = `${day} ${month}, ${year}`;

        return (
          <div className="text-textPrimary whitespace-nowrap">
            <div className="font-medium">{time}</div>
            <div className="text-sm text-textSecondary">{formattedDate}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Entry Type",
      cell: ({ getValue }) => {
        const type = getValue();
        const colorMap = {
          DEVICE_MANAGEMENT: "text-accent-orange-light border-accent-orange-light",
          SITE_MANAGEMENT: "text-accent-gold border-accent-gold",
          SYSTEM: "text-red-400 border-red-400",
          STORAGE_LINKING: "text-accent-violet-light border-accent-violet-light",
          DETECTION_RULES: "text-sky-400 border-sky-400",
          RECORDING_CONFIGURATIONS: "text-orange-400 border-orange-700",
        };

        const newType = type.replaceAll("_", " ").toLowerCase();

        return (
          <span
            className={`inline-flex items-center px-[10px] py-[4px] rounded-full capitalize text-xs font-medium border ${
              colorMap[type] || "text-gray-400 border-gray-700"
            }`}
          >
            {newType}
          </span>
        );
      },
    },
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-textPrimary">
            {row.original.username}
          </div>
          <div className="text-sm text-textSecondary">{row.original.nric}</div>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "Action & Description",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-textPrimary">
            {row.original.action}
          </span>
          <span className="text-textSecondary text-sm">
            {row.original.description}
          </span>
        </div>
      ),
    },

    // {
    //   accessorKey: "deviceType",
    //   header: "Device Type",
    //   cell: ({ getValue }) => (
    //     <span className="text-textSecondary text-sm">{getValue()}</span>
    //   ),
    // },
    // {
    //   accessorKey: "siteLocation",
    //   header: "Location",
    //   cell: ({ row }) => (
    //     <div>
    //       <div className="font-medium text-textPrimary text-sm">
    //         {row.original.siteLocation}
    //       </div>
    //       {row.original.area !== "-" && (
    //         <div className="text-xs text-gray-400">{row.original.area}</div>
    //       )}
    //     </div>
    //   ),
    // },
  ];

  return (
    <div className="p-6 bg-surface min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Activity Log</h1>
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg p-6 mb-6 border border-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Device Type */}
          <InputSelect
            label="Device Type"
            required
            options={deviceTypeOptions}
            value={filters.deviceType}
            onChange={(value) => setFilters({ ...filters, deviceType: value })}
            placeholder="Select device type"
          />

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
          />

          {/* Area */}
          <InputSelect
            label="Area(s)"
            required
            options={areaOptions}
            value={filters.area}
            onChange={(value) => setFilters({ ...filters, area: value })}
            placeholder="Select areas"
          />

          {/* Search */}
          <div>
            <label className="block text-sm text-textSecondary font-medium mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search activities..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="text-sm w-full px-4 py-2.5 bg-transparent text-textSecondary rounded-lg border border-neutral-700 focus:border-brand focus:outline-none placeholder-textSecondary hover:border-neutralHover"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-4">
          <SecondaryButton onClick={handleReset}>Reset</SecondaryButton>
          <PrimaryButton onClick={handleSearch}>Search</PrimaryButton>
        </div>
      </div>

      {/* Table */}
      {isLoadingActivityLogs ? (
        <div className="flex justify-center items-center h-64">
          <span className="text-textSecondary">Loading activity logs...</span>
        </div>
      ) : (
        <Table
          columns={columns}
          data={activityLogs}
          pagination={true}
          manualPagination={true}
          totalCount={dataActivityLogs?.pagination?.totalCount || 0}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          initialPageSize={pageSize}
          headerCellClassName="!text-textPrimary text-base font-normal"
          rowClassName="!text-textPrimary"
        />
      )}
    </div>
  );
};

export default ActivityLog;
