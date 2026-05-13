import React, { useState, useEffect } from "react";
import { useGetCamerasQuery } from "services/camera";
import Pagination from "components/pagination/pagination";
import HLSViewer from "../../components/videoViewer/HLSViewer";

const LiveMonitoring = () => {
  const [layout, setLayout] = useState("2x3");
  const [onlineCameras, setOnlineCameras] = useState(0);
  const [offlineCameras, setOfflineCameras] = useState(0);
  const [expandedSites, setExpandedSites] = useState(["fedex-changi"]);
  const [cameras, setCameras] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 6,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const layoutOptions = [
    { value: "1x1", label: "1 x 1 Layout" },
    { value: "2x3", label: "2 x 3 Layout" },
    { value: "3x3", label: "3 x 3 Layout" },
    // { value: "4x4", label: "4 x 4 Layout" },
  ];

  const layoutConfig = {
    "1x1": { cols: 1, rows: 1 },
    "2x3": { cols: 3, rows: 2 },
    "3x3": { cols: 3, rows: 3 },
    // "4x4": { cols: 4, rows: 4 },
  };

  const {
    data: dataDevice,
    refetch: refetchDevices,
    isLoading: isLoadingDevices,
  } = useGetCamerasQuery({
    page: pagination.currentPage,
    limit: pagination.limit,
    search: "",
    deviceType: "CAM",
    siteLocation: "",
    area: "",
  });

  useEffect(() => {
    const cameras = dataDevice?.data
      ?.map((device) => ({
        id: device.uID,
        name: device.name,
        location: device.siteLocation,
        status: device.status,
        site: device.siteLocation,
        stream: device.rtspStreamLink,
        isStreaming: device.isStreaming,
        isStarted: device.isStarted,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      );

    const pagination = dataDevice?.pagination;
    if (pagination) {
      setPagination(pagination);
    }

    setCameras(cameras);
  }, [dataDevice]);

  useEffect(() => {
    refetchDevices();
  }, [pagination]);

  const cameras_dumy = [
    {
      id: "CCTV_CAM_001",
      name: "ChangiHub_Cam_01",
      location: "FetHub /Camp Area",
      status: "offline",
      site: "fedex-changi",
      stream: null,
    },
    {
      id: "CCTV_CAM_001",
      name: "ChangiHub_Cam_02",
      location: "FetHub /Camp Area",
      status: "offline",
      site: "fedex-changi",
      stream: null,
    },
    {
      id: "CCTV_CAM_001",
      name: "ChangiHub_Cam_03",
      location: "HRHub /Camp Area/Station 1",
      status: "online",
      site: "fedex-changi",
      stream: "/api/stream/cam-003",
    },
    {
      id: "CCTV_CAM_002",
      name: "ChangiHub_Cam_04",
      location: "HRHub /Camp Area/Station 1",
      status: "online",
      site: "fedex-changi",
      stream: "/api/stream/cam-004",
    },
    {
      id: "CCTV_CAM_005",
      name: "ChangiHub_Cam_05",
      location: "FetHub /Station | Lane 1-2",
      status: "offline",
      site: "fedex-changi",
      stream: null,
    },
  ];

  const sites = [
    {
      id: "Pulau Tekong Camp",
      name: "Pulau Tekong Camp",
      cameraCount: 5,
    },
  ];

  const toggleSite = (siteId) => {
    setExpandedSites((prev) =>
      prev.includes(siteId) ? prev?.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  const { cols, rows } = layoutConfig[layout];
  const gridClass = `grid-cols-${cols} grid-rows-${rows}`;

  useEffect(() => {
    const online = cameras?.filter((cam) => cam.status === "online").length;
    const offline = cameras?.filter((cam) => cam.status === "offline").length;
    setOnlineCameras(online);
    setOfflineCameras(offline);
  }, [cameras]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-neutral-800 p-6 text-white">
      <div className="flex flex-col">
        <div className="flex justify-between ">
          <h1 className="text-2xl font-semibold">Live Monitoring</h1>
          <select
            value={layoutOptions.find((option) => option.value === layout)?.value}
            onChange={(e) => {
              setLayout(e.target.value);
              const { cols, rows } = layoutConfig[e.target.value];
              setPagination({ ...pagination, currentPage: 1, limit: cols * rows });
            }}
            className="rounded-md border border-neutral-600 bg-neutral-800 px-4 py-2 text-sm focus:border-[#EE4D2D] focus:outline-none"
          >
            {layoutOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <p>{cameras?.length} Cameras</p>
      </div>

      <div className="flex h-screen flex-row gap-6 overflow-auto">
        {/* Left side */}
        <div className="flex h-full w-3/4 flex-col gap-2">
          <div
            className="grid w-full flex-1 gap-2 overflow-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {cameras?.map((camera) => (
              <HLSViewer key={camera.id} camera={camera} />
            ))}
          </div>

          <Pagination pagination={pagination} setPagination={setPagination} type="text" />
        </div>

        {/* Right side */}
        <div className="flex max-h-full w-1/4 flex-col gap-2 overflow-hidden rounded-md border border-neutral-600 p-6 py-4">
          <div className="flex flex-col gap-4">
            <p className="text-lg font-semibold">Site List</p>
            <div className="flex flex-col gap-2">
              <p>All Cameras ({cameras?.length})</p>
              <div className="flex gap-4 rounded-md bg-neutral-700 px-4 py-2 text-xs">
                <div className="flex gap-2">
                  <div className="mt-1 h-3 w-3 rounded-full bg-green-500"></div>
                  <p>Online {onlineCameras}</p>
                </div>

                <div className="flex gap-2">
                  <div className="mt-1 h-3 w-3 rounded-full bg-red-500"></div>
                  <p>Offline {offlineCameras}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-1 border border-neutral-600"></div>

          <div className="flex flex-col gap-4 overflow-auto">
            {sites.map((site) => {
              const siteCameras = cameras?.filter((cam) => cam.site === site.id);
              const isExpanded = expandedSites?.includes(site.id);

              return (
                <div key={site.id} className="flex min-h-0 flex-col overflow-auto">
                  <button
                    onClick={() => toggleSite(site.id)}
                    className="flex flex-shrink-0 items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-neutral-700"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {site.name} ({siteCameras?.length})
                      </span>

                      <span className="rounded-3xl bg-[#323232CC] px-2 py-1 text-sm">
                        <span className="text-base text-yellow-200">
                          {siteCameras?.filter((cam) => cam.status === "online")?.length}
                        </span>
                        /{siteCameras?.length}
                      </span>
                    </div>
                    <img
                      src={isExpanded ? "/icons/cheveron-up.svg" : "/icons/cheveron-down.svg"}
                      alt="toggle"
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-2 flex min-h-0  flex-col gap-2 overflow-y-auto rounded-md p-2 ">
                      {siteCameras?.map((camera) => (
                        <div
                          key={camera.id}
                          className="flex flex-shrink-0 rounded-md border border-orange-900 bg-[#FE5C011A] px-3 py-4"
                        >
                          <div className="flex w-full items-center gap-4">
                            <img src="/icons/16dodsIcon.svg" className="h-5 w-5" alt="drag" />
                            <div className="flex w-full justify-between">
                              <div className="flex flex-col gap-1">
                                <p className="font-semibold text-white">{camera.name}</p>
                                <p className="text-sm text-neutral-400">{camera.location}</p>
                              </div>
                              <div
                                className={`rounded-full ${camera.status === "online" ? "bg-green-500" : "bg-red-500"} mt-1 h-4 w-4`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
