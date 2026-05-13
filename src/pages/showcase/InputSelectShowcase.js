import React, { useState } from "react";
import InputSelect from "components/common/InputSelect";
import { PrimaryButton } from "components/common/Button";

const InputSelectShowcase = () => {
  // Single select state
  const [singleValue, setSingleValue] = useState(null);
  const [singleWithLabel, setSingleWithLabel] = useState(null);

  // Multi select state
  const [multiValue, setMultiValue] = useState([]);
  const [multiWithLimit, setMultiWithLimit] = useState([]);

  // Sample options
  const deviceOptions = [
    { value: "camera", label: "Camera" },
    { value: "nvr", label: "NVR" },
    { value: "dvr", label: "DVR" },
    { value: "encoder", label: "Encoder" },
  ];

  const siteOptions = [
    { value: "changi", label: "FedEX Changi Hub" },
    { value: "jurong", label: "FedEX Jurong Port" },
    { value: "woodlands", label: "FedEX Woodlands Checkpoint" },
    { value: "tuas", label: "FedEX Tuas Terminal" },
  ];

  const areaOptions = [
    { value: "camp", label: "Camp Area" },
    { value: "loading", label: "Loading Bay" },
    { value: "parking", label: "Parking Lot" },
    { value: "entrance", label: "Main Entrance" },
    { value: "exit", label: "Exit Gate" },
    { value: "warehouse", label: "Warehouse" },
  ];

  const laneOptions = Array.from({ length: 10 }, (_, i) => ({
    value: `lane-${i + 1}`,
    label: `Lane ${i + 1}`,
  }));

  const handleSubmit = () => {
    console.log("Form submitted:", {
      singleValue,
      singleWithLabel,
      multiValue,
      multiWithLimit,
    });
  };

  return (
    <div className="p-8 bg-surface-deep min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          InputSelect Component
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Single Select - Basic */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">
              Single Select - Basic
            </h3>
            <InputSelect
              options={deviceOptions}
              value={singleValue}
              onChange={setSingleValue}
              placeholder="Select device type"
            />
            <p className="text-sm text-gray-400 mt-2">
              Selected: {singleValue ? singleValue.label : "None"}
            </p>
          </div>

          {/* Single Select - With Label */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">
              Single Select - With Label
            </h3>
            <InputSelect
              label="Site Location"
              required
              options={siteOptions}
              value={singleWithLabel}
              onChange={setSingleWithLabel}
              placeholder="Select site"
            />
            <p className="text-sm text-gray-400 mt-2">
              Selected: {singleWithLabel ? singleWithLabel.label : "None"}
            </p>
          </div>

          {/* Multi Select - Basic */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">
              Multi Select - Basic
            </h3>
            <InputSelect
              label="Areas"
              isMulti
              options={areaOptions}
              value={multiValue}
              onChange={setMultiValue}
              placeholder="Select multiple areas"
            />
            <p className="text-sm text-gray-400 mt-2">
              Selected: {multiValue.length} area(s)
            </p>
          </div>

          {/* Multi Select - With Clear */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">
              Multi Select - Lanes
            </h3>
            <InputSelect
              label="Lane(s)"
              required
              isMulti
              options={laneOptions}
              value={multiWithLimit}
              onChange={setMultiWithLimit}
              placeholder="Select lanes"
              isClearable
            />
            <p className="text-sm text-gray-400 mt-2">
              Selected: {multiWithLimit.length} lane(s)
            </p>
          </div>

          {/* Disabled State */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Disabled State</h3>
            <InputSelect
              label="Device Type"
              options={deviceOptions}
              value={{ value: "camera", label: "Camera" }}
              isDisabled
              placeholder="This is disabled"
            />
          </div>

          {/* With Error */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">With Error Message</h3>
            <InputSelect
              label="Required Field"
              required
              options={deviceOptions}
              value={null}
              onChange={() => {}}
              placeholder="Select something"
              error="This field is required"
            />
          </div>

          {/* Not Searchable */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Not Searchable</h3>
            <InputSelect
              label="Device Type"
              options={deviceOptions}
              value={null}
              onChange={() => {}}
              isSearchable={false}
              placeholder="Click to select"
            />
          </div>

          {/* Not Clearable */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Not Clearable</h3>
            <InputSelect
              label="Site Location"
              options={siteOptions}
              value={{ value: "changi", label: "FedEX Changi Hub" }}
              onChange={() => {}}
              isClearable={false}
              placeholder="Cannot be cleared"
            />
          </div>
        </div>

        {/* Form Example */}
        <div className="bg-surface-dark rounded-lg p-6">
          <h3 className="text-white font-medium mb-6">Complete Form Example</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSelect
              label="Device Type"
              required
              options={deviceOptions}
              value={singleValue}
              onChange={setSingleValue}
              placeholder="Select device type"
            />
            <InputSelect
              label="Site Location"
              required
              options={siteOptions}
              value={singleWithLabel}
              onChange={setSingleWithLabel}
              placeholder="Select site"
            />
            <InputSelect
              label="Areas"
              required
              isMulti
              options={areaOptions}
              value={multiValue}
              onChange={setMultiValue}
              placeholder="Select areas"
            />
            <InputSelect
              label="Lanes"
              isMulti
              options={laneOptions}
              value={multiWithLimit}
              onChange={setMultiWithLimit}
              placeholder="Select lanes"
            />
          </div>
          <div className="mt-6 flex justify-end">
            <PrimaryButton onClick={handleSubmit}>Submit Form</PrimaryButton>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-surface-dark rounded-lg p-6">
          <h3 className="text-white font-medium mb-4">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">
                Single & Multi selection support
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">
                Dark theme matching app design
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">Searchable dropdown</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">Clearable values</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">
                Label & required field indicator
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">
                Error message display
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">Disabled state</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-orange-500">✓</span>
              <span className="text-gray-300 text-sm">
                Orange accent color (#EE4D2D)
              </span>
            </div>
          </div>
        </div>

        {/* Usage Code */}
        <div className="bg-surface-dark rounded-lg p-6">
          <h3 className="text-white font-medium mb-4">Usage Example</h3>
          <pre className="bg-neutral-950 p-4 rounded text-gray-300 text-sm overflow-x-auto">
            {`import InputSelect from 'components/common/InputSelect';

// Single Select
const [value, setValue] = useState(null);

<InputSelect
  label="Device Type"
  required
  options={[
    { value: 'camera', label: 'Camera' },
    { value: 'nvr', label: 'NVR' }
  ]}
  value={value}
  onChange={setValue}
  placeholder="Select device type"
/>

// Multi Select
const [values, setValues] = useState([]);

<InputSelect
  label="Areas"
  isMulti
  options={areaOptions}
  value={values}
  onChange={setValues}
  placeholder="Select areas"
/>

// With Error
<InputSelect
  label="Required Field"
  required
  error="This field is required"
  {...props}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InputSelectShowcase;
