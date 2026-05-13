import React, { useEffect, useRef, useState } from "react";
import JSMpeg from "@cycjimmy/jsmpeg-player";
import { useStartRtsp, useStopRtsp, useTestConnection } from "services/rtspService";

export default function RTSPviewer({ camera }) {
  const canvasRef = useRef(null);
  const playerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [wsConnectionStatus, setWsConnectionStatus] = useState("CLOSED");
  const [fullscreen, setFullscreen] = useState(false);

  const { mutate: stopRtsp } = useStopRtsp();
  const { data: testResult, isLoading: testLoading } = useTestConnection(camera?.id);

  const isStreaming = testResult?.success;

  const { mutate: startRtsp } = useStartRtsp();

  useEffect(() => {
    console.log("isStreaming", isStreaming);

    if (isStreaming) {
      startRtsp(camera.id, {
        onSuccess: (data) => {
          setStream(data?.data);
        },
      });
    }

    setStream(null);
  }, [isStreaming, camera?.id]);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    console.log("[RTSP] init player", stream.wsStreamUrl);

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    playerRef.current = new JSMpeg.Player(stream.wsStreamUrl, {
      canvas: canvasRef.current,
      autoplay: true,
      audio: false,
    });

    return () => {
      console.log("[RTSP] destroy player");

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        stopRtsp(camera?.id);
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!playerRef.current) return;

    const ws = playerRef.current.source?.socket;
    if (!ws) return;

    const logState = () => {
      const map = {
        0: "CONNECTING",
        1: "OPEN",
        2: "CLOSING",
        3: "CLOSED",
      };
      setWsConnectionStatus(map[ws.readyState]);
    };

    logState();

    ws.onopen = () => console.log("[WS] OPEN");
    ws.onclose = () => console.log("[WS] CLOSED");
    ws.onerror = (e) => console.error("[WS] ERROR", e);

    return () => {
      ws.onopen = ws.onclose = ws.onerror = null;
    };
  }, [stream]);

  useEffect(() => {
    return () => {
      console.log("[RTSP] component unmount");

      if (camera?.id) {
        stopRtsp(camera?.id);
      }

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  const wrapperClass = fullscreen
    ? "fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center hover:cursor-pointer"
    : "relative h-full w-full hover:cursor-pointer";

  const videoClass = fullscreen
    ? "fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center hover:cursor-pointer bg-neutral-700 p-4"
    : "flex h-full w-full flex-col rounded-lg bg-neutral-700 p-4 hover:cursor-pointer";

  return (
    <>
      {stream ? (
        <div className={wrapperClass} onClick={() => setFullscreen(!fullscreen)}>
          <canvas
            ref={canvasRef}
            className="z-0 h-full w-full overflow-auto rounded-lg object-cover"
          />

          <div
            className="absolute left-3 top-3 z-10 flex items-center justify-center gap-2 rounded bg-surface-overlay/70 px-4 py-2 text-white"
          >
            <img src="/icons/liveIcon.svg" alt="live" />
            Live
          </div>

          <div
            className="absolute bottom-0 left-3 z-10 flex flex-col gap-2 pb-3"
          >
            <span className="text-sm font-semibold text-neutral-200">{camera?.location}</span>
            <span className="text-xs text-neutral-300">{camera?.name}</span>
          </div>
        </div>
      ) : (
        <div
          className="flex h-full w-full flex-col rounded-lg bg-neutral-700 p-4 "
          // onClick={() => setFullscreen(!fullscreen)}
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-1">
            <img src="/icons/notConnectedIcon.svg" className="h-10 w-10" alt="offline" />
            <p className="text-center font-semibold text-white">Camera Offline</p>
            <p className="text-center text-sm text-neutral-300">Unable to connect to camera</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-white">{camera?.location}</p>
            <p className="text-sm text-neutral-400">{camera?.name}</p>
          </div>
        </div>
      )}
    </>
  );
}
