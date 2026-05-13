import React, { useEffect, useRef } from "react";

/**
 * SlidePanel - A slide-over panel that appears from the right
 * @param {boolean} isOpen - Whether the panel is open
 * @param {function} onClose - Callback when panel should close
 * @param {React.ReactNode} children - Content to render inside the panel
 * @param {string} width - Width of the panel (default: "w-[400px]")
 */
const SlidePanel = ({ isOpen, onClose, children, width = "w-[400px]" }) => {
  const panelRef = useRef(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      // Add listener with slight delay to prevent immediate close
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop - covers entire viewport including sidebar and navbar */}
      <div
        className={`
          fixed inset-0 z-[60]
          bg-black/50 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}
        `}
      />

      {/* Panel - slides from right */}
      <div
        ref={panelRef}
        className={`
          fixed bottom-[10px] left-[240px] right-[1px] top-[54px] z-[70]
          transform overflow-hidden rounded-lg border
          border-neutral-700 bg-surface
          shadow-2xl transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-[calc(100%+20px)]"}
        `}
      >
        {/* Content */}
        <div className="h-full overflow-y-hidden">{children}</div>
      </div>
    </>
  );
};

export default SlidePanel;
