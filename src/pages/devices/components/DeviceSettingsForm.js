import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { PrimaryButton, SecondaryButton } from "components/common/Button";
import InputSelect from "components/common/InputSelect";
import InputTime from "components/common/InputTime";
import { cn } from "utils/common";
import { useUpdateCameraMutation, useDeleteCameraMutation } from "services/camera";
import { successAlert, errorAlert } from "components/common/Toast";

const DeviceSettingsForm = ({
  selectedDevice,
  onClosePanel,
  refetchDevices,
  setSelectedDevice,
  laneOptions,
  areaOptions,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const queryClient = useQueryClient();
  const updateDeviceMutation = useUpdateCameraMutation();
  const deleteDeviceMutation = useDeleteCameraMutation();

  // Validation schema for edit form
  const validationSchema = Yup.object().shape({
    deviceType: Yup.string().required("Device type is required"),
    name: Yup.string().required("Device name is required"),
    siteName: Yup.mixed().required("Site name is required"),
    area: Yup.mixed().required("Area is required"),
    ipAddress: Yup.string().required("IP address is required"),
    rtspPort: Yup.string().when("deviceType", {
      is: "camera",
      then: () => Yup.string().required("RTSP port is required"),
    }),
    rtspStreamLink: Yup.string().when("deviceType", {
      is: "camera",
      then: () => Yup.string().required("RTSP stream link is required"),
    }),
  });

  // Helper function to normalize numbers
  const normalizeNumber = (value) => {
    return value.replace(/[^0-9]/g, "");
  };

  // Get initial values from selected device
  const getInitialValues = () => {
    if (!selectedDevice) return {};

    const isCamera = selectedDevice.type === "CAM" || selectedDevice.deviceType === "CAM";

    return {
      deviceType: isCamera ? "camera" : "nvr",
      name: selectedDevice.name || "",
      siteName: selectedDevice.siteLocation || "",
      area: selectedDevice.area || "",
      lane: selectedDevice.lane?.map((l) => ({ value: l, label: l })) || [],
      ipAddress: selectedDevice.ipAddress || "",
      // Camera fields
      rtspPort: selectedDevice.camera?.rtspPort || "",
      rtspStreamLink: selectedDevice.camera?.rtspStreamLink || "",
      resolution: selectedDevice.camera?.videoResolution
        ? {
            value: selectedDevice.camera.videoResolution,
            label: selectedDevice.camera.videoResolution,
          }
        : null,
      frameRate: selectedDevice.camera?.frameRate
        ? {
            value: selectedDevice.camera.frameRate,
            label: `${selectedDevice.camera.frameRate} FPS`,
          }
        : null,
      videoCodec: selectedDevice.camera?.videoCodec
        ? { value: selectedDevice.camera.videoCodec, label: selectedDevice.camera.videoCodec }
        : null,
      recordingMode: selectedDevice.camera?.recordingMode
        ? { value: selectedDevice.camera.recordingMode, label: selectedDevice.camera.recordingMode }
        : null,
      preRecordingBuffer: selectedDevice.camera?.preRecordingBuffer || "",
      postRecordingBuffer: selectedDevice.camera?.postRecordingBuffer || "",
      repeat: selectedDevice.camera?.repeatDay || [],
      startTime: selectedDevice.camera?.startTime || "",
      endTime: selectedDevice.camera?.endTime || "",
      // NVR fields
      manufacturer: selectedDevice.nvr?.manufacturer
        ? { value: selectedDevice.nvr.manufacturer, label: selectedDevice.nvr.manufacturer }
        : null,
      model: selectedDevice.nvr?.model || "",
      httpPort: selectedDevice.nvr?.httpPort || "",
      username: selectedDevice.nvr?.username || "",
      password: selectedDevice.nvr?.password || "",
      channels: selectedDevice.nvr?.storageChannel || "",
      storageCapacity: selectedDevice.nvr?.storageCapacity || "",
    };
  };

  // Handle form submission
  const handleEditSubmit = async (values, { setSubmitting }) => {
    try {
      const isCamera = values.deviceType === "camera";

      const payload = {
        name: values.name,
        type: isCamera ? "CAM" : "NVR",
        siteLocation: values.siteName,
        area: values.area,
        ipAddress: values.ipAddress,
        lane: values.lane?.map((l) => l.value) || [],
      };

      if (isCamera) {
        payload.camera = {
          rtspPort: values.rtspPort,
          rtspStreamLink: values.rtspStreamLink,
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
      } else {
        payload.nvr = {
          manufacturer: values.manufacturer?.value,
          model: values.model,
          httpPort: values.httpPort,
          username: values.username,
          password: values.password,
          storageChannel: values.channels,
          storageCapacity: values.storageCapacity,
        };
      }

      await updateDeviceMutation.mutateAsync({
        uId: selectedDevice.uID,
        payload,
      });

      successAlert("Device Updated", "Device has been updated successfully");

      // Set edit mode to false first
      setIsEditMode(false);

      // Invalidate queries to refetch device data
      queryClient.invalidateQueries(["device", selectedDevice.uID]);
      queryClient.invalidateQueries(["devices"]);

      if (refetchDevices) {
        refetchDevices();
      }
    } catch (error) {
      errorAlert("Update Failed", error?.response?.data?.message || error.message || "Failed to update device");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteDevice = async () => {
    if (!window.confirm("Are you sure you want to delete this device?")) return;

    try {
      await deleteDeviceMutation.mutateAsync(selectedDevice.uID);
      successAlert("Device Deleted", "Device has been deleted successfully");
      onClosePanel();
      refetchDevices();
    } catch (error) {
      errorAlert("Delete Failed", error.message || "Failed to delete device");
    }
  };

  return (
    <Formik
      initialValues={getInitialValues()}
      validationSchema={validationSchema}
      onSubmit={handleEditSubmit}
      enableReinitialize
    >
      {({
        values,
        errors,
        touched,
        setFieldValue,
        setFieldTouched,
        isSubmitting,
        resetForm,
        submitForm,
      }) => {
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

        return (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-lg font-medium text-textPrimary">
                {values.deviceType === "camera" ? "Camera" : "NVR"} Settings
              </span>
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
                    <SecondaryButton onClick={handleDeleteDevice}>Delete</SecondaryButton>
                    <PrimaryButton onClick={() => setIsEditMode(true)}>Edit</PrimaryButton>
                  </>
                )}
              </div>
            </div>
            <Form className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-textSecondary">Device Information</h3>
                <div
                  className={cn(
                    values?.deviceType === "nvr" ? "border-b border-b-neutral-700 pb-4" : "",
                    "grid grid-cols-1 gap-4 md:grid-cols-2"
                  )}
                >
                  {/* Device Type */}
                  <InputSelect
                    label="Device Type"
                    value={[
                      { label: "Camera", value: "camera" },
                      { label: "NVR", value: "nvr" },
                    ].find((e) => e.value === values.deviceType)}
                    onChange={(value) => setFieldValue("deviceType", value?.value)}
                    onBlur={() => setFieldTouched("deviceType", true)}
                    options={[
                      { label: "Camera", value: "camera" },
                      { label: "NVR", value: "nvr" },
                    ]}
                    placeholder="Select device type"
                    required={true}
                    isClearable={false}
                    isDisabled={true}
                    error={errors.deviceType}
                    touched={touched.deviceType}
                  />

                  {/* Device Name */}
                  <div>
                    {values.deviceType === "camera" ? (
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        Device Name <span className="text-red-500">*</span>
                      </label>
                    ) : (
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        NVR Name <span className="text-red-500">*</span>
                      </label>
                    )}

                    <Field name="name">
                      {({ field }) => (
                        <input
                          {...field}
                          type="text"
                          disabled={!isEditMode}
                          placeholder="Enter device name"
                          className={cn(
                            "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                            touched.name && errors.name
                              ? "border-red-500 focus:border-red-500"
                              : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                          )}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="name" component="p" className="mt-1 text-sm text-red-400" />
                  </div>

                  {/* Site Name */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-textSecondary">
                      Site Name <span className="text-red-500">*</span>
                    </label>
                    <Field name="siteName">
                      {({ field }) => (
                        <input
                          {...field}
                          type="text"
                          disabled={!isEditMode}
                          placeholder="Enter site name"
                          className={cn(
                            "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                            touched.siteName && errors.siteName
                              ? "border-red-500 focus:border-red-500"
                              : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                          )}
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="siteName"
                      component="p"
                      className="mt-1 text-sm text-red-400"
                    />
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

                  {/* manufacturer */}
                  {values.deviceType === "nvr" && (
                    <InputSelect
                      label="Manufacturer"
                      value={values.manufacturer}
                      onChange={(value) => setFieldValue("manufacturer", value)}
                      onBlur={() => setFieldTouched("manufacturer", true)}
                      options={[{ label: "Nissan", value: "Nissan" }]}
                      placeholder="Select manufacturer"
                      required={true}
                      isDisabled={!isEditMode}
                      error={errors.manufacturer}
                      touched={touched.manufacturer}
                    />
                  )}

                  {/* NVR model */}
                  {values.deviceType === "nvr" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        NVR Model <span className="text-red-500">*</span>
                      </label>
                      <Field name="model">
                        {({ field }) => (
                          <input
                            {...field}
                            type="text"
                            disabled={!isEditMode}
                            placeholder="Enter NVR model"
                            className={cn(
                              "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                              touched.model && errors.model
                                ? "border-red-500 focus:border-red-500"
                                : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                            )}
                          />
                        )}
                      </Field>
                      <ErrorMessage
                        name="model"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                    </div>
                  )}

                  {/* IP Address */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-textSecondary">
                      IP Address <span className="text-red-500">*</span>
                    </label>
                    <Field name="ipAddress">
                      {({ field }) => (
                        <input
                          {...field}
                          type="text"
                          disabled={!isEditMode}
                          placeholder="Enter IP address"
                          className={cn(
                            "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                            touched.ipAddress && errors.ipAddress
                              ? "border-red-500 focus:border-red-500"
                              : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                          )}
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="ipAddress"
                      component="p"
                      className="mt-1 text-sm text-red-400"
                    />
                  </div>

                  {/* Http port */}
                  {values.deviceType === "nvr" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        Http Port <span className="text-red-500">*</span>
                      </label>
                      <Field name="httpPort">
                        {({ field }) => (
                          <input
                            {...field}
                            type="text"
                            disabled={!isEditMode}
                            placeholder="Enter HTTP port"
                            className={cn(
                              "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                              touched.httpPort && errors.httpPort
                                ? "border-red-500 focus:border-red-500"
                                : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                            )}
                          />
                        )}
                      </Field>
                      <ErrorMessage
                        name="httpPort"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                    </div>
                  )}

                  {values.deviceType === "nvr" && <div></div>}

                  {/* Username (nvr server) */}
                  {values.deviceType === "nvr" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        Username (NVR Server) <span className="text-red-500">*</span>
                      </label>
                      <Field name="username">
                        {({ field }) => (
                          <input
                            {...field}
                            type="text"
                            disabled={!isEditMode}
                            placeholder="Enter username"
                            className={cn(
                              "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                              touched.username && errors.username
                                ? "border-red-500 focus:border-red-500"
                                : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                            )}
                          />
                        )}
                      </Field>
                      <ErrorMessage
                        name="username"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                    </div>
                  )}

                  {/* password (nvr server) */}
                  {values.deviceType === "nvr" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        Password (NVR Server) <span className="text-red-500">*</span>
                      </label>
                      <Field name="password">
                        {({ field }) => (
                          <input
                            {...field}
                            type="password"
                            placeholder="Enter password"
                            disabled={!isEditMode}
                            className={cn(
                              !isEditMode ? "cursor-not-allowed opacity-50" : "",
                              "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                              touched.password && errors.password
                                ? "border-red-500 focus:border-red-500"
                                : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                            )}
                          />
                        )}
                      </Field>
                      <ErrorMessage
                        name="password"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                    </div>
                  )}

                  {/* RTSP Port */}
                  {values.deviceType === "camera" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        RTSP Port <span className="text-red-500">*</span>
                      </label>
                      <Field name="rtspPort">
                        {({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Enter RTSP port"
                            disabled={!isEditMode}
                            className={cn(
                              !isEditMode ? "cursor-not-allowed opacity-50" : "",
                              "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                              touched.rtspPort && errors.rtspPort
                                ? "border-red-500 focus:border-red-500"
                                : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                            )}
                          />
                        )}
                      </Field>
                      <ErrorMessage
                        name="rtspPort"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                    </div>
                  )}
                </div>

                {/* RTSP Stream Link - Full width */}
                {values.deviceType === "camera" && (
                  <div className="mt-4 border-b border-b-neutral-700 pb-4">
                    <label className="mb-2 block text-sm font-medium text-textSecondary">
                      RTSP Stream Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Field name="rtspStreamLink">
                        {({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Enter video stream link"
                            disabled={!isEditMode}
                            className={cn(
                              !isEditMode ? "cursor-not-allowed opacity-50" : "",
                              "w-full rounded-lg border bg-transparent px-4 py-2.5 pr-10 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                              touched.rtspStreamLink && errors.rtspStreamLink
                                ? "border-red-500 focus:border-red-500"
                                : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                            )}
                          />
                        )}
                      </Field>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </button>
                    </div>
                    <ErrorMessage
                      name="rtspStreamLink"
                      component="p"
                      className="mt-1 text-sm text-red-400"
                    />
                    <p className="mt-2 text-xs text-gray-400">
                      Supports HLS (recommended) and FLV formats, and only supports H264 encoding.
                    </p>
                  </div>
                )}
              </div>

              {/* Video Specifications Section */}
              {values.deviceType === "camera" && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-textSecondary">
                    Video Specifications
                  </h3>
                  <div className="grid grid-cols-1 gap-4 border-b border-b-neutral-700 pb-4 md:grid-cols-2">
                    {/* Resolution */}
                    <InputSelect
                      label="Resolution"
                      value={values.resolution}
                      onChange={(value) => setFieldValue("resolution", value)}
                      onBlur={() => setFieldTouched("resolution", true)}
                      options={[
                        { label: "HD (1280x720)", value: "1280x720" },
                        { label: "Full HD (1920x1080)", value: "1920x1080" },
                        { label: "2K (2560x1440)", value: "2560x1440" },
                        { label: "4K (3840x2160)", value: "3840x2160" },
                      ]}
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
                      options={[
                        { label: "15 FPS", value: "15" },
                        { label: "20 FPS", value: "20" },
                        { label: "25 FPS", value: "25" },
                        { label: "30 FPS", value: "30" },
                        { label: "60 FPS", value: "60" },
                      ]}
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
                      options={[
                        { label: "H.264 (AVC)", value: "H.264" },
                        { label: "H.265 (HEVC)", value: "H.265" },
                      ]}
                      placeholder="Select video codec"
                      required={true}
                      isDisabled={!isEditMode}
                      error={errors.videoCodec}
                      touched={touched.videoCodec}
                    />
                  </div>
                </div>
              )}

              {/* Recording Configuration Section */}
              {values?.deviceType === "camera" && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-textSecondary">
                    Recording Configuration
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Recording Mode */}
                    <InputSelect
                      label="Recording mode"
                      value={values.recordingMode}
                      onChange={(value) => setFieldValue("recordingMode", value)}
                      onBlur={() => setFieldTouched("recordingMode", true)}
                      options={[
                        { label: "Continuous", value: "Continuous" },
                        {
                          label: "Motion Detection",
                          value: "Motion Detection",
                        },
                        { label: "Scheduled", value: "Scheduled" },
                      ]}
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
                        <Field name="preRecordingBuffer">
                          {({ field }) => (
                            <input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="ex. 5"
                              disabled={!isEditMode}
                              onChange={(e) => {
                                const cleaned = normalizeNumber(e.target.value);
                                setFieldValue("preRecordingBuffer", cleaned);
                              }}
                              className={cn(
                                !isEditMode ? "cursor-not-allowed opacity-50" : "",
                                "w-full rounded-lg border bg-transparent px-4 py-2.5 pr-10 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                                touched.preRecordingBuffer && errors.preRecordingBuffer
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                              )}
                            />
                          )}
                        </Field>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white">
                          Sec
                        </span>
                      </div>
                      <ErrorMessage
                        name="preRecordingBuffer"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                    </div>

                    {/* Post-recording Buffer (Seconds after detection) */}
                    <div className="">
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        Post-recording Buffer (Seconds after detection){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Field name="postRecordingBuffer">
                          {({ field }) => (
                            <input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="ex. 5"
                              disabled={!isEditMode}
                              onChange={(e) => {
                                const cleaned = normalizeNumber(e.target.value);
                                setFieldValue("postRecordingBuffer", cleaned);
                              }}
                              className={cn(
                                !isEditMode ? "cursor-not-allowed opacity-50" : "",
                                "w-full rounded-lg border bg-transparent px-4 py-2.5 pr-10 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                                touched.postRecordingBuffer && errors.postRecordingBuffer
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                              )}
                            />
                          )}
                        </Field>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white">
                          Sec
                        </span>
                      </div>
                      <ErrorMessage
                        name="postRecordingBuffer"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
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
                      <ErrorMessage
                        name="repeat"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                      <p className="col-span-2 mt-2 text-xs text-gray-400">
                        For each selected day, the recording will start on at 07:00 AM and turn off
                        at 03:00 PM.
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
              )}

              {/* Storage Section */}
              {values.deviceType === "nvr" && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-textSecondary">Storage & Capacity</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* channels */}
                    <div className="">
                      <label className="mb-2 block text-sm font-medium text-textSecondary">
                        Number of Channels
                        <span className="text-red-500"> *</span>
                      </label>
                      <div className="relative">
                        <Field name="channels">
                          {({ field }) => (
                            <input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="ex. 5"
                              disabled={!isEditMode}
                              onChange={(e) => {
                                const cleaned = normalizeNumber(e.target.value);
                                setFieldValue("channels", cleaned);
                              }}
                              className={cn(
                                !isEditMode ? "cursor-not-allowed opacity-50" : "",
                                "w-full rounded-lg border bg-transparent px-4 py-2.5 pr-20 text-sm text-textSecondary placeholder-textSecondary focus:outline-none",
                                touched.channels && errors.channels
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                              )}
                            />
                          )}
                        </Field>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white">
                          Channels
                        </span>
                      </div>
                      <ErrorMessage
                        name="channels"
                        component="p"
                        className="mt-1 text-sm text-red-400"
                      />
                    </div>

                    {/* Storage Capacity */}
                    <InputSelect
                      label="Storage Capacity"
                      value={[{ label: "1TB", value: "1TB" }].find(
                        (e) => e.value === values.storageCapacity
                      )}
                      onChange={(value) => setFieldValue("storageCapacity", value?.value)}
                      onBlur={() => setFieldTouched("storageCapacity", true)}
                      options={[{ label: "1TB", value: "1TB" }]}
                      placeholder="Select storage capacity"
                      required={true}
                      isDisabled={!isEditMode}
                      error={errors.storageCapacity}
                      touched={touched.storageCapacity}
                    />
                  </div>
                </div>
              )}
            </Form>
          </div>
        );
      }}
    </Formik>
  );
};

export default DeviceSettingsForm;
