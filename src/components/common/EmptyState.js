import React from "react";

const EmptyState = ({
  icon = "film",
  message = "There's nothing to show here at the moment.",
  className = "",
}) => {
  // Icon options
  const icons = {
    film: (
      <svg
        className="w-20 h-20 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-1.125-1.125h.375c.621 0 1.125.504 1.125 1.125M13.125 12h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125M13.125 12C12.504 12 12 12.504 12 13.125m-8.625 0c.621 0 1.125.504 1.125 1.125M3.375 12h1.5M12 13.125v.375c0 .621.504 1.125 1.125 1.125M12 13.125C12 12.504 11.496 12 10.875 12M3.375 19.5v-1.5C3.375 17.379 3.879 16.875 4.5 16.875M20.625 19.5v-1.5c0-.621-.504-1.125-1.125-1.125M12 18.375c0 .621-.504 1.125-1.125 1.125M12 18.375c0 .621.504 1.125 1.125 1.125m-9.75-2.625h1.5M3.375 15.75h.375c.621 0 1.125.504 1.125 1.125m16.5-1.125H19.5M20.625 15.75h-.375c-.621 0-1.125.504-1.125 1.125M4.5 12.75c.621 0 1.125-.504 1.125-1.125M4.5 12.75c-.621 0-1.125-.504-1.125-1.125m10.5-2.625c.621 0 1.125-.504 1.125-1.125m-1.125 1.125c-.621 0-1.125-.504-1.125-1.125m1.125 1.125v.375c0 .621.504 1.125 1.125 1.125M9.75 8.625c0-.621-.504-1.125-1.125-1.125M9.75 8.625c0 .621.504 1.125 1.125 1.125m-1.125-1.125v.375c0 .621-.504 1.125-1.125 1.125M9 10.5c0 .621-.504 1.125-1.125 1.125M9 10.5c0-.621.504-1.125 1.125-1.125M9 10.5v.375c0 .621.504 1.125 1.125 1.125M15 7.5c0-.621-.504-1.125-1.125-1.125M15 7.5c0 .621.504 1.125 1.125 1.125M15 7.5v.375c0 .621-.504 1.125-1.125 1.125"
        />
      </svg>
    ),
    video: (
      <svg
        className="w-20 h-20 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
    folder: (
      <svg
        className="w-20 h-20 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    ),
    document: (
      <svg
        className="w-20 h-20 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    cursor: (
      <svg
        className="w-16 h-16 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
        />
      </svg>
    ),
  };

  const selectedIcon = icons[icon] || icons.film;

  return (
    <div className={`flex flex-col items-center justify-center py-32 ${className}`}>
      {/* Icon with Sparkle Effect */}
      <div className="relative mb-6">
        {selectedIcon}

        {/* Sparkle decorations */}
        <svg
          className="absolute -top-2 -right-2 w-4 h-4 text-gray-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0l1.545 6.455L20 8l-6.455 1.545L12 16l-1.545-6.455L4 8l6.455-1.545z" />
        </svg>
        <svg
          className="absolute -bottom-1 -left-2 w-3 h-3 text-gray-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 0l1.545 6.455L20 8l-6.455 1.545L12 16l-1.545-6.455L4 8l6.455-1.545z" />
        </svg>
      </div>

      {/* Message */}
      <p className="text-gray-400 text-base">{message}</p>
    </div>
  );
};

export default EmptyState;
