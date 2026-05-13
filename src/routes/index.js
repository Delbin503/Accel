import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminLayout from "layouts/layoutAdmin";
import Login from "pages/auth/Login";
import ProtectedRoute from "components/auth/ProtectedRoute";

import userRoutes from "./user";

const AppRouter = () => {
  const Loader = () => {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-deep">
        <div className="text-white">Loading...</div>
      </div>
    );
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route exact path="/" element={<Navigate to="/cameras" replace />} />
          <Route element={<AdminLayout />}>
            {userRoutes.map((routes, index) => {
              const { path, component: Component } = routes;
              return (
                <Route
                  key={index}
                  path={path}
                  element={
                    <Suspense fallback={<Loader />}>
                      <Component />
                    </Suspense>
                  }
                />
              );
            })}
          </Route>
        </Route>

        {/* Catch all - redirect to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
