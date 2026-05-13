import React, { useState, useEffect, useRef, useCallback } from "react";
import Modal from "components/common/Modal";
import { useCreateSiteMutation } from "services/site";
import { toast } from "react-toastify";

const STEPS = ["Site Information", "Configure Floor Plan"];

// ── Progress Stepper ──────────────────────────────────────────────────────────
const Stepper = ({ currentStep }) => (
  <div className="flex w-full items-start">
    {STEPS.map((label, idx) => {
      const step = idx + 1;
      const isActive = step === currentStep;
      const isDone = step < currentStep;
      const isUpcoming = step > currentStep;

      return (
        <div key={step} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full items-center">
            {step > 1 ? (
              <div
                className="h-[2px] flex-1"
                style={{ background: isDone || isActive ? "#FEAA01" : "#888888" }}
              />
            ) : (
              <div className="flex-1" />
            )}

            <div
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2"
              style={{
                borderColor: isActive || isDone ? "#FEAA01" : "#888888",
                background: isDone ? "#FEAA01" : "transparent",
              }}
            >
              {isDone ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : isActive ? (
                <div className="h-4 w-4 rounded-full" style={{ background: "#FEAA01" }} />
              ) : null}
            </div>

            {step < STEPS.length ? (
              <div
                className="h-[2px] flex-1"
                style={{ background: isDone ? "#FEAA01" : "#E5E5E5" }}
              />
            ) : (
              <div className="flex-1" />
            )}
          </div>

          <span
            className="text-base font-medium"
            style={{ color: isUpcoming ? "#888888" : "#FFFFFF" }}
          >
            {label}
          </span>
        </div>
      );
    })}
  </div>
);

