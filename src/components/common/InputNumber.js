import { useRef } from "react";

const InputNumber = ({ label, name, value, onChange, onBlur, error, touched, disabled = false, required = false, placeholder = "", unit = "", ...props }) => {
    const inputRef = useRef(null);

    const bumpValue = (direction) => {
        if (!inputRef.current || disabled) return;
        if (direction === "up") {
            inputRef.current.stepUp();
        } else {
            inputRef.current.stepDown();
        }
        inputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
    };

    return (
        <div className="mb-4">
            {label && (
                <label className="mb-2 block text-sm font-medium text-textSecondary">
                    {label} {required && <span className="text-neutral-300">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    name={name}
                    type="number"
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={`h-[42px] w-full rounded-lg border bg-transparent px-4 text-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-neutral-700 ${unit ? "pr-20" : "pr-12"} ${touched && error ? "border-red-500 focus:border-red-500" : "border-neutral-700 hover:border-neutralHover focus:border-brand"}`}
                    {...props}
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
                    {unit && <span className="text-s text-neutral-400">{unit}</span>}
                    <div className="flex flex-col">
                        <button
                            type="button"
                            onClick={() => bumpValue("up")}
                            disabled={disabled}
                            className="flex h-4 w-4 items-center justify-center text-neutral-400 hover:text-textSecondary disabled:opacity-60"
                            aria-label="Increase"
                        >
                            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                                <path d="M4.22 10.03a.75.75 0 0 0 1.06 0L8 7.31l2.72 2.72a.75.75 0 1 0 1.06-1.06L8.53 5.72a.75.75 0 0 0-1.06 0L4.22 8.97a.75.75 0 0 0 0 1.06z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => bumpValue("down")}
                            disabled={disabled}
                            className="flex h-4 w-4 items-center justify-center text-neutral-400 hover:text-textSecondary disabled:opacity-60"
                            aria-label="Decrease"
                        >
                            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                                <path d="M11.78 5.97a.75.75 0 0 0-1.06 0L8 8.69 5.28 5.97a.75.75 0 0 0-1.06 1.06l3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 0 0 0-1.06z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            {touched && error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
    );
}

export default InputNumber;