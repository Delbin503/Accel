import React, { useState, useEffect, useMemo } from "react";
import { getSites } from "services/site";
import { toast } from "react-toastify";
import Table from "components/common/Table";
import Badge from "components/common/Badge";
import InputSearch from "components/common/InputSearch";

const SiteManagement = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("siteName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchSites();
  }, [searchTerm, sortBy, sortOrder, currentPage, pageSize, statusFilter]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await getSites({
        search: searchTerm,
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
        status: statusFilter,
      });

      let sitesData = [];
      if (Array.isArray(response.data)) {
        sitesData = response.data;
      } else if (response.data && typeof response.data === "object") {
        sitesData = [response.data];
      }

      setSites(sitesData);
      setPagination(
        response.pagination || {
          totalCount: sitesData.length,
          totalPages: Math.ceil(sitesData.length / pageSize),
          currentPage: 1,
          pageSize: pageSize,
        }
      );
    } catch (error) {
      console.error("Error fetching sites:", error);
      toast.error("Failed to load sites");
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: "—", time: "" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }),
    };
  };

  const columns = useMemo(
    () => [
      {
        header: "Site ID",
        accessorKey: "siteID",
        cell: ({ getValue }) => (
          <span className="text-base font-medium text-textPrimary">{getValue()}</span>
        ),
      },
      {
        header: "Site Name",
        accessorKey: "siteName",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium text-textPrimary">
              {row.original.siteName}
            </span>
            <span className="text-sm font-normal text-textSecondary">
              {row.original.siteShortName}
            </span>
          </div>
        ),
      },
      {
        header: "Site Status",
        accessorKey: "siteStatus",
        cell: ({ row }) => {
          const status = row.original.siteStatus || row.original.status || "inactive";
          const isActive = status?.toLowerCase() === "active";
          return (
            <Badge
              appearance="border"
              variant={isActive ? "success" : "error"}
              textSize="text-sm"
              size="sm"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        header: "Devices (Total)",
        accessorKey: "devices",
        enableSorting: false,
        cell: ({ getValue }) => {
          const devices = getValue();
          const cam = devices?.cameras || {};
          const nvr = devices?.nvrs || {};
          const camActive = cam.active ?? 0;
          const camTotal = cam.total ?? 0;
          const nvrActive = nvr.active ?? 0;
          const nvrTotal = nvr.total ?? 0;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <img
                  src="/icons/videoCameraWhiteIcon.svg"
                  className="h-5 w-5 flex-shrink-0"
                  alt="Camera"
                />
                <span className="text-base font-medium text-textSecondary">
                  <span className={camActive > 0 ? "text-green-500" : "text-red-400"}>
                    {camActive}
                  </span>
                  {" / "}
                  {camTotal} Cams
                </span>
              </div>
              <div className="flex items-center gap-2">
                <img
                  src="/icons/serverWhiteIcon.svg"
                  className="h-5 w-5 flex-shrink-0"
                  alt="NVR"
                />
                <span className="text-base font-medium text-textSecondary">
                  <span className={nvrActive > 0 ? "text-green-500" : "text-red-400"}>
                    {nvrActive}
                  </span>
                  {" / "}
                  {nvrTotal} NVRs
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Areas (Total)",
        accessorKey: "areasCount",
        cell: ({ row }) => (
          <span className="text-base font-medium text-textPrimary">
            {row.original.areasCount || row.original.areas || 0} Areas
          </span>
        ),
      },
      {
        header: "Lanes (Total)",
        accessorKey: "lanesCount",
        cell: ({ row }) => (
          <span className="text-base font-medium text-textPrimary">
            {row.original.lanesCount || row.original.lanes || 0} Lanes
          </span>
        ),
      },
      {
        header: "Last Activity Date",
        accessorKey: "lastActivityDate",
        cell: ({ getValue }) => {
          const { date, time } = formatDate(getValue());
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-normal text-textPrimary">{date}</span>
              <span className="text-sm font-normal text-textSecondary">{time}</span>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Title + toolbar on same row */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-textPrimary flex-shrink-0">Site Management</h1>

        <div className="flex items-center gap-3">
        {/* Search */}
        <InputSearch
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[375px] h-[40px]"
        />

        {/* Sort By */}
        <div className="relative flex flex-shrink-0 items-center">
          {/* visible label + value */}
          <span className="pointer-events-none text-sm text-textSecondary whitespace-nowrap pr-1">
            Sort By:
          </span>
          <span className="pointer-events-none text-sm font-medium text-textPrimary whitespace-nowrap pr-1">
            {sortBy === "siteName" ? "Default" : sortBy === "siteId" ? "Site ID" : sortBy === "status" ? "Status" : "Last Activity"}
          </span>
          {/* chevron 20×20 */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none flex-shrink-0">
            <path d="M15 8L10 13L5 8" stroke="#98A2B3" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* invisible native select covering the whole area */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="absolute inset-0 cursor-pointer appearance-none bg-transparent opacity-0"
          >
            <option value="siteName">Default</option>
            <option value="siteId">Site ID</option>
            <option value="status">Status</option>
            <option value="lastActivityDate">Last Activity</option>
          </select>
        </div>

        {/* Filter */}
        <div className="flex flex-shrink-0 items-center gap-2 rounded border border-neutral-600 px-3 py-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-transparent text-sm text-textPrimary focus:outline-none"
          >
            <option value="all" className="bg-neutral-800">Filter</option>
            <option value="active" className="bg-neutral-800">Active</option>
            <option value="inactive" className="bg-neutral-800">Inactive</option>
          </select>
          <img
            src="/icons/filterWhiteIcon.svg"
            alt="Filter"
            className="h-5 w-5 flex-shrink-0 pointer-events-none"
          />
        </div>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={loading ? [] : sites}
        manualPagination
        totalCount={pagination.totalCount}
        currentPage={currentPage}
        initialPageSize={pageSize}
        onPageChange={(newPage) => setCurrentPage(newPage)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        maxHeight="calc(100vh - 240px)"
      />
    </div>
  );
};

export default SiteManagement;
