import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./InputDate.css";

const InputDate = ({
  value,
  onChange,
  placeholder = "Select date",
  isDisabled = false,
  className = "",
  label = "",
  required = false,
  error = "",
  touched = false,
  fontSize = "14px",
  minDate,
  maxDate,
  dateFormat = "dd MMM, yyyy",
  ...props
}) => {
  const hasError = touched && error;

  // Convert string to Date object if needed
  const dateValue = value ? new Date(value) : null;

  // Handle date change
  const handleChange = (date) => {
    if (date) {
      // Convert to YYYY-MM-DD format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-textSecondary font-medium mb-2">
          {label} {required && <span className="text-neutral-300">*</span>}
        </label>
      )}
      <div className="custom-datepicker-wrapper">
        <DatePicker
          selected={dateValue}
          onChange={handleChange}
          placeholderText={placeholder}
          disabled={isDisabled}
          minDate={minDate ? new Date(minDate) : undefined}
          maxDate={maxDate ? new Date(maxDate) : undefined}
          dateFormat={dateFormat}
          className={`text-sm w-full px-4 h-[42px] bg-transparent text-textSecondary rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            hasError
              ? "border-red-500 focus:border-red-500"
              : "border-neutral-700 focus:border-brand hover:border-neutralHover"
          }`}
          wrapperClassName="w-full"
          calendarClassName="custom-datepicker"
          showPopperArrow={false}
          {...props}
        />
        {/* Calendar Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
      {hasError && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default InputDate;
