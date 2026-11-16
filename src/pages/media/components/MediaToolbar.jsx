import React from "react";
import {
  ArrowLeft, ChevronRight, LayoutGrid, List, RefreshCw, Search,
} from "lucide-react";
import { inputClass } from "../utils/mediaHelpers";

export default function MediaToolbar({
  location,
  breadcrumbs,
  search,
  view,
  loading,
  onLocationChange,
  onSearchChange,
  onViewChange,
  onRefresh,
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm">
        {location && (
          <button
            onClick={() =>
              onLocationChange(location.split("/").slice(0, -1).join("/"))
            }
            className="mr-1 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            title="Go up one folder"
          >
            <ArrowLeft size={17} />
          </button>
        )}

        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path || "root"}>
            {index > 0 && (
              <ChevronRight size={14} className="shrink-0 text-slate-300" />
            )}
            <button
              onClick={() => onLocationChange(crumb.path)}
              className={`whitespace-nowrap rounded-md px-2 py-1 ${
                index === breadcrumbs.length - 1
                  ? "font-semibold text-slate-900"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search this folder..."
            className={`${inputClass} pl-9`}
          />
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => onViewChange("grid")}
            className={`rounded-md p-1.5 ${
              view === "grid"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
            title="Grid view"
          >
            <LayoutGrid size={17} />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={`rounded-md p-1.5 ${
              view === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500"
            }`}
            title="List view"
          >
            <List size={17} />
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}