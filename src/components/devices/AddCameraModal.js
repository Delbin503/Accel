import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Modal from "components/common/Modal";
import { PrimaryButton, SecondaryButton } from "components/common/Button";
import InputSelect from "components/common/InputSelect";
import InputTime from "components/common/InputTime";
import { cn } from "utils/common";
import { useCheckCameraExistName, useCreateCameraMutation } from "services/camera";
import { getSites } from "services/site";
import AddZoneModal from "./AddZoneModal";
import InputText from "components/common/InputText";
import InputNumber from "components/common/InputNumber";
import { successAlert } from "components/common/Toast";

// Validation schemas
const cameraValidationSchema = (checkExistName) =>
  Yup.object().shape({
    name: Yup.string()
      .required("Camera name is required")
      .test("unique-name", "Name already exists", async function (value) {
        if (!value) return true;
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

const AddCameraModal = ({ isOpen, onClose, areaOptions, laneOptions }) => {
  const [finalLaneOptions, setFinalLaneOptions] = useState([]);
  const [siteOptions, setSiteOptions] = useState([]);
  const [state, setState] = useState(0);
  const [zones, setZones] = useState([]);

  const createDeviceMutation = useCreateCameraMutation();
  const checkExistName = useCheckCameraExistName();

  // Fetch sites on mount
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await getSites({ pageSize: 999 });
        // console.log("Sites Response:", response);

        // Handle response - wrap single object in array if needed
        let sitesData = [];
        if (Array.isArray(response.data)) {
          sitesData = response.data;
        } else if (response.data && typeof response.data === "object") {
          // Single site object - wrap in array
          sitesData = [response.data];
        }

        // console.log("Sites Data:", sitesData);

        const options = sitesData.map((site) => ({
          value: site.siteName || site.name,
          label: site.siteName || site.name,
        }));

        // console.log("Site Options:", options);
        setSiteOptions(options);
      } catch (error) {
        console.error("Error fetching sites:", error);
      }
    };

    if (isOpen) {
      fetchSites();
    }
  }, [isOpen]);

  const initialValues = {
    name: "",
    siteName: "",
    area: "",
    lane: [],
    sourceStreamLink: "",
    resolution: null,
    frameRate: null,
    videoCodec: null,
    recordingMode: null,
    preRecordingBuffer: "",
    postRecordingBuffer: "",
    repeat: [],
    startTime: "",
    endTime: "",
    zones: [],
  };

  const normalizeNumber = (value) => {
    const numeric = value.replace(/\D/g, "");
    if (numeric.startsWith("0")) return numeric.slice(1);
    return numeric;
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFinalLaneOptions([]);
    }
  }, [isOpen]);

  const handleClose = () => {
    setFinalLaneOptions([]);
    onClose();
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    // Transform form values to match backend schema
    const requestBody = {
      name: values.name,
      siteLocation: values.siteName,
      area: values.area,
      lane: values.lane.map((l) => l.value || l),
      sourceStreamLink: values.sourceStreamLink,
      videoResolution: values.resolution?.value || values.resolution,
      frameRate: values.frameRate?.value || values.frameRate,
      videoCodec: values.videoCodec?.value || values.videoCodec,
      recordingMode: values.recordingMode?.value || values.recordingMode,
      preRecordingBuffer: values.preRecordingBuffer.toString(),
      postRecordingBuffer: values.postRecordingBuffer.toString(),
      repeatDay: values.repeat,
      startTime: values.startTime,
      endTime: values.endTime,
      zones: values.zones,
    };
    try {
      await createDeviceMutation.mutateAsync(requestBody);
      successAlert("Camera Created", "Camera successfully created.");
      // successAlert("Camera Linked to NVR", "Camera successfully linked to the selected NVR.");

      setSubmitting(false);
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const formik = useFormik({
    initialValues,
    validationSchema: cameraValidationSchema(checkExistName),
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
    submitForm,
    validateForm,
  } = formik;

  const toggleDay = (day) => {
    const updated = values.repeat.includes(day)
      ? values.repeat.filter((d) => d !== day)
      : [...values.repeat, day];
    setFieldValue("repeat", updated);
  };

  const areaHandleChange = (value) => {
    if (values.area !== value) {
      setFieldValue("lane", []);
      const lanes = laneOptions?.filter((v) => v?.areaID === value);
      setFinalLaneOptions(lanes);
    }
    setFieldValue("area", value);
  };

  const handleConfirmClick = async () => {
    // Mark all fields as touched to show validation errors
    const touchedFields = {};
    Object.keys(values).forEach((key) => {
      touchedFields[key] = true;
    });

    setFieldTouched("name", true, false);
    setFieldTouched("siteName", true, false);
    setFieldTouched("area", true, false);
    setFieldTouched("lane", true, false);
    setFieldTouched("sourceStreamLink", true, false);
    setFieldTouched("resolution", true, false);
    setFieldTouched("frameRate", true, false);
    setFieldTouched("videoCodec", true, false);
    setFieldTouched("recordingMode", true, false);
    setFieldTouched("preRecordingBuffer", true, false);
    setFieldTouched("postRecordingBuffer", true, false);
    setFieldTouched("repeat", true, false);
    setFieldTouched("startTime", true, false);
    setFieldTouched("endTime", true, false);

    // if (state === 0) {
    const errors = await validateForm();
    if (Object.keys(errors).length === 0) {
      // setState(1);
      await submitForm();
    } else {
      // Focus the first invalid field
      const fieldOrder = [
        "name",
        "siteName",
        "area",
        "lane",
        "sourceStreamLink",
        "resolution",
        "frameRate",
        "videoCodec",
        "recordingMode",
        "preRecordingBuffer",
        "postRecordingBuffer",
        "repeat",
        "startTime",
        "endTime",
      ];
      for (const field of fieldOrder) {
        if (errors[field]) {
          const el = document.querySelector(`[name="${field}"]`);
          if (el && typeof el.focus === "function") {
            el.focus();
            break;
          }
        }
      }
    }

    // } else {
    //   setFieldValue("zones", zones);
    //   await submitForm();
    // }
  };

  const footer = (
    <div className="flex justify-end space-x-3">
      <SecondaryButton
        onClick={() => {
          // if (state === 0) {
          onClose();
          // } else {
          //   setState(0);
          // }
        }}
        type="button"
      >
        {/* {state === 0 ? "Cancel" : "Back"} */}
        Cancel
      </SecondaryButton>
      <PrimaryButton type="button" onClick={handleConfirmClick} disabled={isSubmitting}>
        {/* {state === 0 ? "Next" : "Confirm"} */}
        Confirm
      </PrimaryButton>
    </div>
  );

  return (
    <>
      {state === 0 && (
        <Modal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            // setState(0);
            formik.resetForm();
          }}
          title="Add New Camera"
          footer={footer}
          size="lg"
        >
          <form className="space-y-6" onSubmit={formikHandleSubmit}>
            <>
              <div>
                <h3 className="mb-4 text-lg font-semibold text-[#D4D4D4]">Camera Information</h3>
                <div className={"grid grid-cols-2 gap-4"}>
                  {/* Device Name */}
                  <InputText
                    label="Camera Name"
                    name="name"
                    value={values.name}
                    placeholder="Enter camera name"
                    onChange={(e) => setFieldValue("name", e.target.value)}
                    onBlur={() => setFieldTouched("name", true)}
                    error={errors.name}
                    touched={touched.name}
                    required
                  />

                  {/* Site Name */}
                  <InputSelect
                    label="Site Name"
                    required
                    value={siteOptions?.find((v) => v?.value === values.siteName)}
                    onChange={(value) => {
                      setFieldValue("siteName", value?.value || "");
                    }}
                    onBlur={() => setFieldTouched("siteName", true)}
                    options={siteOptions}
                    placeholder="Select site"
                    touched={touched.siteName}
                    error={errors.siteName}
                    showCheckbox={true}
                  />

                  {/* Area */}
                  <InputSelect
                    label="Area"
                    value={areaOptions?.find((v) => v?.value === values.area)}
                    onChange={(value) => areaHandleChange(value?.value)}
                    onBlur={() => setFieldTouched("area", true)}
                    options={areaOptions}
                    placeholder="Select area"
                    required={true}
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
                    error={errors.lane}
                    touched={touched.lane}
                  />
                  {/* RTSP Stream Link */}
                  <InputText
                    label="RTSP Stream Link"
                    name="sourceStreamLink"
                    value={values.sourceStreamLink}
                    placeholder="Enter video stream link"
                    onChange={(e) => setFieldValue("sourceStreamLink", e.target.value)}
                    onBlur={() => setFieldTouched("sourceStreamLink", true)}
                    error={errors.sourceStreamLink}
                    touched={touched.sourceStreamLink}
                    required
                  />
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
                    options={[
                      { label: "HD (1280x720)", value: "1280x720" },
                      { label: "Full HD (1920x1080)", value: "1920x1080" },
                      { label: "2K (2560x1440)", value: "2560x1440" },
                      { label: "4K (3840x2160)", value: "3840x2160" },
                    ]}
                    placeholder="Select resolution"
                    required={true}
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
                    error={errors.videoCodec}
                    touched={touched.videoCodec}
                  />
                </div>
              </div>

              {/* Recording Configuration Section */}

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
                    error={errors.recordingMode}
                    touched={touched.recordingMode}
                  />

                  {/* Pre-recording Buffer (Seconds before detection) */}
                  <InputNumber
                    label="Pre-recording Buffer (Seconds before detection)"
                    name="preRecordingBuffer"
                    value={values.preRecordingBuffer}
                    placeholder="ex. 5"
                    onChange={(e) => {
                      const cleaned = normalizeNumber(e.target.value);
                      setFieldValue("preRecordingBuffer", cleaned);
                    }}
                    onBlur={() => setFieldTouched("preRecordingBuffer", true)}
                    error={errors.preRecordingBuffer}
                    touched={touched.preRecordingBuffer}
                    unit="Sec"
                    required
                  />

                  {/* Post-recording Buffer (Seconds after detection) */}
                  <InputNumber
                    label="Post-recording Buffer (Seconds after detection)"
                    name="postRecordingBuffer"
                    value={values.postRecordingBuffer}
                    placeholder="ex. 5"
                    onChange={(e) => {
                      const cleaned = normalizeNumber(e.target.value);
                      setFieldValue("postRecordingBuffer", cleaned);
                    }}
                    onBlur={() => setFieldTouched("postRecordingBuffer", true)}
                    error={errors.postRecordingBuffer}
                    touched={touched.postRecordingBuffer}
                    unit="Sec"
                    required
                  />
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
                            onClick={() => toggleDay(day)}
                            className={`h-[42px] rounded-lg border px-3 text-sm transition-all
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
                      For each selected day, the recording will start on at 07:00 AM and turn off at
                      03:00 PM.
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
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          </form>
        </Modal>
      )}
      {state === 1 && (
        <AddZoneModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            // setState(0);
            formik.resetForm();
          }}
          footer={footer}
          setZones={setZones}
          zones={zones}
          rtspStreamLink={values.rtspStreamLink}
        />
      )}
    </>
  );
};

export default AddCameraModal;
