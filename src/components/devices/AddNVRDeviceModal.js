import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Modal from "components/common/Modal";
import { PrimaryButton, SecondaryButton } from "components/common/Button";
import InputSelect from "components/common/InputSelect";
import { cn } from "utils/common";
import { successAlert } from "components/common/Toast";
import { useCheckNVRExistName, useCreateNVRMutation } from "services/nvr";
import { getSites } from "services/site";
import InputText from "components/common/InputText";

const AddNVRDeviceModal = ({ isOpen, onClose, areaOptions, laneOptions }) => {
  const [finalLaneOptions, setFinalLaneOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");

  const createNVRMutation = useCreateNVRMutation();
  const checkExistingNVRName = useCheckNVRExistName();

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await getSites({ pageSize: 999 });

        // Handle response - wrap single object in array if needed
        let sitesData = [];
        if (Array.isArray(response.data)) {
          sitesData = response.data;
        } else if (response.data && typeof response.data === "object") {
          sitesData = [response.data];
        }

        const options = sitesData.map((site) => ({
          value: site.siteName || site.name,
          label: site.siteName || site.name,
        }));

        setSiteOptions(options);
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };

    if (isOpen) {
      fetchSites();
    }
  }, [isOpen]);

  // Filter lanes based on selected area
  useEffect(() => {
    if (selectedArea && laneOptions) {
      const filtered = laneOptions.filter((lane) => lane.areaID === selectedArea);
      setFinalLaneOptions(filtered);
    } else {
      setFinalLaneOptions([]);
    }
  }, [selectedArea, laneOptions]);

  const storageCapacityOptions = [
    { value: "500GB", label: "500 GB" },
    { value: "1TB", label: "1 TB" },
    { value: "2TB", label: "2 TB" },
    { value: "4TB", label: "4 TB" },
    { value: "8TB", label: "8 TB" },
    { value: "16TB", label: "16 TB" },
  ];

  const manufacturerOptions = [
    { value: "Hikvision", label: "Hikvision" },
    { value: "Dahua", label: "Dahua" },
    { value: "Axis", label: "Axis" },
    { value: "Samsung", label: "Samsung" },
    { value: "Bosch", label: "Bosch" },
    { value: "Other", label: "Other" },
  ];

  const nvrValidationSchema = (checkExistName) =>
    Yup.object().shape({
      name: Yup.string()
        .required("NVR name is required")
        .test("unique-name", "Name already exists", async function (value) {
          if (!value) return true;
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
      numberOfChannels: Yup.number()
        .positive("Must be a positive number")
        .integer("Must be an integer")
        .required("Number of channels is required"),
      storageCapacity: Yup.object().nullable().required("Storage capacity is required"),
    });

  const initialValues = {
    name: "",
    siteName: "",
    area: "",
    lane: [],
    manufacturer: "",
    nvrModel: "",
    ipAddress: "",
    httpPort: "80",
    username: "",
    password: "",
    numberOfChannels: 16,
    storageCapacity: null,
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        name: values.name,
        siteLocation: values.siteName,
        area: values.area,
        lane: values.lane.map((l) => l.value),
        manufacturer: values.manufacturer,
        model: values.nvrModel,
        ipAddress: values.ipAddress,
        httpPort: values.httpPort,
        username: values.username,
        password: values.password,
        storageChannel: values.numberOfChannels.toString(),
        storageCapacity: values.storageCapacity.value,
        status: "offline",
      };

      await createNVRMutation.mutateAsync(payload);
      successAlert("NVR device added successfully");
      formik.resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating NVR device:", error);
    } finally {
      formik.setSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues,
    validationSchema: nvrValidationSchema(checkExistingNVRName),
    onSubmit: handleSubmit,
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
    handleSubmit: formikHandleSubmit,
    resetForm,
  } = formik;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArea("");
    }
  }, [isOpen]);

  const handleClose = () => {
    setSelectedArea("");
    resetForm();
    onClose();
  };

  const footer = (
    <div className="flex justify-end gap-3 border-t border-neutral-700 pt-4">
      <SecondaryButton type="button" onClick={handleClose}>
        Cancel
      </SecondaryButton>
      <PrimaryButton type="submit" disabled={isSubmitting} onClick={formikHandleSubmit}>
        {isSubmitting ? "Adding..." : "Confirm"}
      </PrimaryButton>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} footer={footer} title="Add New NVR" size="lg">
      <form className="space-y-4 w-[800px]" onSubmit={formikHandleSubmit}>
        {/* Device Information */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-textSecondary">NVR Information</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            {/* NVR Name */}
            <InputText
              label="NVR Name"
              name="name"
              value={values.name}
              onChange={(e) => setFieldValue("name", e.target.value)}
              onBlur={() => setFieldTouched("name", true)}
              error={errors.name}
              touched={touched.name}
              required
              placeholder="Enter NVR Name"
            />

            {/* Site Name */}
            <InputSelect
              label="Site Name"
              options={siteOptions}
              value={siteOptions.find((option) => option.value === values.siteName) || null}
              onChange={(option) => setFieldValue("siteName", option.value)}
              placeholder="Select site"
              error={errors.siteName}
              touched={touched.siteName}
              required
            />

            {/* Area */}
            <InputSelect
              label="Area"
              options={areaOptions || []}
              value={areaOptions?.find((option) => option.value === values.area) || null}
              onChange={(option) => {
                setFieldValue("area", option.value);
                setFieldValue("lane", []);
                setSelectedArea(option.value);
              }}
              placeholder="Select area"
              error={errors.area}
              touched={touched.area}
              required
            />

            {/* Lane(s) */}
            <InputSelect
              label="Lane(s)"
              options={finalLaneOptions}
              value={values.lane}
              onChange={(option) => setFieldValue("lane", option)}
              placeholder="Select lane"
              isMulti={true}
              error={errors.lane}
              touched={touched.lane}
              required
            />

            {/* Manufacturer */}
            <InputSelect
              label="Manufacturer"
              options={manufacturerOptions}
              value={
                manufacturerOptions.find((option) => option.value === values.manufacturer) || null
              }
              onChange={(option) => setFieldValue("manufacturer", option.value)}
              placeholder="Select manufacturer"
              error={errors.manufacturer}
              touched={touched.manufacturer}
              required
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
              required
              placeholder="e.g. DS-7716NI-K4"
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
              required
              placeholder="e.g. 193.332.2.302"
            />

            {/* Http Port */}
            <InputText
              label="Http Port"
              name="httpPort"
              value={values.httpPort}
              onChange={(e) => setFieldValue("httpPort", e.target.value)}
              onBlur={() => setFieldTouched("httpPort", true)}
              error={errors.httpPort}
              touched={touched.httpPort}
              required
              placeholder="80"
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
              required
              placeholder="Enter user name"
            />

            {/* Password (NVR Server) */}
            <InputText
              label="Password (NVR Server)"
              name="password"
              type="password"
              value={values.password}
              onChange={(e) => setFieldValue("password", e.target.value)}
              onBlur={() => setFieldTouched("password", true)}
              error={errors.password}
              touched={touched.password}
              required
              placeholder="Enter password"
            />
          </div>
        </div>

        {/* Storage & Capacity */}
        <div>
          <h3 className="mb-4 text-base font-medium text-textSecondary">Storage & Capacity</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Number of Channels */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Number of Channels <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="numberOfChannels"
                  type="number"
                  min="1"
                  value={values.numberOfChannels}
                  className={cn(
                    "h-[50px] w-full rounded-lg border bg-transparent px-4 pr-24 text-textSecondary focus:outline-none",
                    touched.numberOfChannels && errors.numberOfChannels
                      ? "border-red-500 focus:border-red-500"
                      : "border-neutral-700 hover:border-neutralHover focus:border-brand"
                  )}
                  onChange={(e) => setFieldValue("numberOfChannels", e.target.value)}
                  onBlur={() => setFieldTouched("numberOfChannels", true)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-textSecondary">
                  Channels
                </span>
              </div>
              {errors.numberOfChannels && touched.numberOfChannels && (
                <p className="mt-1 text-sm text-red-400">{errors.numberOfChannels}</p>
              )}
            </div>

            {/* Storage Capacity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-textSecondary">
                Storage Capacity <span className="text-red-500">*</span>
              </label>
              <InputSelect
                options={storageCapacityOptions}
                value={values.storageCapacity}
                onChange={(option) => setFieldValue("storageCapacity", option)}
                placeholder="1 TB"
                error={errors.storageCapacity}
                touched={touched.storageCapacity}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddNVRDeviceModal;
