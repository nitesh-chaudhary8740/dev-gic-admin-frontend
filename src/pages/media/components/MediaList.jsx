
import {
  Trash2,
  Copy,
  CheckSquare,
  Square,
} from "lucide-react";

import {
  formatBytes,
  formatDate,
  getFileIcon,
} from "../utils/mediaHelpers";

export default function MediaList({
  items,
  onOpen,
  onDelete,
  onDeleteFolder,
  onCopyLink,
  selectedFileNames = [],
  onToggleSelect,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-12 px-4 py-3 font-semibold">
              Select
            </th>
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Type</th>
            <th className="px-5 py-3 font-semibold">Size</th>
            <th className="px-5 py-3 font-semibold">Modified</th>
            <th className="px-5 py-3 text-right font-semibold">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const Icon = getFileIcon(item);
            const isFolder = item.type === "folder";

            const isSelected =
              !isFolder &&
              selectedFileNames.includes(item.name);

            return (
              <tr
                key={`${item.type}-${item.id || item.path || item.name}`}
                className={`transition ${
                  isSelected
                    ? "bg-blue-50/60"
                    : "hover:bg-slate-50"
                }`}
              >
                {/* SELECTION */}
                <td className="px-4 py-3">
                  {!isFolder && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleSelect?.(item.name)
                      }
                      className="rounded-md p-1 transition hover:bg-blue-50"
                      title={
                        isSelected
                          ? "Deselect file"
                          : "Select file"
                      }
                      aria-label={
                        isSelected
                          ? "Deselect file"
                          : "Select file"
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
                </td>

                {/* NAME */}
                <td className="px-5 py-3">
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    className="flex items-center gap-3 text-sm font-medium text-slate-800 hover:text-blue-700"
                  >
                    <Icon
                      size={19}
                      className={
                        isFolder
                          ? "text-amber-500"
                          : "text-slate-400"
                      }
                    />

                    <span className="max-w-md truncate">
                      {item.name}
                    </span>
                  </button>
                </td>

                {/* TYPE */}
                <td className="px-5 py-3 text-sm text-slate-500">
                  {isFolder
                    ? "Folder"
                    : (item.format || "File").toUpperCase()}
                </td>

                {/* SIZE */}
                <td className="px-5 py-3 text-sm text-slate-500">
                  {isFolder ? "—" : formatBytes(item.size)}
                </td>

                {/* MODIFIED */}
                <td className="px-5 py-3 text-sm text-slate-500">
                  {formatDate(
                    item.updatedAt || item.createdAt
                  )}
                </td>

                {/* ACTIONS */}
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {!isFolder && (
                      <button
                        type="button"
                        onClick={() => onCopyLink?.(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                        title="Copy public link"
                      >
                        <Copy size={15} />
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
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title={
                        isFolder
                          ? "Delete folder"
                          : "Delete file"
                      }
                      aria-label={
                        isFolder
                          ? "Delete folder"
                          : "Delete file"
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
