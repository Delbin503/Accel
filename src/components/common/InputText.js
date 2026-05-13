import { useState } from "react";

const InputText = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  type = "text",
  disabled = false,
  required = false,
  placeholder = "",
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-medium text-textSecondary">
          {label} {required && <span className="text-neutral-300">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`h-[42px] w-full rounded-lg border bg-transparent px-4 text-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-neutral-700 ${isPassword ? "pr-12" : ""} ${touched && error ? "border-red-500 focus:border-red-500" : "border-neutral-700 hover:border-neutralHover focus:border-brand"} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-textSecondary"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <img
              src={showPassword ? "/icons/eyeCloseIcon.svg" : "/icons/eyeOpenIcon.svg"}
              alt={showPassword ? "Hide password" : "Show password"}
              className="h-4 w-4"
            />
          </button>
        )}
      </div>
      {touched && error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default InputText;