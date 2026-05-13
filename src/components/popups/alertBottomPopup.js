import Badge from "components/common/Badge";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";

export function AlertBottomPopup({ data, onClose }) {
  const hasPlayedRef = useRef(false);
  useEffect(() => {
    if (!data) {
      return;
    }

    const audioEnabled = localStorage.getItem("audioEnabled") === "true";

    if (audioEnabled && !hasPlayedRef.current) {
      const audio = new Audio("/audio/alert_notif.mp3");

      audio.play().catch((err) => {
        console.log("Audio play blocked:", err);
      });
      hasPlayedRef.current = true;
    }

    const timerId = setTimeout(() => {
      onClose?.();
    }, 5000);

    return () => {
      clearTimeout(timerId);
    };
  }, [data, onClose]);

  if (!data) {
    return null;
  }

  const {
    title,
    cameraId,
    siteLocation,
    detectionClasses,
    confidenceScore,
    area,
    lane,
    severity,
    thumbnail,
    createdAt,
  } = data;

  const formattedTime = createdAt ? dayjs(createdAt).format("HH:mm:ss") : "";
  const formattedDate = createdAt ? dayjs(createdAt).format("DD MMM, YYYY") : "";
  const apiBaseUrl = process.env.REACT_APP_API_URL || "";
  const thumbnailSrc = thumbnail
    ? thumbnail.startsWith("data:")
      ? thumbnail
      : `${apiBaseUrl}${thumbnail}`
    : "/icons/thumbnail.png";

  return (
    <div className="relative flex min-w-[504px] max-w-full gap-2 rounded-lg bg-neutral-750 p-3 shadow-lg">
      <img
        src={thumbnailSrc}
        alt="Alert thumbnail"
        className="h-[115px] w-[211px] rounded border-[0.75px] border-neutral-600 object-cover"
      />

      <div className="w-full space-y-2">
        <div className="flex w-full justify-between ">
          <div className="space-y-1">
            <p className="text-wrap text-sm font-medium text-neutral-50">{title}</p>
            <p className="text-wrap text-xs text-neutral-300">
              {area?.name} / {lane?.name} {cameraId}
            </p>
          </div>
          <Badge
            variant={severity === "high" ? "error" : severity === "medium" ? "warning" : "success"}
            className="mr-2 h-1/2"
          >
            {severity}
          </Badge>
        </div>

        <p className="flex items-center gap-2 text-xs text-neutral-300">
          <img src="/icons/clockIcon-white.svg" />
          {formattedTime} • {formattedDate}
        </p>

        <p className="flex items-center gap-2 text-xs text-neutral-300">
          <img src="/icons/detectionZoneWhiteIcon.svg" />
          {detectionClasses?.length} Classes Detected
        </p>
        <p className="flex justify-between text-xs text-neutral-300">Confidence Score <Badge variant="success">{confidenceScore}</Badge></p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-1 text-neutral-400 hover:text-neutral-200"
        aria-label="Close alert"
      >
        &times;
      </button>
    </div>
  );
}
