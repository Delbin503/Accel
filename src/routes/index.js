import { Routes, Route, Navigate } from "react-router-dom";

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen items-center justify-center bg-neutral-750">
            <p className="text-textPrimary text-xl font-semibold">Vibe Coding Accel</p>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
