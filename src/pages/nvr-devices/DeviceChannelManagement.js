import React, { useState } from "react";
import { useGetNVRChannelsQuery } from "services/nvr";
import Badge from "components/common/Badge";
import LinkCameraModal from "../cameras/LinkCameraModal";
import UnlinkCameraModal from "../cameras/UnlinkCameraModal";

const DeviceChannelManagement = ({ selectedDevice }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const entriesPerPage = 9;

  // Fetch NVR channels from API
  const { data: channelsData, isLoading } = useGetNVRChannelsQuery(selectedDevice?.uID);

  // Transform API data to component format
  const allChannels = (channelsData?.data || []).map((channel) => {
    const isAvailable = channel.status === "available" || !channel.cameraID;
    const isOnline = channel.status === "online";

    return {
      channelNo: `Channel ${channel.channelNumber}`,
      cameraId: channel.cameraID || "-",
      cameraName: channel.cameraName || "No Camera Linked",
      status: isAvailable ? "Available" : isOnline ? "Connected" : "Offline",
      ipAddress: channel.ipAddress || "-",
      siteLocation: channel.siteLocation || "-",
      area: channel.area || "",
      connectedOn: channel.connectedOn
        ? new Date(channel.connectedOn)
            .toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })
            .replace(", ", "\n")
        : "-",
      channelNumber: channel.channelNumber, // Keep original for API calls
    };
  });

  // Fallback to mock data if no API data (for development)
  const mockChannels = [
    {
      channelNo: "Channel 1",
      cameraId: "CAM_001",
      cameraName: "ChangiHub_Cam_01",
      status: "Connected",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
    {
      channelNo: "Channel 2",
      cameraId: "Cam_002",
      cameraName: "ChangiHub_Cam_02",
      status: "Offline",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
    {
      channelNo: "Channel 3",
      cameraId: "CAM_003",
      cameraName: "ChangiHub_Cam_03",
      status: "Offline",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
    {
      channelNo: "Channel 4",
      cameraId: "-",
      cameraName: "No Camera Linked",
      status: "Available",
      ipAddress: "-",
      siteLocation: "-",
      area: "",
      connectedOn: "-",
    },
    {
      channelNo: "Channel 5",
      cameraId: "CAM_005",
      cameraName: "ChangiHub_Cam_05",
      status: "Connected",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
    {
      channelNo: "Channel 6",
      cameraId: "CAM_006",
      cameraName: "ChangiHub_Cam_06",
      status: "Connected",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
    {
      channelNo: "Channel 7",
      cameraId: "CAM_007",
      cameraName: "ChangiHub_Cam_07",
      status: "Offline",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
    {
      channelNo: "Channel 8",
      cameraId: "CAM_008",
      cameraName: "ChangiHub_Cam_08",
      status: "Offline",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
    {
      channelNo: "Channel 9",
      cameraId: "CAM_009",
      cameraName: "ChangiHub_Cam_09",
      status: "Connected",
      ipAddress: "3131.3131.1131",
      siteLocation: "FedEx Changi Hub",
      area: "Camp Area",
      connectedOn: "May 25, 2025\n08:00:00 AM",
    },
  ];

  // Use API data if available, otherwise use mock data
  const displayChannels = allChannels.length > 0 ? allChannels : mockChannels;

  // Filter channels based on search
  const filteredChannels = displayChannels.filter((channel) => {
    const query = searchQuery.toLowerCase();
    return (
      channel.channelNo.toLowerCase().includes(query) ||
      channel.cameraId.toLowerCase().includes(query) ||
      channel.cameraName.toLowerCase().includes(query) ||
      channel.status.toLowerCase().includes(query) ||
      channel.siteLocation.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredChannels.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentChannels = filteredChannels.slice(startIndex, endIndex);

  // Status badge variant mapping
  const getStatusVariant = (status) => {
    const statusMap = {
      Connected: "success",
      Offline: "error",
      Available: "info",
    };
    return statusMap[status] || "default";
  };

  // Handle action buttons
  const handleUnlink = (channel) => {
    setSelectedChannel(channel);
    setIsUnlinkModalOpen(true);
  };

  const handleLink = (channel) => {
    setSelectedChannel(channel);
    setIsLinkModalOpen(true);
  };

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium text-textPrimary">Channel Management</span>

        {/* Search Bar */}
        <div className="relative w-[300px]">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-transparent px-4 py-2 pr-10 text-sm text-textPrimary placeholder-textMuted focus:border-brand focus:outline-none"
          />
          <svg
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-textMuted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Table */}
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden rounded-lg border border-neutral-700 bg-surface">
          <table className="w-full table-fixed">
            <thead className="table h-full w-full table-fixed">
              <tr className="table-row border-b border-neutral-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                  Channel No
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                  Camera ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                  Camera Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                  Site Location
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-textSecondary">
                  Connected On
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-textSecondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="block max-h-[470px] overflow-y-auto">
              {isLoading ? (
                <tr className="table w-full table-fixed">
                  <td colSpan="8" className="px-4 py-8 text-center text-textSecondary">
                    Loading channels...
                  </td>
                </tr>
              ) : currentChannels.length === 0 ? (
                <tr className="table w-full table-fixed">
                  <td colSpan="8" className="px-4 py-8 text-center text-textSecondary">
                    No channels found
                  </td>
                </tr>
              ) : (
                currentChannels.map((channel, index) => (
                  <tr
                    key={index}
                    className="table w-full table-fixed border-b border-neutral-700 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.channelNo}</td>
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.cameraId}</td>
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.cameraName}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        variant={getStatusVariant(channel.status)}
                        appearance="border"
                        size="sm"
                      >
                        {channel.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-textPrimary">{channel.ipAddress}</td>
                    <td className="px-4 py-3 text-sm text-textPrimary">
                      <div>{channel.siteLocation}</div>
                      {channel.area && (
                        <div className="text-xs text-textSecondary">{channel.area}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-textPrimary">
                      {channel.connectedOn.split("\n").map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {channel.status === "Available" ? (
                        <button
                          onClick={() => handleLink(channel)}
                          className="flex items-center gap-1 rounded-md bg-gradient-to-r from-brand to-brand-dark px-3 py-1.5 text-sm text-white transition-opacity hover:opacity-90"
                        >
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
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          Link
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlink(channel)}
                          className="flex items-center gap-1 rounded-md border border-neutral-700 bg-transparent px-3 py-1.5 text-sm text-textPrimary transition-colors hover:border-neutralHover hover:bg-surface-elevated"
                        >
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
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          Unlink
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="sticky bottom-0 z-10 mt-2 flex items-center justify-between border-t border-neutral-700 bg-surface px-2 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-textSecondary">Entries per page</span>
            <select
              value={entriesPerPage}
              className="rounded-md border border-neutral-700 bg-surface px-3 py-1 text-sm text-textPrimary focus:border-brand focus:outline-none"
            >
              <option value="9">9</option>
              <option value="18">18</option>
              <option value="27">27</option>
            </select>
            <span className="ml-4 text-sm text-textSecondary">
              {startIndex + 1} - {Math.min(endIndex, filteredChannels.length)} of{" "}
              {filteredChannels.length} entries
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="rounded-md border border-neutral-700 bg-transparent px-3 py-1 text-sm text-textPrimary transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-neutral-700 bg-transparent px-3 py-1 text-sm text-textPrimary transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ‹
            </button>

            <span className="px-3 py-1 text-sm text-textPrimary">
              {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-neutral-700 bg-transparent px-3 py-1 text-sm text-textPrimary transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-md border border-neutral-700 bg-transparent px-3 py-1 text-sm text-textPrimary transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Link Camera Modal */}
      <LinkCameraModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setSelectedChannel(null);
        }}
        channel={selectedChannel}
        selectedDevice={selectedDevice}
      />

      {/* Unlink Camera Modal */}
      <UnlinkCameraModal
        isOpen={isUnlinkModalOpen}
        onClose={() => {
          setIsUnlinkModalOpen(false);
          setSelectedChannel(null);
        }}
        channel={selectedChannel}
      />
    </div>
  );
};

export default DeviceChannelManagement;
