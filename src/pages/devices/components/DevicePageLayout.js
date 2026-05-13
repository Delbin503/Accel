import React, { useEffect, useState } from "react";
import { PrimaryButton } from "components/common/Button";
import Table from "components/common/Table";
import SlidePanel from "components/common/SlidePanel";
import DeviceFilters from "./DeviceFilters";
import { cn } from "utils/common";

/**
 * Reusable device page layout component
 * Used by both Camera and NVR device pages
 *
 * @param {object} props
 * @param {string} props.pageTitle - Title displayed in header
 * @param {array} props.columns - Table column definitions
 * @param {array} props.devices - Device data for table
 * @param {boolean} props.isLoadingDevices - Loading state for device list
 * @param {function} props.onAddDevice - Handler for add device button
 * @param {function} props.onOpenDeviceDetail - Handler for opening device detail
 * @param {object} props.pagination - Pagination configuration
 * @param {object} props.filters - Filter state and handlers
 * @param {object} props.slidePanel - Slide panel state and configuration
 * @param {React.ReactNode} props.AddDeviceModalComponent - Modal component for adding devices
 */
const DevicePageLayout = ({
  pageTitle,
  columns,
  devices,
  isLoadingDevices,
  onAddDevice,
  onOpenDeviceDetail,
  pagination,
  filters,
  slidePanel,
  AddDeviceModalComponent,
}) => {
  
  const { currentPage, pageSize, totalCount, onPageChange, onPageSizeChange } = pagination;

  const {
    filters: filterValues,
    setFilters,
    siteOptions,
    areaOptions,
    handleSearch,
    handleReset,
  } = filters;

  const {
    isOpen,
    selectedDevice,
    selectedPanelMenu,
    setSelectedPanelMenu,
    onClose,
    width,
    renderContent,
  } = slidePanel;

  // Render action buttons for table rows
  const renderActions = (row) => (
    <button
      className="flex w-full items-center justify-center text-gray-400 transition-colors hover:text-white"
      onClick={() => onOpenDeviceDetail(row.id)}
    >
      <div className="flex h-[40px] w-[40px] items-center justify-center gap-4 rounded-[6px] border border-neutral-700 p-2">
        <svg className="h-[12px] w-[6px]" fill="none" stroke="currentColor" viewBox="0 0 6 12" style={{ strokeWidth: 1.67 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l4 5-4 5" />
        </svg>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-surface p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">{pageTitle}</h1>
        <PrimaryButton onClick={onAddDevice} className="flex items-center space-x-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New {pageTitle}</span>
        </PrimaryButton>
      </div>

      {/* Filters */}
      <DeviceFilters
        filters={filterValues}
        setFilters={setFilters}
        siteOptions={siteOptions}
        areaOptions={areaOptions}
        handleSearch={handleSearch}
        handleReset={handleReset}
      />

      {/* Table */}
      {isLoadingDevices ? (
        <div className="flex h-64 items-center justify-center">
          <span className="text-textSecondary">Loading devices...</span>
        </div>
      ) : (
        <Table
          columns={columns}
          data={devices}
          renderActions={renderActions}
          pagination={true}
          manualPagination={true}
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={onPageChange}
          onPageSizeChange={(newSize) => {
            onPageSizeChange(newSize);
            onPageChange(1);
          }}
          initialPageSize={pageSize}
          headerCellClassName="!text-textPrimary text-base font-normal"
          rowClassName="!text-textPrimary"
        />
      )}

      {/* Add Device Modal */}
      {AddDeviceModalComponent}

      {/* Device Details Slide Panel */}
      <SlidePanel isOpen={isOpen} onClose={onClose} width={width}>
        {selectedDevice && (
          <div className="flex h-full min-h-0 flex-col">
            {/* Panel Header */}
            <div className="sticky top-0 z-50 flex justify-between border-b border-b-neutral-700 bg-neutral-900 px-[40px] py-[24px]">
              <div>
                <div className="flex gap-2">
                  <span className="text-lg font-semibold text-textPrimary">
                    {selectedDevice?.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-[10px] py-[4px] !text-xs font-medium",
                      selectedDevice?.isStarted
                        ? "border-green-500 text-green-500"
                        : "border-red-500 text-red-500"
                    )}
                  >
                    {selectedDevice?.isStarted
                      ? "Online"
                      : "Offline"}
                  </span>
                </div>
                <p className="text-textSecondary">{selectedDevice?.uID}</p>
              </div>

              <button onClick={onClose}>
                <img src="/icons/xIcon.svg" onClick={onClose} />
              </button>
            </div>

            {/* Panel Content */}
            <div className="mb-[24px] min-h-0 flex-1 space-y-6 overflow-hidden px-[40px]">
              {renderContent(selectedPanelMenu, setSelectedPanelMenu)}
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
};

export default DevicePageLayout;
