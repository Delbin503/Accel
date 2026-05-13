import React from "react";
import { PrimaryButton, SecondaryButton } from "components/common/Button";

const ButtonShowcase = () => {
  return (
    <div className="p-8 bg-surface-deep min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">
          Button Components
        </h1>

        {/* Primary Buttons */}
        <div className="bg-surface-dark rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Primary Buttons
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Gradient background: linear-gradient(77.14deg, #EE4D2D 14.94%,
            #AC0001 93.95%)
          </p>
          <div className="flex flex-wrap gap-4">
            <PrimaryButton>Default Primary</PrimaryButton>
            <PrimaryButton onClick={() => alert("Clicked!")}>
              Click Me
            </PrimaryButton>
            <PrimaryButton disabled>Disabled</PrimaryButton>
            <PrimaryButton className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>With Icon</span>
            </PrimaryButton>
          </div>
        </div>

        {/* Secondary Buttons */}
        <div className="bg-surface-dark rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Secondary Buttons
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Border: 1px solid #F87171
          </p>
          <div className="flex flex-wrap gap-4">
            <SecondaryButton>Default Secondary</SecondaryButton>
            <SecondaryButton onClick={() => alert("Clicked!")}>
              Click Me
            </SecondaryButton>
            <SecondaryButton disabled>Disabled</SecondaryButton>
            <SecondaryButton className="flex items-center space-x-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Cancel</span>
            </SecondaryButton>
          </div>
        </div>

        {/* Combined Example */}
        <div className="bg-surface-dark rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Combined Usage
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Example of primary and secondary buttons used together
          </p>
          <div className="flex justify-end space-x-3">
            <SecondaryButton>Cancel</SecondaryButton>
            <PrimaryButton>Save Changes</PrimaryButton>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-surface-dark rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Usage Example
          </h2>
          <pre className="bg-neutral-950 p-4 rounded text-gray-300 text-sm overflow-x-auto">
            {`import { PrimaryButton, SecondaryButton } from 'components/common/Button';

// Primary Button
<PrimaryButton onClick={handleClick}>
  Submit
</PrimaryButton>

// Secondary Button  
<SecondaryButton onClick={handleCancel}>
  Cancel
</SecondaryButton>

// With custom classes
<PrimaryButton className="flex items-center space-x-2">
  <Icon />
  <span>Text</span>
</PrimaryButton>

// Disabled state
<PrimaryButton disabled>
  Loading...
</PrimaryButton>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ButtonShowcase;
