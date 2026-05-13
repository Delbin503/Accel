import { Outlet } from "react-router-dom";
import Sidebar from "components/layout/Sidebar";
import Header from "components/layout/Header";
import AlertPopup from "components/layout/AlertPopup";

const LayoutAdmin = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      <Header />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="h-full flex-shrink-0 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main Content Area - Only this part will scroll */}
        <main className="h-full flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <AlertPopup />
    </div>
  );
};

export default LayoutAdmin;
