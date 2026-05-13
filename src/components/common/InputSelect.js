import Select, { components } from "react-select";

const InputSelect = ({
  options,
  value,
  onChange,
  onBlur,
  isMulti = false,
  placeholder = "Select...",
  isDisabled = false,
  isSearchable = true,
  isClearable = true,
  className = "",
  label = "",
  required = false,
  error = "",
  touched = false,
  fontSize = "14px",
  menuPortalTarget = null,
  showCheckbox = false,
  ...props
}) => {
  const hasError = touched && error;

  // Custom Option component with checkbox
  const CheckboxOption = (props) => {
    const isSelected = props.isSelected;

    // For multi-select: checkbox on left
    if (isMulti) {
      return (
        <components.Option {...props}>
          <div className="flex items-center gap-2">
            <div
              className={`flex h-4 w-4 items-center justify-center rounded ${
                isSelected ? "bg-amber-500" : "border border-neutralHover bg-transparent"
              }`}
            >
              {isSelected && (
                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span>{props.label}</span>
          </div>
        </components.Option>
      );
    }

    // For single-select: checkmark on right
    return (
      <components.Option {...props}>
        <div className="flex items-center justify-between">
          <span>{props.label}</span>
          {isSelected && (
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </components.Option>
    );
  };

  // Custom styles matching our dark theme
  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
      borderColor: hasError ? "#ef4444" : "#404040",
      borderRadius: "0.5rem",
      padding: "0.125rem 0.5rem",
      minHeight: "42px",
      boxShadow: hasError ? "0 0 0 1px #ef4444" : "none",
      "&:hover": {
        borderColor: hasError ? "#ef4444" : "#606060",
      },
      cursor: isDisabled ? "not-allowed" : "pointer",
      fontSize: fontSize,
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#2a2a2a",
      border: "1px solid #404040",
      borderRadius: "0.5rem",
      marginTop: "4px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: "4px",
      maxHeight: "200px",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#404040" : "transparent",
      color: "#e5e5e5",
      cursor: "pointer",
      padding: "10px 12px",
      borderRadius: "0.375rem",
      fontSize: fontSize,
      "&:active": {
        backgroundColor: "#404040",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#D4D4D4",
      fontSize: fontSize,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDisabled ? "#6b7280" : "#D4D4D4",
      fontSize: fontSize,
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#404040",
      borderRadius: "0.375rem",
      fontSize: fontSize,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: isDisabled ? "#6b7280" : "#D4D4D4",
      padding: "2px 6px",
      fontSize: fontSize,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#9ca3af",
      "&:hover": {
        backgroundColor: "#EE4D2D",
        color: "#D4D4D4",
      },
      borderRadius: "0 0.375rem 0.375rem 0",
    }),
    input: (provided) => ({
      ...provided,
      color: "#D4D4D4",
      fontSize: fontSize,
    }),
    dropdownIndicator: (provided, state) => ({
      ...provided,
      color: state.isFocused ? "#EE4D2D" : "#6b7280",
      "&:hover": {
        color: "#EE4D2D",
      },
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "#6b7280",
      "&:hover": {
        color: "#EE4D2D",
      },
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: "#404040",
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: "#EE4D2D",
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: "#9ca3af",
      fontSize: fontSize,
    }),
  };

  return (
    <div className={`${className} ${isDisabled ? "cursor-not-allowed" : ""}`}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-textSecondary">
          {label} {required && <span className="text-neutral-300">*</span>}
        </label>
      )}
      <Select
        options={options}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        isMulti={isMulti}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isSearchable={isSearchable}
        isClearable={isClearable}
        closeMenuOnSelect={!isMulti}
        hideSelectedOptions={false}
        styles={customStyles}
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPortalTarget ? "fixed" : "absolute"}
        components={showCheckbox ? { Option: CheckboxOption } : {}}
        theme={(theme) => ({
          ...theme,
          colors: {
            ...theme.colors,
            primary: "#EE4D2D",
            primary75: "#f87171",
            primary50: "#fca5a5",
            primary25: "#404040",
            danger: "#ef4444",
            dangerLight: "#fee2e2",
            neutral0: "#2a2a2a",
            neutral5: "#333333",
            neutral10: "#404040",
            neutral20: "#4d4d4d",
            neutral30: "#606060",
            neutral40: "#737373",
            neutral50: "#9ca3af",
            neutral60: "#d1d5db",
            neutral70: "#e5e7eb",
            neutral80: "#f3f4f6",
            neutral90: "#f9fafb",
          },
        })}
        {...props}
      />
      {hasError && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default InputSelect;
