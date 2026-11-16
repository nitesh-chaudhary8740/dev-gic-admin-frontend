
import React from "react";
import { Outlet, useLocation } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminFooter from "./AdminFooter";

const AdminLayout = () => {
  const location = useLocation();

  const pageTitles = {
    "/admin": "Dashboard",
    "/admin/pages": "Pages",
    "/admin/menus": "Menus",
    "/admin/languages": "Languages",
    "/admin/settings": "Settings",
  };

  const title = pageTitles[location.pathname] || "Admin Panel";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full">
        {/* Fixed-width Sidebar */}
        <div className="hidden w-[25%] min-w-60 max-w-80 shrink-0 lg:block">
          <AdminSidebar />
        </div>

        {/* Remaining width for Outlet */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            title={title}
            subtitle="Administration"
          />

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          <AdminFooter />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
