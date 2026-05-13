import { Bounce, toast } from "react-toastify";

const ErrorCrossMark = ({ color, width }) => {
  return (
    <svg
      color={color}
      width={width || "14"}
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="29.8975" opacity="0" width="30.249" x="0" y="0" />
      <path
        d="M14.9414 29.8828C23.1885 29.8828 29.8828 23.1885 29.8828 14.9414C29.8828 6.69434 23.1885 0 14.9414 0C6.69434 0 0 6.69434 0 14.9414C0 23.1885 6.69434 29.8828 14.9414 29.8828ZM14.9414 27.3926C8.05664 27.3926 2.49023 21.8262 2.49023 14.9414C2.49023 8.05664 8.05664 2.49023 14.9414 2.49023C21.8262 2.49023 27.3926 8.05664 27.3926 14.9414C27.3926 21.8262 21.8262 27.3926 14.9414 27.3926Z"
        fill={color || "#9747FF"}
        fillOpacity="0.85"
      />
      <path
        d="M9.93164 21.1377C10.2686 21.1377 10.5615 21.0059 10.7812 20.7715L14.9268 16.6113L19.1016 20.7715C19.3213 20.9912 19.5996 21.1377 19.9365 21.1377C20.5811 21.1377 21.1084 20.6104 21.1084 19.9512C21.1084 19.6143 20.9912 19.3506 20.7568 19.1162L16.5967 14.9561L20.7715 10.7666C21.0205 10.5176 21.123 10.2686 21.123 9.94629C21.123 9.30176 20.5957 8.77441 19.9512 8.77441C19.6436 8.77441 19.3945 8.8916 19.1455 9.14062L14.9268 13.3154L10.752 9.15527C10.5322 8.9209 10.2686 8.80371 9.93164 8.80371C9.28711 8.80371 8.75977 9.31641 8.75977 9.96094C8.75977 10.2832 8.8916 10.5615 9.11133 10.7812L13.2715 14.9561L9.11133 19.1309C8.8916 19.3506 8.75977 19.6289 8.75977 19.9512C8.75977 20.6104 9.28711 21.1377 9.93164 21.1377Z"
        fill={color || "#9747FF"}
        fillOpacity="0.85"
      />
    </svg>
  );
};

const SuccessCheckMark = ({ color, width }) => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM10.2437 5.86872C10.5854 5.52701 10.5854 4.97299 10.2437 4.63128C9.90201 4.28957 9.34799 4.28957 9.00628 4.63128L6.125 7.51256L4.99372 6.38128C4.65201 6.03957 4.09799 6.03957 3.75628 6.38128C3.41457 6.72299 3.41457 7.27701 3.75628 7.61872L5.50628 9.36872C5.84799 9.71043 6.40201 9.71043 6.74372 9.36872L10.2437 5.86872Z"
        fill="#16A34A"
      />
    </svg>
  );
};

const customToastStyle = {
  zIndex: 9999999,
};

export const successAlert = (
  title = "Success",
  message = "Data successfully affected.",
  autoClose
) => {
  const elementContainer = (
    <div className="bg-surface-overlay flex w-full gap-3 items-start">
      <div className="flex-shrink-0 w-[24px] h-[24px] flex items-center justify-center">
        <SuccessCheckMark />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-white font-medium text-sm leading-6">
          {title}
        </span>
        <span className="text-textSecondary text-sm ">{message}</span>
      </div>
    </div>
  );

  toast(elementContainer, {
    position: "top-right",
    autoClose: !isNaN(autoClose) ? autoClose : 4000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    transition: Bounce,
    closeButton: ({ closeToast }) => (
      <button
        onClick={closeToast}
        className="text-white/70 hover:text-white p-1 mt-0"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
        </svg>
      </button>
    ),
    className: "!bg-surface-overlay z-[9999999] !w-[500px] !py-[12px] !px-[20px] ",
    style: {
      ...customToastStyle,
      minHeight: "80px",
    },
  });
};

export const errorAlert = (
  message = "Something went wrong.",
  title = "Error",
  autoClose
) => {
  const elementContainer = (
    <div className="bg-surface-overlay flex w-full gap-3 items-start">
      <div className="flex-shrink-0 w-[24px] h-[24px] flex items-center justify-center">
        <ErrorCrossMark color="#EF4444" />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-white font-medium text-sm leading-6">
          {title}
        </span>
        <span className="text-textSecondary text-sm">{message}</span>
      </div>
    </div>
  );

  toast(elementContainer, {
    position: "top-right",
    autoClose: !isNaN(autoClose) ? autoClose : 4000,
    hideProgressBar: true,
    closeOnClick: false,
    pauseOnHover: true,
    transition: Bounce,
    closeButton: ({ closeToast }) => (
      <button
        onClick={closeToast}
        className="text-white/70 hover:text-white p-1 mt-0"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
        </svg>
      </button>
    ),
    className: "!bg-surface-overlay z-[9999999] !w-[500px] !py-[12px] !px-[20px]",
    style: {
      ...customToastStyle,
      minHeight: "80px",
    },
  });
};
