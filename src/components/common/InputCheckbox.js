const InputCheckbox = ({ label, color, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer text-white">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="peer hidden"
    />

    <div
      className={`
        w-4 h-4 rounded border
        ${checked ? `bg-${color} border-${color}` : 'bg-neutral-700 border-neutral-700'}
        flex items-center justify-center
        transition-colors
      `}
    >
      {checked && (
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>

    {label}
  </label>
);


export default InputCheckbox