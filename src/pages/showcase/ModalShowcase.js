import React, { useState } from "react";
import Modal from "components/common/Modal";
import { PrimaryButton, SecondaryButton } from "components/common/Button";

const ModalShowcase = () => {
  const [openModal, setOpenModal] = useState(null);

  // Generate long content for scrolling demo
  const generateLongForm = () => {
    const fields = [];
    for (let i = 1; i <= 30; i++) {
      fields.push(
        <div key={i} className="mb-4">
          <label className="block text-sm text-gray-300 mb-2">
            Field {i} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder={`Enter value for field ${i}`}
            className="w-full px-4 py-2.5 bg-surface-elevated text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none placeholder-gray-500"
          />
        </div>
      );
    }
    return fields;
  };

  const basicFooter = (onClose) => (
    <div className="flex justify-end space-x-3">
      <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
      <PrimaryButton onClick={onClose}>Confirm</PrimaryButton>
    </div>
  );

  return (
    <div className="p-8 bg-surface-deep min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          Modal Component Examples
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Small Modal */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">Small Modal</h3>
            <p className="text-gray-400 text-sm mb-4">
              Compact modal for simple confirmations
            </p>
            <PrimaryButton onClick={() => setOpenModal("small")}>
              Open Small Modal
            </PrimaryButton>
          </div>

          {/* Medium Modal */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">
              Medium Modal (Default)
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Standard size for most forms
            </p>
            <PrimaryButton onClick={() => setOpenModal("medium")}>
              Open Medium Modal
            </PrimaryButton>
          </div>

          {/* Large Modal */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">Large Modal</h3>
            <p className="text-gray-400 text-sm mb-4">
              For complex forms with multiple sections
            </p>
            <PrimaryButton onClick={() => setOpenModal("large")}>
              Open Large Modal
            </PrimaryButton>
          </div>

          {/* Extra Large Modal */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">Extra Large Modal</h3>
            <p className="text-gray-400 text-sm mb-4">
              Maximum width for detailed content
            </p>
            <PrimaryButton onClick={() => setOpenModal("xl")}>
              Open XL Modal
            </PrimaryButton>
          </div>

          {/* Very Long Form */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">
              Long Scrollable Form
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Demonstrates scrolling with 30+ fields
            </p>
            <PrimaryButton onClick={() => setOpenModal("long")}>
              Open Long Form
            </PrimaryButton>
          </div>

          {/* No Footer */}
          <div className="bg-surface-dark rounded-lg p-6">
            <h3 className="text-white font-medium mb-3">
              Modal Without Footer
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Content only, no action buttons
            </p>
            <PrimaryButton onClick={() => setOpenModal("noFooter")}>
              Open Modal
            </PrimaryButton>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-surface-dark rounded-lg p-6 mt-8">
          <h3 className="text-white font-medium mb-4">Modal Features</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>Fixed Header & Footer:</strong> Always visible while
                scrolling
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>Scrollable Body:</strong> Handles long forms without
                breaking layout
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>Max Height:</strong> Limited to 90vh to fit any screen
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>ESC Key:</strong> Press ESC to close modal
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>Backdrop Click:</strong> Click outside to close
                (configurable)
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>Body Scroll Lock:</strong> Prevents background scrolling
                when open
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>Portal Rendering:</strong> Renders at document.body
                level
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span>
                <strong>Responsive Sizes:</strong> sm, md, lg, xl, full options
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Small Modal */}
      <Modal
        isOpen={openModal === "small"}
        onClose={() => setOpenModal(null)}
        title="Small Modal"
        size="sm"
        footer={basicFooter(() => setOpenModal(null))}
      >
        <p className="text-gray-300">
          This is a small modal, perfect for simple confirmations or messages.
        </p>
      </Modal>

      {/* Medium Modal */}
      <Modal
        isOpen={openModal === "medium"}
        onClose={() => setOpenModal(null)}
        title="Medium Modal"
        size="md"
        footer={basicFooter(() => setOpenModal(null))}
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This is the default medium-sized modal, suitable for most forms.
          </p>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Name</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-surface-elevated text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2.5 bg-surface-elevated text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* Large Modal */}
      <Modal
        isOpen={openModal === "large"}
        onClose={() => setOpenModal(null)}
        title="Large Modal"
        size="lg"
        footer={basicFooter(() => setOpenModal(null))}
      >
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <label className="block text-sm text-gray-300 mb-2">
                Field {i}
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-surface-elevated text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </Modal>

      {/* Extra Large Modal */}
      <Modal
        isOpen={openModal === "xl"}
        onClose={() => setOpenModal(null)}
        title="Extra Large Modal"
        size="xl"
        footer={basicFooter(() => setOpenModal(null))}
      >
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i}>
              <label className="block text-sm text-gray-300 mb-2">
                Field {i}
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-surface-elevated text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </Modal>

      {/* Long Scrollable Form */}
      <Modal
        isOpen={openModal === "long"}
        onClose={() => setOpenModal(null)}
        title="Long Scrollable Form (30 Fields)"
        size="lg"
        footer={basicFooter(() => setOpenModal(null))}
      >
        <div className="space-y-4">
          <p className="text-gray-300 mb-4">
            This demonstrates how the modal handles very long forms. The header
            and footer stay fixed while the content scrolls.
          </p>
          {generateLongForm()}
        </div>
      </Modal>

      {/* No Footer Modal */}
      <Modal
        isOpen={openModal === "noFooter"}
        onClose={() => setOpenModal(null)}
        title="Modal Without Footer"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This modal has no footer. You can close it using the X button, ESC
            key, or clicking outside.
          </p>
          <p className="text-gray-400 text-sm">
            This is useful for informational modals that don't require actions.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ModalShowcase;
