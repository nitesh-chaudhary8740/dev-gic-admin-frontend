
import { Menu, Bell, ChevronDown, ShieldCheck } from "lucide-react";

export default function AdminHeader({
  onMenuClick,
  title = "Dashboard",
  subtitle = "Manage your content and settings",
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {title}
            </h1>
            <p className="hidden truncate text-sm text-slate-500 sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">
              Admin Panel
            </span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <Bell size={20} />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
            aria-label="Administrator profile"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <ShieldCheck size={19} />
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Administrator
              </p>
              <p className="text-xs text-slate-500">CMS Manager</p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-400 sm:block"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
