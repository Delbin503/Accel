import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
// import { useTestConnection } from "services/rtspService";
import { useToggleIsStreamingMutation } from "services/camera";

export default function HLSViewer({ camera }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [isImgLoading, setIsImgLoading] = useState(true);
  const closingToastRef = useRef(null);
  const isStreaming = !!camera?.isStreaming;
  const isStarted = !!camera?.isStarted;
  const isClosingStream = !isStreaming && isStarted;

  const toggleIsStreamingMutation = useToggleIsStreamingMutation();

  const handleToggleStreaming = (event) => {
    event.stopPropagation();
    if (!camera?.id) return;
    toggleIsStreamingMutation.mutate(camera.id, {
      onSuccess: async (response) => {
        const nextStreaming = response?.data?.data?.isStreaming;
        void nextStreaming;
      },
    });
  };
  useEffect(() => {
    if (isClosingStream) {
      if (closingToastRef.current == null) {
        closingToastRef.current = toast.info("Closing stream...");
      }
      return;
    }
    if (closingToastRef.current != null) {
      toast.dismiss(closingToastRef.current);
      closingToastRef.current = null;
    }
  }, [isClosingStream]);

  useEffect(() => {
    if (isStreaming && !isStarted) {
      setIsImgLoading(true);
      return;
    } else{
      setIsImgLoading(false);
      return;
    }
  }, [isStreaming, isStarted, camera?.stream]);

  useEffect(() => {
    return () => {
      if (closingToastRef.current != null) {
        toast.dismiss(closingToastRef.current);
      }
    };
  }, []);

  const wrapperClass = fullscreen
    ? "fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center "
    : "relative h-full w-full ";

  return (
    <>
      {isStreaming ? (
        <div className={wrapperClass}>
          {isImgLoading ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-black bg-opacity-30">
              <img src="/icons/spinner.svg" alt="Loading..." className="h-12 w-12 animate-spin" />
              <span className="text-sm text-white">Loading...</span>
            </div>
          ) : (
            <img
              className="w-full h-full rounded-lg"
              src={camera?.stream}
              onLoad={() => setIsImgLoading(false)}
              onError={() => setIsImgLoading(false)}
            />
          )}
          
          {/* <iframe
            src={camera?.stream}
            className="h-full w-full rounded-lg object-cover bg-red-500"
            style={isImgLoading ? { visibility: "hidden" } : { visibility: "visible", overflow: "auto", transform: "scale(1)", transformOrigin: "center" }}
            onLoad={() => setIsImgLoading(false)}
            onError={() => setIsImgLoading(false)}
            scrolling="no"
            frameBorder="0"
          /> */}

          <div className="absolute left-0 top-0 flex w-full items-center justify-between p-2 text-white">
            <div
              style={{ zIndex: 10, backgroundColor: "#323232B2" }}
              className="flex justify-center gap-2 rounded px-3 py-2"
            >
              <img src="/icons/liveIcon.svg" alt="live" />
              Live
            </div>
            <button
              style={{ zIndex: 10 }}
              className="flex justify-center gap-2 rounded bg-neutral-600 p-2"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreen(!fullscreen);
              }}
            >
              <img src="/icons/maximizeIcon.svg" alt="maximize" />
            </button>
          </div>

          <div
            style={{ zIndex: 10 }}
            className="absolute bottom-0 left-0 flex w-full justify-between px-2 pb-3"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-200">{camera?.location}</span>
              <span className="text-xs text-neutral-300">{camera?.name}</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleToggleStreaming}
                className={
                  "z-30 flex items-center gap-2 text-xs text-white " +
                  (isClosingStream ? "cursor-not-allowed opacity-60" : "")
                }
                disabled={isClosingStream}
                aria-pressed={isStreaming}
                aria-disabled={isClosingStream}
              >
                <span>Start/Stop Stream</span>
                <span
                  className={
                    "relative inline-flex h-4 w-8 items-center rounded-full transition-colors " +
                    (isStreaming ? "bg-emerald-400" : "bg-neutral-500")
                  }
                >
                  <span
                    className={
                      "inline-block h-3 w-3 transform rounded-full bg-white transition-transform " +
                      (isStreaming ? "translate-x-4" : "translate-x-1")
                    }
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col rounded-lg bg-neutral-700 px-4 pt-4">
          <div className="flex flex-1 flex-col items-center justify-center gap-1">
            <img src="/icons/notConnectedIcon.svg" alt="" className="h-10 w-10" />
            <p className="text-center font-semibold text-white">Camera Offline</p>
            <p className="text-center text-sm text-neutral-300">Unable to connect to camera</p>
          </div>

          <div
            style={{ zIndex: 10 }}
            className=" bottom-0 left-0 flex w-full justify-between px-2 pb-3"
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-200">{camera?.location}</span>
              <span className="text-xs text-neutral-300">{camera?.name}</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleToggleStreaming}
                className={
                  "z-30 flex items-center gap-2 text-xs text-white " +
                  (isClosingStream ? "cursor-not-allowed opacity-60" : "")
                }
                disabled={isClosingStream}
                aria-pressed={isStreaming}
                aria-disabled={isClosingStream}
              >
                <span>Start/Stop Stream</span>
                <span
                  className={
                    "relative inline-flex h-4 w-8 items-center rounded-full transition-colors " +
                    (isStreaming ? "bg-emerald-400" : "bg-neutral-500")
                  }
                >
                  <span
                    className={
                      "inline-block h-3 w-3 transform rounded-full bg-white transition-transform " +
                      (isStreaming ? "translate-x-4" : "translate-x-1")
                    }
                  />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
