import { useEffect, useMemo, useRef, useState } from "react";

const InputTime = ({
  value,
  onChange,
  placeholder = "Select time",
  isDisabled = false,
  className = "",
  label = "",
  required = false,
  error = "",
  touched = false,
  fontSize = "16px",
  ...props
}) => {
  const hasError = touched && error;
  const [isOpen, setIsOpen] = useState(false);
  const [tempHour, setTempHour] = useState("");
  const [tempMinute, setTempMinute] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState("down");
  const wrapperRef = useRef(null);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    []
  );
  const minutes = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")),
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (event) => {
      if (!wrapperRef.current) return;
      const path = event.composedPath ? event.composedPath() : [];
      const isInside = path.length ? path.includes(wrapperRef.current) : wrapperRef.current.contains(event.target);
      if (isInside) return;
      setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handleOutside, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      setTempHour(h ?? "");
      setTempMinute(m ?? "");
    } else {
      setTempHour("");
      setTempMinute("");
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const estimatedHeight = 260;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setDropdownPosition(spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? "up" : "down");
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const commitValue = (nextHour, nextMinute) => {
    if (!nextHour || !nextMinute) return;
    onChange(`${nextHour}:${nextMinute}`);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-textSecondary">
          {label} {required && <span className="text-neutral-300">*</span>}
        </label>
      )}
      <div className="relative" ref={wrapperRef}>
        <button
          type="button"
          onClick={() => !isDisabled && setIsOpen((open) => !open)}
          disabled={isDisabled}
          className={`h-[50px] w-full rounded-lg border bg-transparent px-4 text-left text-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${hasError ? "border-red-500" : "border-neutral-700 hover:border-neutralHover focus:border-brand"}`}
          style={{ fontSize }}
          {...props}
        >
          {value || placeholder}
        </button>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
            <path
              d="M12 6v6l4 4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && !isDisabled && (
          <div
            className={`absolute z-20 w-full rounded-lg border border-neutral-700 bg-surface-darker p-2 shadow-lg ${
              dropdownPosition === "up" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
              <span>Hour</span>
              <span>Minute</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="max-h-48 overflow-auto rounded-md border border-surface-elevated">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => {
                      setTempHour(hour);
                      commitValue(hour, tempMinute);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm text-textSecondary hover:bg-surface-elevated ${tempHour === hour ? "bg-brand text-white" : ""}`}
                  >
                    {hour}
                  </button>
                ))}
              </div>
              <div className="max-h-48 overflow-auto rounded-md border border-surface-elevated">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    onClick={() => {
                      setTempMinute(minute);
                      commitValue(tempHour, minute);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm text-textSecondary hover:bg-surface-elevated ${tempMinute === minute ? "bg-brand text-white" : ""}`}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {hasError && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default InputTime;
