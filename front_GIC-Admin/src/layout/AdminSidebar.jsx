
import { NavLink } from "react-router-dom";
import { X, ShieldCheck } from "lucide-react";
import {
  adminNavigation,
  adminBottomNavigation,
} from "../config/navigation";

function NavigationLink({ item, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`
      }
    >
      <Icon size={19} className="shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function AdminSidebar({ open = false, onClose = () => {} }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ShieldCheck size={23} />
            </div>
            <div>
              <p className="font-bold tracking-tight text-slate-900">
                GIC Admin
              </p>
              <p className="text-xs text-slate-500">Content Management</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          {adminNavigation.map((item) => (
            <NavigationLink
              key={item.path}
              item={item}
              onNavigate={onClose}
            />
          ))}
        </nav>

        {/* Bottom navigation */}
        <div className="space-y-1 border-t border-slate-200 px-3 py-4">
          {adminBottomNavigation.map((item) => (
            <NavigationLink
              key={item.path}
              item={item}
              onNavigate={onClose}
            />
          ))}

          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">
              GIC Whistleblower
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Admin Control Panel
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