// ── Upload Box ────────────────────────────────────────────────────────────────
const UploadBox = ({ file, onClick, onRemove }) => {
  if (file) {
    const previewUrl = URL.createObjectURL(file);
    return (
      <div className="flex gap-4 rounded-[6px] p-0">
        <img
          src={previewUrl}
          alt="Floor plan preview"
          className="h-[168px] w-[168px] shrink-0 rounded-[4px] object-cover"
        />
        <div className="flex min-w-0 flex-col justify-between py-1">
          <div className="flex flex-col gap-1">
            <p className="text-[18px] font-semibold text-white">
              Floor Plan <span className="text-[#D4D4D4]">*</span>
            </p>ß
            
            <p className="text-sm text-neutral-400">
              *.png, *.jpeg files up to 10MB at least 400px by 400px
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={onClick}
              className="flex shrink-0 w-[153px] h-10 items-center justify-center gap-[6px] rounded-[6px] border border-[#888888] bg-[#404040] px-4 py-[10px] text-sm font-medium text-white whitespace-nowrap transition-opacity hover:opacity-80"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Replace Photo
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="flex shrink-0 w-[153px] h-10 items-center justify-center gap-[6px] rounded-[6px] border border-red-400 bg-transparent px-4 py-[10px] text-sm font-medium text-red-400 whitespace-nowrap transition-opacity hover:opacity-80"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Remove Photo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[228px] w-[228px] shrink-0 flex-col items-center justify-center gap-3 rounded-[6px] bg-[#404040] p-4 transition-opacity hover:opacity-80"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="#D4D4D4" strokeWidth="1.5"/>
        <circle cx="8.5" cy="8.5" r="1.5" stroke="#D4D4D4" strokeWidth="1.5"/>
        <polyline points="21 15 16 10 5 21" stroke="#D4D4D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium leading-5" style={{ color: "#F2A070" }}>
          Upload a floor plan or drag
          <br />
          and drop
        </p>
        <p className="mt-1 text-xs leading-5 text-neutral-300">
          PNG, JPG, file up to 10mb at least
          <br />
          400x400 px
        </p>
      </div>
    </button>
  );
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, required, error, touched, children, className = "" }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-sm font-medium text-neutral-300">
      {label}
      {required && <span className="ml-0.5 text-[#D4D4D4]">*</span>}
    </label>
    {children}
    {touched && error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

const inputCls = (hasError) =>
  `h-10 w-full rounded-[6px] border bg-transparent px-3 py-2 text-sm text-white placeholder-[#D4D4D4] focus:outline-none ${
    hasError
      ? "border-red-500 focus:border-red-500"
      : "border-[#404040] hover:border-[#606060] focus:border-[#EE4D2D]"
  }`;

// ── Main component ────────────────────────────────────────────────────────────
const SiteFormModal = ({ isOpen, onClose, onSuccess }) => {
  // ── Step 1 state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    siteName: "",
    areaName: "",
    acronym: "",
    information: "",
    floorPlanFile: null,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const fileInputRef = useRef();

  // ── Step 2 state ────────────────────────────────────────────────────────────
  const [drawingMode, setDrawingMode] = useState(false);
  const [zones, setZones] = useState([]); // [{name, points: [[nx,ny]...]}]
  const [activeZoneIdx, setActiveZoneIdx] = useState(-1);
  const [inProgressPts, setInProgressPts] = useState([]);
  const [areaSearch, setAreaSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const imageReadyRef = useRef(false);
  const canvasRef = useRef(null);
  const floorImgRef = useRef(null);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const createMutation = useCreateSiteMutation();
  const isLoading = createMutation.isLoading;

  // ── Reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm({ siteName: "", areaName: "", acronym: "", information: "", floorPlanFile: null });
      setErrors({});
      setTouched({});
      setDrawingMode(false);
      setZones([]);
      setActiveZoneIdx(-1);
      setInProgressPts([]);
      setAreaSearch("");
      setZoom(1);
      setPan({ x: 0, y: 0 });
      imageReadyRef.current = false;
      floorImgRef.current = null;
    }
  }, [isOpen]);

  // ── Load floor plan image when entering step 2 ──────────────────────────────
  useEffect(() => {
    if (step !== 2) return;

    if (form.areaName.trim()) {
      setZones([{ name: form.areaName.trim(), points: [] }]);
    }

    if (form.floorPlanFile) {
      const img = new Image();
      img.src = URL.createObjectURL(form.floorPlanFile);
      img.onload = () => {
        floorImgRef.current = img;
        imageReadyRef.current = true;
        redrawCanvas();
      };
    }
  }, [step, form.areaName, form.floorPlanFile]);

  // ── Canvas redraw ───────────────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    if (floorImgRef.current) {
      ctx.drawImage(floorImgRef.current, pan.x, pan.y, W * zoom, H * zoom);
    } else {
      ctx.fillStyle = "#2A2A2A";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#666666";
      ctx.font = "15px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No floor plan uploaded", W / 2, H / 2);
    }

    const toC = (nx, ny) => [nx * W * zoom + pan.x, ny * H * zoom + pan.y];

    // Draw completed zones
    zones.forEach((zone) => {
      if (zone.points.length < 2) return;
      const pts = zone.points.map(([nx, ny]) => toC(nx, ny));

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.closePath();
      ctx.fillStyle = "rgba(254,170,1,0.2)";
      ctx.fill();
      ctx.strokeStyle = "#FEAA01";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      const cx = zone.points.reduce((s, p) => s + p[0], 0) / zone.points.length;
      const cy = zone.points.reduce((s, p) => s + p[1], 0) / zone.points.length;
      const [tx, ty] = toC(cx, cy);
      ctx.font = "13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FEAA01";
      ctx.fillText(zone.name, tx, ty);

      // Corner dots
      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FEAA01";
        ctx.fill();
      });
    });

    // Draw in-progress polygon
    if (inProgressPts.length > 0) {
      const pts = inProgressPts.map(([nx, ny]) => toC(nx, ny));

      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.strokeStyle = "#FEAA01";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FEAA01";
        ctx.fill();
      });
    }
  }, [zones, inProgressPts, zoom, pan]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // ── Canvas coordinate helper ────────────────────────────────────────────────
  const getCanvasNorm = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const ix = (cx - pan.x) / zoom;
    const iy = (cy - pan.y) / zoom;
    const nx = Math.min(Math.max(ix / canvas.width, 0), 1);
    const ny = Math.min(Math.max(iy / canvas.height, 0), 1);
    return [nx, ny];
  };

  // ── Canvas event handlers ───────────────────────────────────────────────────
  const handleCanvasClick = (e) => {
    if (!drawingMode || activeZoneIdx === -1) return;
    const pt = getCanvasNorm(e);
    setInProgressPts((prev) => [...prev, pt]);
  };

  const handleCanvasContextMenu = (e) => {
    e.preventDefault();
    if (!drawingMode || activeZoneIdx === -1) return;
    setInProgressPts((prev) => prev.slice(0, -1));
  };

  const handleCanvasMouseDown = (e) => {
    if (drawingMode) return;
    isPanningRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasMouseMove = (e) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handleCanvasMouseUp = () => {
    isPanningRef.current = false;
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((z) => Math.min(Math.max(z + delta, 0.3), 5));
  };

  // ── Area panel actions ──────────────────────────────────────────────────────
  const handleDrawZone = (idx) => {
    setDrawingMode(true);
    setActiveZoneIdx(idx);
    setInProgressPts([]);
  };

  const handleFinishZone = (idx) => {
    if (inProgressPts.length >= 3) {
      setZones((prev) =>
        prev.map((z, i) => (i === idx ? { ...z, points: [...inProgressPts] } : z))
      );
    }
    setDrawingMode(false);
    setActiveZoneIdx(-1);
    setInProgressPts([]);
  };

  const handleClearZone = (idx) => {
    setZones((prev) =>
      prev.map((z, i) => (i === idx ? { ...z, points: [] } : z))
    );
    if (activeZoneIdx === idx) {
      setDrawingMode(false);
      setActiveZoneIdx(-1);
      setInProgressPts([]);
    }
  };

  // ── Fit to screen ──────────────────────────────────────────────────────────
  const handleFitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // ── Keyboard pan (arrow keys) ───────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    const PAN_STEP = 20;
    const handleKeyDown = (e) => {
      const map = {
        ArrowLeft:  { x: PAN_STEP,  y: 0 },
        ArrowRight: { x: -PAN_STEP, y: 0 },
        ArrowUp:    { x: 0, y: PAN_STEP  },
        ArrowDown:  { x: 0, y: -PAN_STEP },
      };
      if (map[e.key]) {
        e.preventDefault();
        setPan((p) => ({ x: p.x + map[e.key].x, y: p.y + map[e.key].y }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  // ── Step 1 helpers ──────────────────────────────────────────────────────────
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const validateStep1 = () => {
    const errs = {};
    if (!form.siteName.trim()) errs.siteName = "Site location name is required";
    if (!form.areaName.trim()) errs.areaName = "Area name is required";
    if (!form.acronym.trim()) errs.acronym = "Acronym is required";
    return errs;
  };

  const handleNext = () => {
    setTouched({ siteName: true, areaName: true, acronym: true });
    const errs = validateStep1();
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        siteName: form.siteName.trim(),
        siteShortName: form.acronym.trim(),
        description: form.information.trim(),
        areaName: form.areaName.trim(),
        floorPlan: form.floorPlanFile ? form.floorPlanFile.name : null,
      });
      toast.success("Site created successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create site");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, floorPlanFile: file }));
    e.target.value = "";
  };

  const handleRemoveFile = () => setForm((f) => ({ ...f, floorPlanFile: null }));

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const step1 = (
    <>
      <div className="mb-4 flex justify-center">
        <Stepper currentStep={step} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-[#D4D4D4]">Site Information</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-[93px] rounded-[6px] border border-[#888888] py-3 px-5 text-base font-medium text-[#FCFCFD] transition-opacity hover:opacity-80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="h-12 w-[76px] rounded-[6px] py-3 px-5 text-base font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(77.14deg, #EE4D2D 14.94%, #AC0001 93.95%)" }}
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.svg,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <UploadBox
            file={form.floorPlanFile}
            onClick={() => fileInputRef.current?.click()}
            onRemove={handleRemoveFile}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="Site Location Name" required error={errors.siteName} touched={touched.siteName}>
            <input
              type="text"
              value={form.siteName}
              onChange={set("siteName")}
              onBlur={touch("siteName")}
              placeholder="Enter site name"
              className={inputCls(touched.siteName && errors.siteName)}
            />
          </Field>

          <Field label="Area Name" required error={errors.areaName} touched={touched.areaName}>
            <input
              type="text"
              value={form.areaName}
              onChange={set("areaName")}
              onBlur={touch("areaName")}
              placeholder="Enter area name"
              className={inputCls(touched.areaName && errors.areaName)}
            />
          </Field>

          <Field label="Acronym" required error={errors.acronym} touched={touched.acronym}>
            <input
              type="text"
              value={form.acronym}
              onChange={set("acronym")}
              onBlur={touch("acronym")}
              placeholder="Short name e.g., AVK, BVF"
              className={inputCls(touched.acronym && errors.acronym)}
            />
          </Field>

          <Field label="Information">
            <textarea
              value={form.information}
              onChange={set("information")}
              placeholder="Enter site information"
              className="h-[137px] w-full resize-none rounded-[6px] border border-[#404040] bg-transparent px-3 py-2 text-sm text-white placeholder-[#D4D4D4] hover:border-[#606060] focus:border-[#EE4D2D] focus:outline-none"
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-[#404040]" />
    </>
  );

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const step2 = (
    <>
      {/* Stepper */}
      <div className="mb-4 flex justify-center">
        <Stepper currentStep={step} />
      </div>

      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-[#D4D4D4]">Configure Floor Plan</h3>
        <div className="flex items-center gap-2">
          {/* Draw Area + Add Device — grouped in bordered pill */}
          <div className="flex items-center rounded-[10px] border border-[#444444] p-1 gap-0.5 w-[226px] h-11">
            {/* Draw Area */}
            <button
              type="button"
              onClick={() => {
                if (drawingMode) {
                  setDrawingMode(false);
                  setActiveZoneIdx(-1);
                  setInProgressPts([]);
                } else {
                  setDrawingMode(true);
                  setActiveZoneIdx(zones.length > 0 ? 0 : -1);
                  setInProgressPts([]);
                }
              }}
              className={`flex h-9 items-center justify-center gap-2 rounded-[8px] px-3 text-sm font-medium transition-opacity hover:opacity-90 ${
                drawingMode ? "bg-[#3A3A3A] text-white" : "bg-[#3A3A3A] text-white"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.8948 10.8948L9.3184 14.8359L6.16552 6.16546L14.8359 9.31834L10.8948 10.8948ZM10.8948 10.8948L14.8359 14.8359M4.73745 0.835938L5.34947 3.12002M3.12002 5.34944L0.835938 4.73742M10.067 2.26401L8.39491 3.93607M3.93615 8.39484L2.26408 10.0669" stroke="white" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Draw Area
            </button>

            {/* Add Device */}
            <button
              type="button"
              disabled
              className="flex flex-1 h-9 items-center justify-center gap-2 rounded-[8px] text-sm font-medium text-[#666666] cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 3.33333C2.5 3.11232 2.5878 2.90036 2.74408 2.74408C2.90036 2.5878 3.11232 2.5 3.33333 2.5H16.6667C16.8877 2.5 17.0996 2.5878 17.2559 2.74408C17.4122 2.90036 17.5 3.11232 17.5 3.33333V5C17.5 5.22101 17.4122 5.43298 17.2559 5.58926C17.0996 5.74554 16.8877 5.83333 16.6667 5.83333H3.33333C3.11232 5.83333 2.90036 5.74554 2.74408 5.58926C2.5878 5.43298 2.5 5.22101 2.5 5V3.33333ZM6.66667 11.6667C6.66667 12.5507 7.01786 13.3986 7.64298 14.0237C8.2681 14.6488 9.11594 15 10 15C10.8841 15 11.7319 14.6488 12.357 14.0237C12.9821 13.3986 13.3333 12.5507 13.3333 11.6667C13.3333 10.7826 12.9821 9.93476 12.357 9.30964C11.7319 8.68452 10.8841 8.33333 10 8.33333C9.11594 8.33333 8.2681 8.68452 7.64298 9.30964C7.01786 9.93476 6.66667 10.7826 6.66667 11.6667Z" stroke="#666666" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.8307 5.83594V11.6693C15.8307 13.2164 15.2161 14.7001 14.1222 15.7941C13.0282 16.888 11.5445 17.5026 9.9974 17.5026C8.4503 17.5026 6.96657 16.888 5.87261 15.7941C4.77864 14.7001 4.16406 13.2164 4.16406 11.6693V5.83594M9.9974 11.6693H10.0057" stroke="#666666" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Device
            </button>
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={isLoading}
            className="h-10 w-[78px] rounded-[8px] border border-[#444444] bg-transparent text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Confirm */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-10 w-[86px] rounded-[8px] text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: isLoading
                ? "#D9D9D9"
                : "linear-gradient(77.14deg, #EE4D2D 14.94%, #AC0001 93.95%)",
            }}
          >
            {isLoading ? "Creating..." : "Confirm"}
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="mb-4 h-px w-full bg-[#404040]" />

      {/* Two-column layout */}
      <div className="flex gap-4" style={{ height: "calc(100% - 180px)", minHeight: 480 }}>
        {/* ── Left: Floor Plan Canvas ── */}
        <div className="relative flex-1 overflow-hidden rounded-[6px] bg-[#2A2A2A]">
          <canvas
            ref={canvasRef}
            width={1000}
            height={600}
            className={`h-full w-full ${
              drawingMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
            }`}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasContextMenu}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleCanvasWheel}
          />

          {/* Zoom + fit controls — top right */}
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            {/* Zoom in */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.2, 5))}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#555] bg-[#2A2A2A] text-white hover:bg-[#383838]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
              </svg>
            </button>
            {/* Zoom out */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#555] bg-[#2A2A2A] text-white hover:bg-[#383838]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M8 11h6"/>
              </svg>
            </button>
            {/* Fit to screen */}
            <button
              type="button"
              onClick={handleFitToScreen}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#555] bg-[#2A2A2A] text-white hover:bg-[#383838]"
              title="Fit to screen"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
              </svg>
            </button>
          </div>

          {/* Controls panel — bottom left */}
          <div className="absolute bottom-3 left-3 min-w-[155px] rounded-[6px] border border-[#333] bg-[#1A1A1A] px-3 py-2.5" style={{ background: "rgba(26,26,26,0.92)" }}>
            <p className="mb-2 text-xs font-semibold text-white">Controls</p>
            <div className="flex flex-col gap-2 text-xs text-neutral-400">
              {/* Navigate */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex justify-center">
                    <span className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#555] bg-[#333] text-[9px] text-white">↑</span>
                  </div>
                  <div className="flex gap-0.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#555] bg-[#333] text-[9px] text-white">←</span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#555] bg-[#333] text-[9px] text-white">↓</span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#555] bg-[#333] text-[9px] text-white">→</span>
                  </div>
                </div>
                <span>Navigate</span>
              </div>
              {/* Drag to Move */}
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 11V8a2 2 0 0 0-4 0v3M10 11V5a2 2 0 0 0-4 0v9l-2-2a2 2 0 0 0-3 3l4 4a6 6 0 0 0 6 0 6 6 0 0 0 6-6v-3a2 2 0 0 0-4 0"/>
                </svg>
                <span>Drag to Move</span>
              </div>
              {/* Zoom */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-start">
                  <span className="text-[9px] font-mono leading-tight text-neutral-500">Ctrl +</span>
                  <span className="text-[9px] font-mono leading-tight text-neutral-500">Scroll</span>
                </div>
                <span>Zoom</span>
              </div>
            </div>
          </div>

          {/* Draw mode hint */}
          {drawingMode && (
            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-[6px] bg-[#FEAA01] px-3 py-1.5 text-xs font-medium text-black">
              Click to place points · Right-click to undo · Finish in panel →
            </div>
          )}
        </div>

        {/* ── Right: Area Panel ── */}
        <div className="flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto">
          {/* Heading */}
          <div>
            <h4 className="text-[18px] font-semibold text-white">Add Area</h4>
            <p className="mt-1 text-sm text-neutral-400">
              Draw the polygon to the map to mark as a zone
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search area name"
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              className="h-10 w-full rounded-[6px] border border-[#404040] bg-transparent pl-9 pr-3 py-2 text-sm text-white placeholder-[#888888] focus:border-[#606060] focus:outline-none"
            />
          </div>

          {/* Areas list */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-300">Areas</span>

            {filteredZones.length === 0 ? (
              <p className="text-sm text-neutral-500">No areas found</p>
            ) : (
              filteredZones.map((zone) => {
                const realIdx = zones.indexOf(zone);
                const isActive = activeZoneIdx === realIdx && drawingMode;
                const hasZone = zone.points.length >= 3;

                return (
                  <div
                    key={realIdx}
                    className="flex items-center justify-between rounded-[6px] border border-[#404040] px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      {hasZone && (
                        <div className="h-2 w-2 rounded-full bg-[#FEAA01]" />
                      )}
                      <span className="text-sm text-white">{zone.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => handleFinishZone(realIdx)}
                          disabled={inProgressPts.length < 3}
                          className="rounded-[6px] bg-[#FEAA01] px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-80 disabled:opacity-40"
                        >
                          Finish Zone
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDrawZone(realIdx)}
                          className="rounded-[6px] border border-[#888888] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-80"
                        >
                          {hasZone ? "Redraw Zone" : "Draw Zone"}
                        </button>
                      )}
                      {hasZone && !isActive && (
                        <button
                          type="button"
                          onClick={() => handleClearZone(realIdx)}
                          className="text-neutral-500 transition-colors hover:text-red-400"
                          title="Clear zone"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-[#404040]" />
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Add New Site" : "Add Floor Plan"}
      maxWidth="w-[1697px]"
      maxHeight="h-[954px]"
      containerPadding="p-0"
      headerPadding="px-8 pt-7 pb-0"
      bodyPadding="px-8 pt-4 pb-7"
      borderRadius="rounded-[6px]"
    >
      {step === 1 ? step1 : step2}
    </Modal>
  );
};

export default SiteFormModal;
