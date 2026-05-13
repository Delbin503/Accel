import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CustomButton, PrimaryButton, SecondaryButton } from "components/common/Button";
import InputSelect from "components/common/InputSelect";
import InputTime from "components/common/InputTime";
import AddZoneModal from "components/devices/AddZoneModal";
import { cn } from "utils/common";
import {
  useUpdateCameraMutation,
  useDeleteCameraMutation,
  useCheckCameraExistName,
} from "services/camera";
import { successAlert, errorAlert } from "components/common/Toast";
import Modal from "components/common/Modal";

const CameraSettingForm = ({
  selectedDevice,
  onClosePanel,
  refetchDevices,
  laneOptions,
  areaOptions,
}) => {
  const checkExistName = useCheckCameraExistName();
  const [isEditMode, setIsEditMode] = useState(false);
  const queryClient = useQueryClient();
  const updateCameraMutation = useUpdateCameraMutation();
  const deleteCameraMutation = useDeleteCameraMutation();
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [zones, setZones] = useState(selectedDevice?.zones || []);

  const videoResolutionOptions = [
    { label: "HD (1280x720)", value: "1280x720" },
    { label: "Full HD (1920x1080)", value: "1920x1080" },
    { label: "2K (2560x1440)", value: "2560x1440" },
    { label: "4K (3840x2160)", value: "3840x2160" },
  ];

  const frameRateOptions = [
    { label: "15 FPS", value: "15" },
    { label: "20 FPS", value: "20" },
    { label: "25 FPS", value: "25" },
    { label: "30 FPS", value: "30" },
    { label: "60 FPS", value: "60" },
  ];

  const videoCodecOptions = [
    { label: "H.264 (AVC)", value: "H.264" },
    { label: "H.265 (HEVC)", value: "H.265" },
  ];

  const recordingModeOptions = [
    { label: "Continuous", value: "Continuous" },
    { label: "Motion Detection", value: "Motion Detection" },
    { label: "Scheduled", value: "Scheduled" },
  ];

  // Validation schema for edit form
  const validationSchema = (checkExistName) =>
    Yup.object().shape({
      name: Yup.string()
        .required("Camera name is required")
        .test("unique-name", "Name already exists", async function (value) {
          if (!value) return true;
          if (value === selectedDevice.name) return true;
          const exists = await checkExistName(value);
          return !exists;
        }),
      siteName: Yup.string().required("Site name is required"),
      area: Yup.string().required("Area is required"),
      lane: Yup.array().min(1, "At least one lane is required").required("Lane is required"),
      sourceStreamLink: Yup.string().required("RTSP stream link is required"),
      resolution: Yup.object().nullable().required("Resolution is required"),
      frameRate: Yup.object().nullable().required("Frame rate is required"),
      videoCodec: Yup.object().nullable().required("Video codec is required"),
      recordingMode: Yup.object().nullable().required("Recording mode is required"),
      preRecordingBuffer: Yup.number()
        .positive("Must be a positive number")
        .required("Pre-recording buffer is required"),
      postRecordingBuffer: Yup.number()
        .positive("Must be a positive number")
        .required("Post-recording buffer is required"),
      repeat: Yup.array().min(1, "Select at least one day").required("Repeat days are required"),
      startTime: Yup.string().required("Start time is required"),
      endTime: Yup.string().required("End time is required"),
    });

  // Helper function to normalize numbers
  const normalizeNumber = (value) => {
    return value.replace(/[^0-9]/g, "");
  };

  // Get initial values from selected device
  const getInitialValues = () => {
    if (!selectedDevice) return {};

    const videoResolution =
      selectedDevice.videoResolution || selectedDevice.camera?.videoResolution;
    const frameRate = selectedDevice.frameRate || selectedDevice.camera?.frameRate;
    const videoCodec = selectedDevice.videoCodec || selectedDevice.camera?.videoCodec;
    const recordingMode = selectedDevice.recordingMode || selectedDevice.camera?.recordingMode;

    return {
      name: selectedDevice.name || "",
      siteName: selectedDevice.siteLocation || "",
      area: selectedDevice.area || "",
      lane: selectedDevice.lane?.map((l) => ({ value: l, label: l })) || [],
      sourceStreamLink:
        selectedDevice.sourceStreamLink || selectedDevice.camera?.sourceStreamLink || "",
      resolution:
        videoResolutionOptions.find((option) => option.value === String(videoResolution)) || null,
      frameRate: frameRateOptions.find((option) => option.value === String(frameRate)) || null,
      videoCodec: videoCodecOptions.find((option) => option.value === String(videoCodec)) || null,
      recordingMode:
        recordingModeOptions.find((option) => option.value === String(recordingMode)) || null,
      preRecordingBuffer:
        selectedDevice.preRecordingBuffer || selectedDevice.camera?.preRecordingBuffer || "",
      postRecordingBuffer:
        selectedDevice.postRecordingBuffer || selectedDevice.camera?.postRecordingBuffer || "",
      repeat: selectedDevice.repeatDay || selectedDevice.camera?.repeatDay || [],
      startTime: selectedDevice.startTime || selectedDevice.camera?.startTime || "",
      endTime: selectedDevice.endTime || selectedDevice.camera?.endTime || "",
      zones: [],
    };
  };

  // Handle form submission
  const handleEditSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        name: values.name,
        siteLocation: values.siteName,
        area: values.area,
        ipAddress: values.ipAddress,
        lane: values.lane?.map((l) => l.value) || [],
        rtspPort: values.rtspPort,
        sourceStreamLink: values.sourceStreamLink,
        videoResolution: values.resolution?.value,
        frameRate: values.frameRate?.value,
        videoCodec: values.videoCodec?.value,
        recordingMode: values.recordingMode?.value,
        preRecordingBuffer: values.preRecordingBuffer,
        postRecordingBuffer: values.postRecordingBuffer,
        repeatDay: values.repeat,
        startTime: values.startTime,
        endTime: values.endTime,
      };

      await updateCameraMutation.mutateAsync({
        uId: selectedDevice.uID,
        payload,
      });

      successAlert("Camera Updated", "Camera has been updated successfully");

      // Set edit mode to false first
      setIsEditMode(false);

      // Invalidate queries to refetch device data
      queryClient.invalidateQueries(["device", selectedDevice.uID]);
      queryClient.invalidateQueries(["devices"]);

      if (refetchDevices) {
        refetchDevices();
      }
    } catch (error) {
      errorAlert(
        "Update Failed",
        error?.response?.data?.message || error.message || "Failed to update device"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteCamera = async () => {
    try {
      await deleteCameraMutation.mutateAsync(selectedDevice.uID);
      successAlert("Camera Deleted", "Camera has been deleted successfully");
      onClosePanel();
      refetchDevices();
    } catch (error) {
      errorAlert("Delete Failed", error.message || "Failed to delete device");
    }
  };
  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema: validationSchema(checkExistName),
    onSubmit: handleEditSubmit,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
  });

  const {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    isSubmitting,
    resetForm,
    submitForm,
    handleSubmit,
  } = formik;

  // Filter lanes based on selected area
  const finalLaneOptions = values.area
    ? laneOptions?.filter((lane) => lane.areaID === values.area) || []
    : laneOptions || [];

  // Handle area change
  const areaHandleChange = (value) => {
    setFieldValue("area", value);
    setFieldValue("lane", []);
  };

  // Toggle day selection
  const toggleDay = (day) => {
    const currentDays = values.repeat || [];
    if (currentDays.includes(day)) {
      setFieldValue(
        "repeat",
        currentDays.filter((d) => d !== day)
      );
    } else {
      setFieldValue("repeat", [...currentDays, day]);
    }
  };

  const deleteModalFooter = () => (
    <div className="flex justify-end space-x-2">
      <SecondaryButton onClick={() => setIsDeleteConfirming(false)}>Cancel</SecondaryButton>

      <PrimaryButton onClick={handleDeleteCamera}>Delete</PrimaryButton>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <AddZoneModal
        isOpen={isAddZoneModalOpen}
        onClose={() => {
          setIsAddZoneModalOpen(false);
          setZones(selectedDevice?.zones || []);
        }}
        zones={zones}
        setZones={setZones}
        rtspStreamLink={selectedDevice?.rtspStreamLink}
        camera={{
          id: selectedDevice?.uID,
          name: selectedDevice?.name,
          location: selectedDevice?.siteLocation,
          stream: selectedDevice?.rtspStreamLink,
          base64frame: selectedDevice?.base64frame,
        }}
        footer={
          <div className="flex justify-end space-x-3">
            <SecondaryButton
              onClick={() => {
                setIsAddZoneModalOpen(false);
                setZones(selectedDevice?.zones || []);
              }}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={async () => {
                await updateCameraMutation.mutateAsync({
                  uId: selectedDevice.uID,
                  payload: { zones },
                });
                if (refetchDevices) refetchDevices();
                setIsAddZoneModalOpen(false);
              }}
            >
              Confirm
            </PrimaryButton>
          </div>
        }
      />
      <div className="flex justify-between">
        <span className="text-lg font-medium text-textPrimary">Camera Settings</span>
        <div className="my-auto flex gap-2">
          {isEditMode ? (
            <>
              <SecondaryButton
                onClick={() => {
                  resetForm();
                  setIsEditMode(false);
                }}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton type="button" onClick={submitForm} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </PrimaryButton>
            </>
          ) : (
            <>
              <SecondaryButton
                onClick={() => setIsDeleteConfirming(true)}
                className="flex items-center gap-1"
              >
                <img src="/icons/trashIcon.svg" alt="Delete" className="h-4 w-4" />
                Delete
              </SecondaryButton>
              <CustomButton
                className="flex items-center gap-1"
                onClick={() => setIsAddZoneModalOpen(true)}
                buttonType="outline"
              >
                <img src="/icons/pencilIcon.svg" alt="Edit" />
                Edit Zone
              </CustomButton>
              <PrimaryButton onClick={() => setIsEditMode(true)}>Edit</PrimaryButton>
            </>
          )}
        </div>
      </div>
      <form className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-32" onSubmit={handleSubmit}>
        <div>
          <h3 className="mb-4 text-lg font-semibold text-textSecondary">Camera Information</h3>
          <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
            {/* Camera Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Camera Name <span className="text-red-500">*</span>
              </label>

              <input
                name="name"
                type="text"
                value={values.name}
                disabled={!isEditMode}
                placeholder="Enter device name"
                className={cn(
                  "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                  touched.name && errors.name
                    ? "border-red-500 focus:border-red-500"
                    : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                )}
                onChange={(e) => setFieldValue("name", e.target.value)}
                onBlur={() => setFieldTouched("name", true)}
              />
              {errors.name && touched.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Site Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input
                name="siteName"
                type="text"
                value={values.siteName}
                disabled={!isEditMode}
                placeholder="Enter site name"
                className={cn(
                  "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                  touched.siteName && errors.siteName
                    ? "border-red-500 focus:border-red-500"
                    : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                )}
                onChange={(e) => setFieldValue("siteName", e.target.value)}
                onBlur={() => setFieldTouched("siteName", true)}
              />
              {errors.siteName && touched.siteName && (
                <p className="mt-1 text-sm text-red-400">{errors.siteName}</p>
              )}
            </div>

            {/* Area */}
            <InputSelect
              label="Area"
              value={areaOptions?.find((v) => v?.value === values.area)}
              onChange={(value) => areaHandleChange(value?.value)}
              onBlur={() => setFieldTouched("area", true)}
              options={areaOptions}
              placeholder="Select area"
              required={true}
              isDisabled={!isEditMode}
              error={errors.area}
              touched={touched.area}
            />

            {/* Lane */}
            <InputSelect
              label="Lane"
              value={values.lane}
              onChange={(value) => setFieldValue("lane", value)}
              onBlur={() => setFieldTouched("lane", true)}
              options={finalLaneOptions}
              placeholder="Select lane"
              required={true}
              isMulti={true}
              isDisabled={!isEditMode}
              error={errors.lane}
              touched={touched.lane}
            />
          </div>

          {/* RTSP Stream Link - Full width */}
          <div className="mt-4 border-b border-b-neutral-700 pb-4">
            <label className="mb-2 block text-sm font-medium text-textSecondary">
              RTSP Stream Link <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                name="sourceStreamLink"
                type="text"
                value={values.sourceStreamLink}
                placeholder="Enter video stream link"
                disabled={!isEditMode}
                className={cn(
                  !isEditMode ? "cursor-not-allowed opacity-50" : "",
                  "w-full rounded-lg border bg-transparent px-4 py-2.5 pr-10 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                  touched.sourceStreamLink && errors.sourceStreamLink
                    ? "border-red-500 focus:border-red-500"
                    : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                )}
                onChange={(e) => setFieldValue("sourceStreamLink", e.target.value)}
                onBlur={() => setFieldTouched("sourceStreamLink", true)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </button>
            </div>
            {errors.sourceStreamLink && touched.sourceStreamLink && (
              <p className="mt-1 text-sm text-red-400">{errors.sourceStreamLink}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">
              Supports HLS (recommended) and FLV formats, and only supports H264 encoding.
            </p>
          </div>
        </div>

        {/* Video Specifications Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-textSecondary">Video Specifications</h3>
          <div className="grid grid-cols-1 gap-4 border-b border-b-neutral-700 pb-4 md:grid-cols-2">
            {/* Resolution */}
            <InputSelect
              label="Resolution"
              value={values.resolution}
              onChange={(value) => setFieldValue("resolution", value)}
              onBlur={() => setFieldTouched("resolution", true)}
              options={videoResolutionOptions}
              placeholder="Select resolution"
              required={true}
              isDisabled={!isEditMode}
              error={errors.resolution}
              touched={touched.resolution}
            />

            {/* Frame Rate */}
            <InputSelect
              label="Frame Rate"
              value={values.frameRate}
              onChange={(value) => setFieldValue("frameRate", value)}
              onBlur={() => setFieldTouched("frameRate", true)}
              options={frameRateOptions}
              placeholder="Select frame rate"
              required={true}
              isDisabled={!isEditMode}
              error={errors.frameRate}
              touched={touched.frameRate}
            />

            {/* Video Codec */}
            <InputSelect
              label="Video Codec"
              value={values.videoCodec}
              onChange={(value) => setFieldValue("videoCodec", value)}
              onBlur={() => setFieldTouched("videoCodec", true)}
              options={videoCodecOptions}
              placeholder="Select video codec"
              required={true}
              isDisabled={!isEditMode}
              error={errors.videoCodec}
              touched={touched.videoCodec}
            />
          </div>
        </div>

        {/* Recording Configuration Section */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-textSecondary">Recording Configuration</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Recording Mode */}
            <InputSelect
              label="Recording mode"
              value={values.recordingMode}
              onChange={(value) => setFieldValue("recordingMode", value)}
              onBlur={() => setFieldTouched("recordingMode", true)}
              options={recordingModeOptions}
              placeholder="Select recording mode"
              required={true}
              isDisabled={!isEditMode}
              error={errors.recordingMode}
              touched={touched.recordingMode}
            />

            {/* Pre-recording Buffer (Seconds before detection) */}
            <div className="">
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Pre-recording Buffer (Seconds before detection){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="preRecordingBuffer"
                  type="text"
                  inputMode="numeric"
                  value={values.preRecordingBuffer}
                  placeholder="ex. 5"
                  disabled={!isEditMode}
                  onChange={(e) => {
                    const cleaned = normalizeNumber(e.target.value);
                    setFieldValue("preRecordingBuffer", cleaned);
                  }}
                  onBlur={() => setFieldTouched("preRecordingBuffer", true)}
                  className={cn(
                    !isEditMode ? "cursor-not-allowed opacity-50" : "",
                    "w-full rounded-lg border bg-transparent px-4 py-2.5 pr-10 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                    touched.preRecordingBuffer && errors.preRecordingBuffer
                      ? "border-red-500 focus:border-red-500"
                      : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white">
                  Sec
                </span>
              </div>
              {errors.preRecordingBuffer && touched.preRecordingBuffer && (
                <p className="mt-1 text-sm text-red-400">{errors.preRecordingBuffer}</p>
              )}
            </div>

            {/* Post-recording Buffer (Seconds after detection) */}
            <div className="">
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Post-recording Buffer (Seconds after detection){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="postRecordingBuffer"
                  type="text"
                  inputMode="numeric"
                  value={values.postRecordingBuffer}
                  placeholder="ex. 5"
                  disabled={!isEditMode}
                  onChange={(e) => {
                    const cleaned = normalizeNumber(e.target.value);
                    setFieldValue("postRecordingBuffer", cleaned);
                  }}
                  onBlur={() => setFieldTouched("postRecordingBuffer", true)}
                  className={cn(
                    !isEditMode ? "cursor-not-allowed opacity-50" : "",
                    "w-full rounded-lg border bg-transparent px-4 py-2.5 pr-10 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                    touched.postRecordingBuffer && errors.postRecordingBuffer
                      ? "border-red-500 focus:border-red-500"
                      : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white">
                  Sec
                </span>
              </div>
              {errors.postRecordingBuffer && touched.postRecordingBuffer && (
                <p className="mt-1 text-sm text-red-400">{errors.postRecordingBuffer}</p>
              )}
            </div>

            <div></div>

            {/* Repeat */}
            <div className="">
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Repeat
                <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-between">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
                  const active = values.repeat.includes(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={!isEditMode}
                      onClick={() => toggleDay(day)}
                      className={`h-[42px] rounded-lg border px-3 text-sm transition-all ${!isEditMode ? "cursor-not-allowed opacity-50" : ""}
                ${
                  active
                    ? " border-white text-textSecondary"
                    : "border-neutral-700 text-textSecondary hover:border-neutralHover"
                }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {errors.repeat && touched.repeat && (
                <p className="mt-1 text-sm text-red-400">{errors.repeat}</p>
              )}
              <p className="col-span-2 mt-2 text-xs text-gray-400">
                For each selected day, the recording will start on at 07:00 AM and turn off at 03:00
                PM.
              </p>
            </div>

            {/* start end time */}
            <div className="flex items-start space-x-3">
              <div className="w-1/2">
                <InputTime
                  label="Start Time"
                  required={true}
                  value={values.startTime}
                  onChange={(value) => setFieldValue("startTime", value)}
                  error={errors.startTime}
                  touched={touched.startTime}
                  isDisabled={!isEditMode}
                />
              </div>
              <div className="w-1/2">
                <InputTime
                  label="End Time"
                  required={true}
                  value={values.endTime}
                  onChange={(value) => setFieldValue("endTime", value)}
                  error={errors.endTime}
                  touched={touched.endTime}
                  isDisabled={!isEditMode}
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      <Modal
        title="Delete Camera"
        isOpen={isDeleteConfirming}
        footer={deleteModalFooter()}
        zIndex={100}
        onClose={() => setIsDeleteConfirming(false)}
      >
        <p className="text-sm text-textPrimary">Are you sure you want to delete this camera?</p>
        <p className="text-sm text-textPrimary">Once deleted, the data cannot be recovered.</p>
      </Modal>
    </div>
  );
};

export default CameraSettingForm;
