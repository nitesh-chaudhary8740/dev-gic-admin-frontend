
import {
  Trash2,
  Copy,
  CheckSquare,
  Square,
} from "lucide-react";

import {
  API_BASE_URL,
  formatBytes,
  getFileIcon,
} from "../utils/mediaHelpers";

const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

export default function MediaGrid({
  items,
  onOpen,
  onDelete,
  onDeleteFolder,
  onCopyLink,
  selectedFileNames = [],
  onToggleSelect,
}) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = getFileIcon(item);
        const isFolder = item.type === "folder";
        const isSelected =
          !isFolder && selectedFileNames.includes(item.name);

        return (
          <div
            key={`${item.type}-${item.id || item.path || item.name}`}
            className={`group relative rounded-xl border bg-white p-3 transition hover:shadow-sm ${
              isSelected
                ? "border-blue-400 bg-blue-50/40"
                : "border-slate-200 hover:border-blue-200"
            }`}
          >
            {/* FILE SELECTION */}
            {!isFolder && (
              <button
                type="button"
                onClick={() => onToggleSelect?.(item.name)}
                className="absolute left-2 top-2 z-10 rounded-md bg-white/95 p-1.5 shadow-sm transition hover:bg-blue-50"
                title={isSelected ? "Deselect file" : "Select file"}
                aria-label={
                  isSelected ? "Deselect file" : "Select file"
                }
              >
                {isSelected ? (
                  <CheckSquare
                    size={18}
                    className="text-blue-600"
                  />
                ) : (
                  <Square
                    size={18}
                    className="text-slate-400"
                  />
                )}
              </button>
            )}

            {/* OPEN ITEM */}
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="block w-full text-left"
            >
              <div
                className={`flex h-28 items-center justify-center overflow-hidden rounded-lg ${
                  isFolder
                    ? "bg-amber-50 text-amber-500"
                    : "bg-slate-50 text-slate-400"
                }`}
              >
                {item.url &&
                imageExtensions.includes(
                  (item.format || "").toLowerCase()
                ) ? (
                  <img
                    src={
                      item.url.startsWith("http")
                        ? item.url
                        : `${API_BASE_URL}${item.url
                            .split("/")
                            .map((segment, index) =>
                              index < 2
                                ? segment
                                : encodeURIComponent(segment)
                            )
                            .join("/")}`
                    }
                    alt={item.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Icon
                    size={isFolder ? 43 : 38}
                    strokeWidth={1.5}
                  />
                )}
              </div>

              <p
                className="mt-3 truncate text-sm font-semibold text-slate-800"
                title={item.name}
              >
                {item.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isFolder ? "Folder" : formatBytes(item.size)}
              </p>
            </button>

            {/* FILE / FOLDER ACTIONS */}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
              {isFolder ? (
                <span className="text-xs text-slate-400">
                  Folder
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onCopyLink?.(item)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                  title="Copy public link"
                >
                  <Copy size={14} />
                  Copy Link
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  isFolder
                    ? onDeleteFolder(item)
                    : onDelete(item)
                }
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                title={isFolder ? "Delete folder" : "Delete file"}
                aria-label={
                  isFolder ? "Delete folder" : "Delete file"
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
