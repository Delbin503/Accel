import React from "react";
import Badge from "components/common/Badge";

export const getNVRDeviceTableColumns = () => [
  {
    accessorKey: "id",
    header: "Device ID",
    cell: ({ getValue }) => <span className="font-medium text-textPrimary">{getValue()}</span>,
  },
  {
    accessorKey: "name",
    header: "Device Name",
    cell: ({ getValue }) => <span className="font-medium text-textPrimary">{getValue()}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();

      // Map status to variant
      let variant = "default";
      if (status?.toLowerCase() === "live") {
        variant = "success";
      } else if (status?.toLowerCase() === "storage full") {
        variant = "error";
      } else if (status?.toLowerCase() === "offline") {
        variant = "error";
      }

      return (
        <Badge variant={variant} appearance="border" size="sm">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "numberOfChannels",
    header: "Number Of Channels",
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return <span className="font-medium text-textPrimary">N/A</span>;
      return <span className="font-medium text-textPrimary">{value}</span>;
    },
  },
  {
    accessorKey: "nvrStorage",
    header: "NVR Storage",
    cell: ({ getValue }) => {
      const storage = getValue();
      if (!storage) return <span className="font-medium text-textPrimary">N/A</span>;

      // Parse percentage from string like "100%", "88.34%", etc.
      const percentage = parseFloat(storage);
      let storageColor = "";

      if (percentage >= 90) {
        storageColor = "text-red-500"; // Red for high usage
      } else if (percentage >= 70) {
        storageColor = "text-yellow-500"; // Yellow for medium usage
      } else {
        storageColor = "text-green-500"; // Green for low usage
      }

      return <span className={`font-medium ${storageColor}`}>{storage}</span>;
    },
  },
  {
    accessorKey: "siteLocation",
    header: "Site Location",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-textPrimary">{row.original.siteLocation}</div>
        <div className="text-xs text-gray-400">{row.original.area}</div>
      </div>
    ),
  },
  {
    accessorKey: "lastActive",
    header: "Last Active On",
    cell: ({ getValue }) => {
      const dateTime = getValue();
      if (!dateTime || dateTime === "N/A") {
        return <span className="font-medium text-textPrimary">N/A</span>;
      }
      // Format: "Jan 15, 2025, 10:30:45 AM"
      // Split to get date and time separately
      const lastCommaIndex = dateTime.lastIndexOf(", ");
      if (lastCommaIndex !== -1) {
        const date = dateTime.substring(0, lastCommaIndex); // "Jan 15, 2025"
        const time = dateTime.substring(lastCommaIndex + 2); // "10:30:45 AM"
        return (
          <div>
            <div className="font-medium text-textPrimary">{date}</div>
            <div className="text-[14px] text-gray-400">{time}</div>
          </div>
        );
      }
      return <span className="whitespace-nowrap font-medium text-textPrimary">{dateTime}</span>;
    },
  },
];

export const getDeviceTableColumns = () => [
  {
    accessorKey: "id",
    header: "Device ID",
    cell: ({ getValue }) => <span className="font-medium text-textPrimary">{getValue()}</span>,
  },
  {
    accessorKey: "name",
    header: "Device Name",
    cell: ({ getValue }) => <span className="font-medium text-textPrimary">{getValue()}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge autoMap appearance="border" size="sm" className="text-[14px]">
        {getValue()}
      </Badge>
    ),
  },
  {
    accessorKey: "nvrRecordingStatus",
    header: "NVR Recording Status",
    cell: ({ getValue }) => {
      const status = getValue();

      // "Not Configured" is plain text, not a badge
      if (status?.toLowerCase() === "not configured" || !status) {
        return (
          <Badge variant="default" appearance="text">
            Not Configured
          </Badge>
        );
      }

      return (
        <Badge autoMap appearance="border" size="sm">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "siteLocation",
    header: "Site Location",
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-textPrimary">{row.original.siteLocation}</div>
        <div className="text-[14px] text-gray-400">{row.original.area}</div>
      </div>
    ),
  },
  {
    accessorKey: "lanes",
    header: "Lane(s)",
    cell: ({ getValue }) => <span className="font-medium text-textPrimary">{getValue()}</span>,
  },
  {
    accessorKey: "lastActive",
    header: "Last Active On",
    cell: ({ getValue }) => {
      const dateTime = getValue();
      if (!dateTime || dateTime === "N/A") {
        return <span className="font-medium text-textPrimary">N/A</span>;
      }
      // Format: "Jan 15, 2025, 10:30:45 AM"
      // Split to get date and time separately
      const lastCommaIndex = dateTime.lastIndexOf(", ");
      if (lastCommaIndex !== -1) {
        const date = dateTime.substring(0, lastCommaIndex); // "Jan 15, 2025"
        const time = dateTime.substring(lastCommaIndex + 2); // "10:30:45 AM"
        return (
          <div>
            <div className="font-medium text-textPrimary">{date}</div>
            <div className="text-[14px] text-gray-400">{time}</div>
          </div>
        );
      }
      return <span className="whitespace-nowrap font-medium text-textPrimary">{dateTime}</span>;
    },
  },
];
