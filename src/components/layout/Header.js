import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "store";

const Header = () => {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const user = useAppStore((state) => state.user);

  const logout = useAppStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-surface-deeper px-6 py-3 shadow-lg">
      {/* Logo */}
      <img src="/icons/logo.svg" />

      {/* User Profile */}
      <div className="relative">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center space-x-2 rounded-lg p-2 transition-colors hover:bg-surface-elevated"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600">
            <span className="text-sm font-semibold text-white">{user?.name?.charAt(0) || "D"}</span>
          </div>
          <p className="font-medium text-white">{user?.name || "Delbin Arkar"}</p>
          
        </button>

        {/* Profile Dropdown */}
        {showProfile && (
          <div className="absolute left-0 z-50 mt-2 w-56 rounded-lg border border-gray-700 bg-surface-elevated shadow-lg">
            <div className="border-b border-gray-700 p-4">
              <p className="font-medium text-white">{user?.name || "Delbin Arkar"}</p>
              <p className="text-sm text-gray-400">{user?.email || "delbin@accel.com"}</p>
            </div>
            <div className="py-2">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-surface-muted"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
