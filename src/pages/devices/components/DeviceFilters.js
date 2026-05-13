import React from "react";
import InputSelect from "components/common/InputSelect";
import { PrimaryButton, SecondaryButton } from "components/common/Button";

const DeviceFilters = ({
  filters,
  setFilters,
  siteOptions,
  areaOptions,
  handleSearch,
  handleReset,
}) => {
  // Add "Select all areas" option to area options
  const areaOptionsWithSelectAll = [
    { value: "select_all", label: "Select all areas" },
    ...(areaOptions || []),
  ];

  // Handle area selection with "Select all" logic
  const handleAreaChange = (selectedOptions) => {
    if (!selectedOptions) {
      setFilters({ ...filters, area: [] });
      return;
    }

    const selectedValues = Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions];

    // Check if "Select all" was just selected
    const selectAllOption = selectedValues.find((opt) => opt.value === "select_all");
    const previouslySelectedAll = filters.area?.length === areaOptions?.length;

    if (selectAllOption && !previouslySelectedAll) {
      // Select all areas (excluding "Select all" option itself)
      setFilters({ ...filters, area: areaOptions || [] });
    } else if (!selectAllOption && previouslySelectedAll) {
      // Deselect all
      setFilters({ ...filters, area: [] });
    } else {
      // Normal selection (filter out "Select all" from the final value)
      const filtered = selectedValues.filter((opt) => opt.value !== "select_all");
      setFilters({ ...filters, area: filtered });
    }
  };

  // Determine the display value for area filter
  const areaDisplayValue =
    filters.area?.length === areaOptions?.length
      ? [{ value: "select_all", label: "Select all areas" }, ...(filters.area || [])]
      : filters.area || [];

  return (
    <div className="mb-6 rounded-lg border border-neutral-700 bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Site Location */}
        <InputSelect
          label="Site Location"
          required
          options={siteOptions}
          value={filters.siteLocation}
          onChange={(value) => setFilters({ ...filters, siteLocation: value })}
          placeholder="Select site"
          showCheckbox={true}
        />

        {/* Area */}
        <InputSelect
          label="Area(s)"
          required
          isMulti={true}
          options={areaOptionsWithSelectAll}
          value={areaDisplayValue}
          onChange={handleAreaChange}
          placeholder="Select areas"
          showCheckbox={true}
        />

        {/* Search */}
        <div>
          <label className="mb-2 block text-sm font-medium text-textSecondary">Search</label>
          <input
            type="text"
            placeholder="Search devices (e.g. CAM_001)"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-neutral-700 bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary hover:border-neutralHover focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end space-x-3">
        <button
          onClick={handleReset}
          className="rounded-lg border border-neutral-700 bg-neutral-700 px-[16px] py-[10px] text-[14px] font-medium text-neutral-400 transition-all duration-200 hover:bg-neutral-active active:scale-95"
        >
          Reset
        </button>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 rounded-lg px-[16px] py-[10px] text-[14px] font-medium text-textLight transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(77.14deg, #EE4D2D 14.94%, #AC0001 93.95%)",
          }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </div>
    </div>
  );
};

export default DeviceFilters;
