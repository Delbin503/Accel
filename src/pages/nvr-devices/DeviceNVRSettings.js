import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "react-query";
import InputSelect from "components/common/InputSelect";
import { successAlert, errorAlert } from "components/common/Toast";
import { useCheckNVRExistName, useDeleteNVRMutation, useUpdateNVRMutation } from "services/nvr";
import { getSites } from "services/site";
import { PrimaryButton, SecondaryButton } from "components/common/Button";
import InputText from "components/common/InputText";
import Modal from "components/common/Modal";

const DeviceNVRSettings = ({
  selectedDevice,
  onClosePanel,
  refetchDevices,
  areaOptionsFromManagement = [],
  laneOptionsFromManagement = [],
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [siteNameOptions, setSiteNameOptions] = useState([]);
  const queryClient = useQueryClient();
  const updateNVRMutation = useUpdateNVRMutation();
  const deleteNVRMutation = useDeleteNVRMutation();
  const checkExistName = useCheckNVRExistName();
  const [selectedArea, setSelectedArea] = useState("");
  const [finalLaneOptions, setFinalLaneOptions] = useState([]);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const areaOptions = useMemo(() => {
    const fromManagement = (areaOptionsFromManagement || []).map((option) => ({
      value: option.value,
      label: option.label,
    }));

    if (!selectedDevice?.area) return fromManagement;

    const hasSelectedArea = fromManagement.some((option) => option.value === selectedDevice.area);
    if (hasSelectedArea) return fromManagement;

    return [...fromManagement, { value: selectedDevice.area, label: selectedDevice.area }];
  }, [areaOptionsFromManagement, selectedDevice]);

  const selectedLaneOptions = useMemo(
    () =>
      Array.isArray(selectedDevice?.lane)
        ? selectedDevice.lane.map((lane) => ({ value: lane, label: lane }))
        : [],
    [selectedDevice]
  );

  const manufacturerOptions = [
    { value: "Hikvision", label: "Hikvision" },
    { value: "Dahua", label: "Dahua" },
    { value: "Axis", label: "Axis" },
    { value: "Samsung", label: "Samsung" },
    { value: "Bosch", label: "Bosch" },
    { value: "Other", label: "Other" },
  ];

  const storageCapacityOptions = [
    { value: "500GB", label: "500 GB" },
    { value: "1TB", label: "1 TB" },
    { value: "2TB", label: "2 TB" },
    { value: "4TB", label: "4 TB" },
    { value: "8TB", label: "8 TB" },
    { value: "16TB", label: "16 TB" },
  ];

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await getSites({ pageSize: 999 });

        let siteData = [];
        if (Array.isArray(response?.data)) {
          siteData = response.data;
        } else if (response.data && typeof response.data === "object") {
          siteData = [response.data];
        }

        const options = siteData.map((site) => ({
          value: site.siteName || site.name,
          label: site.siteName || site.name,
        }));
        setSiteNameOptions(options);
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };
    fetchSite();
  }, []);

  useEffect(() => {
    setSelectedArea(selectedDevice?.area || "");
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedArea && laneOptionsFromManagement) {
      const filteredFromManagement = laneOptionsFromManagement
        .filter((lane) => lane.areaID === selectedArea)
        .map((lane) => ({
          value: lane.value,
          label: lane.label,
        }));

      const mergedByValue = new Map();
      [...filteredFromManagement, ...selectedLaneOptions].forEach((option) => {
        if (!mergedByValue.has(option.value)) {
          mergedByValue.set(option.value, option);
        }
      });

      setFinalLaneOptions(Array.from(mergedByValue.values()));
    } else {
      setFinalLaneOptions(selectedLaneOptions);
    }
  }, [selectedArea, laneOptionsFromManagement, selectedLaneOptions]);

  const validationSchema = (checkExistName) =>
    Yup.object().shape({
      name: Yup.string()
        .required("NVR name is required")
        .test("unique-name", "Name already exists", async function (value) {
          if (!value) return true;
          if (value === selectedDevice?.name) return true;
          const exists = await checkExistName(value);
          return !exists;
        }),
      siteName: Yup.string().required("Site name is required"),
      area: Yup.string().required("Area is required"),
      lane: Yup.array().min(1, "At least one lane is required").required("Lane is required"),
      manufacturer: Yup.string().required("Manufacturer is required"),
      nvrModel: Yup.string().required("NVR model is required"),
      ipAddress: Yup.string()
        .matches(
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          "Invalid IP address format"
        )
        .required("IP address is required"),
      httpPort: Yup.string().required("HTTP port is required"),
      username: Yup.string().required("Username is required"),
      password: Yup.string().required("Password is required"),
      storageChannel: Yup.number()
        .positive("Must be a positive number")
        .integer("Must be an integer")
        .required("Number of channels is required"),
      storageCapacity: Yup.object().nullable().required("Storage capacity is required"),
    });

  const initialValues = useMemo(
    () => ({
      name: selectedDevice?.name || "",
      siteName: selectedDevice?.siteLocation || "",
      area: selectedDevice?.area || "",
      lane: (selectedDevice?.lane || []).map((lane) => ({ value: lane, label: lane })),
      manufacturer: selectedDevice?.manufacturer || "",
      nvrModel: selectedDevice.model || "",
      ipAddress: selectedDevice?.ipAddress || "",
      httpPort: selectedDevice?.nvr?.httpPort || "80",
      status: selectedDevice?.status
        ? {
            value: selectedDevice.status,
            label:
              selectedDevice.status.charAt(0).toUpperCase() +
              selectedDevice.status.slice(1).toLowerCase(),
          }
        : null,
      username: selectedDevice?.username || "",
      password: selectedDevice?.password || "",
      resolution: selectedDevice?.resolution
        ? {
            value: selectedDevice.resolution,
            label: selectedDevice.resolution,
          }
        : null,
      frameRate: selectedDevice?.frameRate
        ? {
            value: String(selectedDevice.frameRate),
            label: `${selectedDevice.frameRate} FPS`,
          }
        : null,
      videoCodec: selectedDevice?.videoCodec
        ? {
            value: selectedDevice.videoCodec,
            label: selectedDevice.videoCodec,
          }
        : null,
      storageChannel: selectedDevice?.storageChannel || "",
      storageCapacity: selectedDevice?.storageCapacity
        ? storageCapacityOptions.find(
            (option) => option.value === selectedDevice.storageCapacity
          ) || {
            value: selectedDevice.storageCapacity,
            label: selectedDevice.storageCapacity,
          }
        : null,
    }),
    [selectedDevice]
  );

  const handleSave = async (values, { setSubmitting }) => {
    try {
      const payload = {
        name: values.name,
        siteLocation: values.siteName,
        area: values.area,
        lane: Array.isArray(values.lane) ? values.lane.map((option) => option.value) : [],
        manufacturer: values.manufacturer,
        model: values.nvrModel,
        ipAddress: values.ipAddress,
        httpPort: values.httpPort,
        username: values.username,
        password: values.password,
        storageChannel: values.storageChannel.toString(),
        storageCapacity: values.storageCapacity?.value,
      };

      await updateNVRMutation.mutateAsync({
        uId: selectedDevice?.uID,
        payload,
      });

      console.log("updating nvr");

      successAlert("NVR Updated", "NVR has been updated successfully");
      setIsEditMode(false);

      queryClient.invalidateQueries(["nvr", selectedDevice?.uID]);
      queryClient.invalidateQueries(["nvrs"]);
      queryClient.invalidateQueries(["devices"]);

      if (refetchDevices) {
        refetchDevices();
      }
    } catch (error) {
      errorAlert(
        "Update Failed",
        error?.response?.data?.message || error.message || "Failed to update NVR"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues,
    validationSchema: validationSchema(checkExistName),
    onSubmit: handleSave,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
  });

  const {
    values,
    errors,
    touched,
    setFieldValue,
    isSubmitting,
    submitForm,
    handleSubmit,
    resetForm,
    setFieldTouched,
  } = formik;

  const handleInputChange = (field, value) => {
    setFieldValue(field, value);
  };

  const handleCancel = () => {
    resetForm();
    setIsEditMode(false);
  };

  const handleDelete = async () => {
    try {
      await deleteNVRMutation.mutateAsync(selectedDevice?.uID);
      successAlert("Device Deleted", "NVR has been deleted successfully");
      if (onClosePanel) onClosePanel();
      if (refetchDevices) refetchDevices();
      queryClient.invalidateQueries(["nvrs"]);
      queryClient.invalidateQueries(["devices"]);
    } catch (error) {
      errorAlert(
        "Delete Failed",
        error?.response?.data?.message || error.message || "Failed to delete NVR"
      );
    }
  };

  const deleteModalFooter = () => (
    <div className="flex justify-end space-x-2">
      <SecondaryButton onClick={() => setIsDeleteConfirming(false)}>Cancel</SecondaryButton>
      
      <PrimaryButton onClick={handleDelete}>Delete</PrimaryButton>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium text-textPrimary">NVR Settings</span>

        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <SecondaryButton
                onClick={handleCancel}
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

              <PrimaryButton
                onClick={() => setIsEditMode(true)}
                className="flex items-center gap-1"
              >
                <img src="/icons/pencilIcon.svg" alt="Edit" className="h-4 w-4" />
                Edit
              </PrimaryButton>
            </>
          )}
        </div>
      </div>

      <form className="min-h-0 flex-1 overflow-y-auto pb-28 pr-1" onSubmit={handleSubmit}>
        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* NVR Name */}
          <InputText
            label="NVR Name"
            name="name"
            value={values.name}
            onChange={(e) => setFieldValue("name", e.target.value)}
            onBlur={() => setFieldTouched("name", true)}
            error={errors.name}
            touched={touched.name}
            disabled={!isEditMode}
            required
          />

          {/* Site Name */}
          <InputSelect
            label="Site Name"
            name="siteName"
            options={siteNameOptions}
            value={siteNameOptions.find((option) => option.value === values.siteName) || null}
            onChange={(value) => handleInputChange("siteName", value?.value || "")}
            isDisabled={!isEditMode}
            isClearable={false}
            placeholder="Select site"
            error={errors.siteName}
            touched={touched.siteName}
            required
          />

          {/* Area */}
          <InputSelect
            label="Area"
            name="area"
            options={areaOptions || []}
            value={areaOptions?.find((option) => option.value === values.area) || null}
            onChange={(option) => {
              setFieldValue("area", option.value);
              setFieldValue("lane", []);
              setSelectedArea(option.value);
            }}
            onBlur={() => setFieldTouched("area", true)}
            isClearable={false}
            isDisabled={!isEditMode}
            placeholder="Select area"
            error={errors.area}
            touched={touched.area}
            required
          />

          {/* Lane */}
          <InputSelect
            label="Lane(s)"
            name="lane"
            isDisabled={!isEditMode}
            options={finalLaneOptions}
            value={finalLaneOptions.filter((option) =>
              Array.isArray(values.lane)
                ? values.lane.some((lane) => lane.value === option.value)
                : false
            )}
            onChange={(option) => setFieldValue("lane", option)}
            onBlur={() => setFieldTouched("lane", true)}
            placeholder="Select lane"
            isMulti={true}
            error={errors.lane}
            touched={touched.lane}
            required
          />

          {/* Manufacturer */}
          <InputSelect
            label="Manufacturer"
            name="manufacturer"
            isDisabled={!isEditMode}
            isClearable={false}
            required
            options={manufacturerOptions}
            value={
              manufacturerOptions.find((option) => option.value === values.manufacturer) || null
            }
            onChange={(option) => setFieldValue("manufacturer", option.value)}
            onBlur={() => setFieldTouched("manufacturer", true)}
            placeholder="Select manufacturer"
            error={errors.manufacturer}
            touched={touched.manufacturer}
          />

          {/* NVR Model */}
          <InputText
            label="NVR Model"
            name="nvrModel"
            value={values.nvrModel}
            onChange={(e) => setFieldValue("nvrModel", e.target.value)}
            onBlur={() => setFieldTouched("nvrModel", true)}
            error={errors.nvrModel}
            touched={touched.nvrModel}
            disabled={!isEditMode}
            required
          />

          {/* IP Address */}
          <InputText
            label="IP Address"
            name="ipAddress"
            value={values.ipAddress}
            onChange={(e) => setFieldValue("ipAddress", e.target.value)}
            onBlur={() => setFieldTouched("ipAddress", true)}
            error={errors.ipAddress}
            touched={touched.ipAddress}
            disabled={!isEditMode}
            required
          />

          {/* HTTP Port */}
          <InputText
            label="HTTP Port"
            name="httpPort"
            value={values.httpPort}
            onChange={(e) => setFieldValue("httpPort", e.target.value)}
            onBlur={() => setFieldTouched("httpPort", true)}
            error={errors.httpPort}
            touched={touched.httpPort}
            disabled={!isEditMode}
            required
          />

          {/* Username (NVR Server) */}
          <InputText
            label="Username (NVR Server)"
            name="username"
            value={values.username}
            onChange={(e) => setFieldValue("username", e.target.value)}
            onBlur={() => setFieldTouched("username", true)}
            error={errors.username}
            touched={touched.username}
            disabled={!isEditMode}
            required
          />

          {/* Password */}
          <InputText
            label="Password (NVR Server)"
            name="password"
            type="password"
            value={values.password}
            onChange={(e) => setFieldValue("password", e.target.value)}
            onBlur={() => setFieldTouched("password", true)}
            error={errors.password}
            touched={touched.password}
            disabled={!isEditMode}
            required
          />
        </div>

        {/* Storage & Capacity Section */}
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-medium text-textPrimary">Storage & Capacity</h3>

          {/* Row 1: Number of Channels & Storage Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-textPrimary">
                Number of Channels <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="storageChannel"
                  type="number"
                  value={values.storageChannel}
                  onChange={(e) => handleInputChange("storageChannel", e.target.value)}
                  onBlur={() => setFieldTouched("storageChannel", true)}
                  error={errors.storageChannel}
                  touched={touched.storageChannel}
                  disabled={!isEditMode}
                  className="h-[42px] w-full rounded-lg border border-neutral-700 bg-transparent px-4 py-2 pr-20 text-sm text-textPrimary focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-textSecondary">
                  Channels
                </span>
              </div>
              {touched.storageChannel && errors.storageChannel && (
                <p className="mt-1 text-sm text-red-500">{errors.storageChannel}</p>
              )}
            </div>
            <InputSelect
              label="Storage Capacity"
              name="storageCapacity"
              placeholder="Select storage capacity"
              options={storageCapacityOptions}
              value={values.storageCapacity}
              onChange={(value) => handleInputChange("storageCapacity", value?.value || "")}
              onBlur={() => setFieldTouched("storageCapacity", true)}
              error={errors.storageCapacity}
              touched={touched.storageCapacity}
              isDisabled={!isEditMode}
              isClearable={false}
              required
            />
          </div>
        </div>
      </form>

      <Modal
        title="Delete NVR Device"
        isOpen={isDeleteConfirming}
        footer={deleteModalFooter()}
        zIndex={100}
        onClose={() => setIsDeleteConfirming(false)}
      >
        <p className="text-sm text-textPrimary">Are you sure you want to delete this NVR device?</p>
        <p className="text-sm text-textPrimary">Once deleted, the data cannot be recovered.</p>
      </Modal>
    </div>
  );
};

export default DeviceNVRSettings;
