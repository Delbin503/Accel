const InputSearch = ({ onChange, value, placeholder = "Search", className = "" }) => {
  return (
    <div className={`flex items-center gap-1 rounded border border-neutral-600 px-3 py-2 text-white ${className}`}>
      <img src="icons/searchIcon.svg" alt="Search" className="h-5 w-5 flex-shrink-0" />
      <input
        value={value}
        onChange={onChange}
        type="text"
        placeholder={placeholder}
        className="w-full appearance-none border-0 bg-transparent text-sm text-textPrimary placeholder-neutral-500 shadow-none outline-none ring-0 focus:outline-none focus:ring-0"
      />
    </div>
  );
};

export default InputSearch;
