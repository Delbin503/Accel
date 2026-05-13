import Modal from "components/common/Modal";
import InputSearch from "components/common/InputSearch";
import InputCheckbox from "components/common/InputCheckbox";
import { useEffect, useRef, useState } from "react";
// import { getRtspFrame } from "services/rtspService";
import { useToggleGetFrameMutation } from "services/camera";

const AddZoneModal = ({ isOpen, onClose, footer, setZones, zones, rtspStreamLink, camera, showZoneArea, setShowZoneArea }) => {
  const [zonesState, setZonesState] = useState([]);
  const [activeZoneIndex, setActiveZoneIndex] = useState(-1);
  const [stream, setStream] = useState(false);
  const [isGetFrameToggled, setIsGetFrameToggled] = useState(false);
  const [isFetchingFrame, setIsFetchingFrame] = useState(false);
  const [base64Frame, setBase64Frame] = useState("");
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const toggleGetFrameMutation = useToggleGetFrameMutation();

  // useEffect(() => {
  //   if (!rtspStreamLink) return;

  //   const fetchFrame = async () => {
  //     try {
  //       const res = await getRtspFrame({ rtspStreamLink });
  //       if (res?.success && res?.data) {
  //         const img = new Image();
  //         img.src = res.data;
  //         img.onload = () => {
  //           imageRef.current = img;
  //           const canvas = canvasRef.current;
  //           const ctx = canvas?.getContext("2d");
  //           ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
  //         };
  //       }
  //       setStream(true);
  //     } catch (err) {
  //       console.error("Failed to get RTSP frame", err);
  //       setStream(false);
  //     }
  //   };

  //   fetchFrame();
  // }, [rtspStreamLink]);

  useEffect(() => {
    setStream(false);
    setBase64Frame("");
    setIsGetFrameToggled(false);
    setIsFetchingFrame(false);

    if (!camera?.id || !isOpen) return;

    const fetchFrame = async () => {
      try {
        const res = await toggleGetFrameMutation.mutateAsync(camera.id);
        if (res?.data?.success) {
          setIsGetFrameToggled(true);
        } else {
          console.error("Failed to toggle get frame", res?.data?.message || "Unknown error");
        }
      } catch (err) {
        console.error("Failed to toggle get frame", err);
      }
    };

    fetchFrame();
  }, [camera?.id, isOpen]);

  useEffect(() => {
    if (!isGetFrameToggled || !camera?.id || !isOpen) return;

    const frame = camera?.base64frame || "";
    const awaitingFrame = !!camera?.isGetFrame && frame.length === 0;

    setIsFetchingFrame(awaitingFrame);

    if (frame.length > 0) {
      setBase64Frame(frame);
      setStream(true);
      setIsFetchingFrame(false);
    }
  }, [isGetFrameToggled, camera?.id, camera?.isGetFrame, camera?.base64frame, isOpen]);

  useEffect(() => {
    if (!base64Frame) return;

    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Frame}`;
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  }, [base64Frame]);

  const toNormalized = (x, y, width, height) => [
    Number(Math.min(Math.max(x / width, 0), 1).toFixed(4)),
    Number(Math.min(Math.max(y / height, 0), 1).toFixed(4)),
  ];

  const toCanvas = (x, y, width, height) => ({ x: x * width, y: y * height });

  const handleCanvasClick = (e) => {
    if (activeZoneIndex === -1) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const point = toNormalized(px, py, canvas.width, canvas.height);

    setZones((prev) => prev.map((zone, i) => (i === activeZoneIndex ? [...zone, point] : zone)));
  };

  const handleUndoPoint = (e) => {
    e.preventDefault();
    if (activeZoneIndex === -1) return;

    setZones((prev) => prev.map((zone, i) => (i === activeZoneIndex ? zone.slice(0, -1) : zone)));
  };

  const getZoneCenter = (zone) => {
    let x = 0,
      y = 0;
    zone.forEach(([nx, ny]) => {
      x += nx;
      y += ny;
    });
    return [x / zone.length, y / zone.length];
  };

  useEffect(() => {
    setZonesState((prev) => {
      if (zones.length === 0) return [];

      return zones.map((_, index) => prev[index] ?? "Clear");
    });
  }, [zones]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    }

    if (showZoneArea) {
      zones.forEach((zone, index) => {
        if (!zone.length) return;

        ctx.beginPath();
        const first = toCanvas(zone[0][0], zone[0][1], canvas.width, canvas.height);
        ctx.moveTo(first.x, first.y);

        zone.forEach(([nx, ny]) => {
          const { x, y } = toCanvas(nx, ny, canvas.width, canvas.height);
          ctx.lineTo(x, y);
        });

        ctx.closePath();
        ctx.fillStyle = "rgba(248, 0, 0, 0.25)";
        ctx.fill();

        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.stroke();

        const [cx, cy] = getZoneCenter(zone);
        const { x: textX, y: textY } = toCanvas(cx, cy, canvas.width, canvas.height);
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#EF4444";
        ctx.fillText(`Zone ${index + 1}`, textX, textY);

        zone.forEach(([nx, ny]) => {
          const { x, y } = toCanvas(nx, ny, canvas.width, canvas.height);
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#EF4444";
          ctx.fill();
        });
      });
    }
  }, [zones, zonesState, showZoneArea, imageRef.current, rtspStreamLink, isOpen]);

  const zoneComponent = (index) => {
    const state = zonesState[index] || "Clear";

    const setZoneState = (newState) => {
      setZonesState((prev) => prev.map((s, i) => (i === index ? newState : "Clear")));
      setActiveZoneIndex(newState === "Save" ? index : -1);
    };

    const handleChangeState = () => {
      switch (state) {
        case "Clear":
          setZoneState("Draw");
          setZones((prev) => prev.map((zone, i) => (i === index ? [] : zone)));
          break;
        case "Draw":
          setZoneState("Save");
          break;
        case "Save":
          setZoneState("Clear");
          break;
      }
    };

    const handleDeleteZone = () => {
      setZones((prev) => prev.filter((_, i) => i !== index));
      setZonesState((prev) => prev.filter((_, i) => i !== index));
    };

    const icon = () => {
      switch (state) {
        case "Clear":
          return "/icons/eraserIcon.svg";
        case "Draw":
          return "/icons/pencilIcon.svg";
        case "Save":
          return "/icons/checkIcon.svg";
        default:
          return "";
      }
    };

    return (
      <div className="flex justify-between" key={index}>
        <span>Zone {index + 1}</span>
        <div className="flex items-center gap-4">
          <button className="flex gap-2" onClick={handleChangeState}>
            <img className="h-5 w-5" src={icon()} /> {state}
          </button>
          <button className="flex items-center gap-2 text-red-400" onClick={handleDeleteZone}>
            <img src="/icons/trashIcon.svg" /> Delete
          </button>
        </div>
      </div>
    );
  };

  const handleAddZone = () => {
    setZones((prev) => [...prev, []]);
    setZonesState((prev) => [...prev, "Draw"]);
  };

  return (
    <Modal
      zIndex={1000}
      isOpen={isOpen}
      onClose={onClose}
      title="Add Zone"
      footer={footer}
      size="lg"
    >
      <div className="flex flex-col gap-4 text-white">
        <div className="border-t border-neutral-600"></div>
        <span className="text-neutral-400">Zone Configuration</span>
        {isFetchingFrame ? (
          <div className="flex h-[300px] w-[500px] flex-col items-center justify-center rounded-lg bg-neutral-700">
            <img src="/icons/spinner.svg" alt="Loading" className="mb-2 h-6 w-6" />
            <span>Loading frame...</span>
          </div>
        ) : stream ? (
          <div className="flex justify-between gap-5">
            <div className="w-[800px]">
              <canvas
                ref={canvasRef}
                width={500}
                height={300}
                className={`${activeZoneIndex !== -1 ? "cursor-crosshair" : ""} rounded-lg`}
                onClick={handleCanvasClick}
                onContextMenu={handleUndoPoint}
              />
              <p className="mt-2">Hint:</p>
              <ul className="list-disc pl-5 text-sm text-neutral-400">
                <li>Left click on the video to add points to the zone</li>
                <li>Right click to undo the last point added</li>
              </ul>
            </div>

            <div className="flex w-[500px] flex-col gap-4 rounded-md border border-neutral-600 px-6 py-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold">Add Zone</h3>
                <span className="text-xs text-neutral-300">
                  Draw the polygon to the map to mark as a zone
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <InputSearch />
                <InputCheckbox
                  label={"Show Zone Area"}
                  checked={showZoneArea}
                  onChange={() => setShowZoneArea(!showZoneArea)}
                  color={"red-500"}
                />
              </div>

              <button className="flex items-start gap-2 text-left text-sm" onClick={handleAddZone}>
                <img src="/icons/plusIcon.svg" alt="Add" className="mt-1" />
                <span>
                  Add a zone to specify where to look for something. If it detects something that
                  matches, it'll send you an alert.
                </span>
              </button>

              <span>Zones</span>
              {zones?.map((zone, index) => zoneComponent(index))}
            </div>
          </div>
        ) : (
          <div className="flex h-[300px] w-[500px] flex-col items-center justify-center rounded-lg bg-neutral-700">
            <img src="/icons/notConnectedIcon.svg" alt="Camera" className="mr-2 h-6 w-6" />
            <span>Camera Offline</span>
            <span className="text-sm">Unable to connect to camera</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AddZoneModal;
