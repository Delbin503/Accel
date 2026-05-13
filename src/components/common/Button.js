import React from "react";

// Primary Button with gradient background
export const PrimaryButton = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg px-[16px] py-[10px] text-sm font-medium
        text-textLight transition-all duration-200
        ${disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-90 active:scale-95"}
        ${className}
      `}
      style={{
        background: "linear-gradient(77.14deg, #EE4D2D 14.94%, #AC0001 93.95%)",
        backgroundBlendMode: "normal, normal",
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Secondary Button with red border
export const SecondaryButton = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg border border-red-400 bg-transparent
        px-[16px] py-[10px] text-sm font-medium text-red-400
        transition-all duration-200
        ${disabled ? "cursor-not-allowed opacity-50" : "hover:bg-red-400/10 active:scale-95"}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export const CustomButton = ({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  buttonType = "solid", // "solid" or "outline"
  color = "#404040",
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg px-[16px] py-[10px] text-sm 
        text-white transition-all duration-200
        ${disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-90 active:scale-95"}
        ${className}
      `}
      style={{
        background: buttonType === "solid" ? `${color}` : "transparent",
        backgroundBlendMode: "normal, normal",
        border: buttonType === "outline" ? `2px solid ${color}` : "none",
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Default export for convenience
const Button = {
  Primary: PrimaryButton,
  Secondary: SecondaryButton,
  Custom: CustomButton,
};

export default Button;
