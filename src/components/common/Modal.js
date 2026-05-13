import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md", // 'sm', 'md', 'lg', 'xl', 'full'
  closeOnOverlayClick = true,
  showCloseButton = true,
  maxHeight = "max-h-[90vh]", // Custom max height
  closeButtonPosition = "header", // 'header' or 'absolute' - absolute positions it at top-right corner
  verticalAlign = "center", // 'top' or 'center' - controls modal vertical position
  offsetSidebar = false, // When true, modal appears next to sidebar instead of covering it
  topPadding = "pt-8", // Top padding when verticalAlign is 'top'
  bodyScrollable = true, // When false, body won't scroll (useful when child components handle their own scrolling)
  bodyPadding = "px-6 py-4", // Custom body padding
  containerPadding = "p-4", // Padding around modal (margin between modal and screen edge)
  zIndex = 50, // Custom z-index, default 50
  maxWidth, // Custom max width
  animationType = "fade", // 'fade' or 'slide-right'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Handle animation mounting/unmounting
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Trigger animation after render
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  // Size classes for modal width
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-full w-full",
  };

  // Use custom maxWidth if provided, otherwise use size classes
  const widthClass = maxWidth || sizeClasses[size];

  const modalContent = (
    <>
      {/* Sidebar Blur Overlay (when offsetSidebar is true) */}
      {offsetSidebar && (
        <div
          className={`fixed left-0 top-0 bottom-0 w-64 bg-black/60 backdrop-blur-sm`}
          style={{ zIndex }}
        />
      )}

      <div
        className={`fixed ${
          offsetSidebar ? "left-64 right-0 top-0 bottom-0" : "inset-0"
        } flex ${verticalAlign === "top" ? `items-start ${topPadding}` : "items-center"} justify-center ${containerPadding}`}
        style={{ zIndex }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (closeOnOverlayClick) {
            onClose();
          }
        }}
      >
        {/* Overlay */}
        <div className={`absolute ${offsetSidebar ? "left-0 right-0 top-0 bottom-0" : "inset-0"} bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`} />

      {/* Modal Container - Fixed max height */}
      <div
        className={`
          relative bg-surface ${size === "full" ? "" : "rounded-lg"} shadow-2xl
          ${widthClass}
          ${maxHeight} flex flex-col overflow-hidden
          ${size === "xl" ? "min-h-[600px]" : ""}
          transition-all duration-300 ease-out
          ${
            animationType === "slide-right"
              ? isAnimating
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
              : isAnimating
              ? "scale-100 opacity-100"
              : "scale-95 opacity-0"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Absolute Close Button - Top Right Corner */}
        {showCloseButton && closeButtonPosition === "absolute" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors p-2 bg-black/50 rounded-full"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {showCloseButton && closeButtonPosition === "header" && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body - Scrollable content */}
        <div className={`flex-1 min-h-0 ${bodyScrollable ? "overflow-y-auto" : "overflow-hidden flex flex-col"} ${bodyPadding}`}>{children}</div>

        {/* Footer - Fixed at bottom */}
        {footer && <div className="px-6 py-4 flex-shrink-0">{footer}</div>}
      </div>
      </div>
    </>
  );

  // Render modal in portal at document body
  return createPortal(modalContent, document.body);
};

export default Modal;
