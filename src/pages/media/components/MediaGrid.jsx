import { Trash2 } from "lucide-react";
import { API_BASE_URL, formatBytes, getFileIcon } from "../utils/mediaHelpers";

const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

export default function MediaGrid({ items, onOpen, onDelete, onDeleteFolder }) {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = getFileIcon(item);
        const isFolder = item.type === "folder";

        return (
          <div
            key={`${item.type}-${item.id || item.path || item.name}`}
            className="group relative rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:shadow-sm"
          >
            <button onClick={() => onOpen(item)} className="block w-full text-left">
              <div
                className={`flex h-28 items-center justify-center overflow-hidden rounded-lg ${
                  isFolder ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-400"
                }`}
              >
                {item.url &&
                imageExtensions.includes((item.format || "").toLowerCase()) ? (
                  <img
                    src={
                      item.url.startsWith("http")
                        ? item.url
                        : `${API_BASE_URL}${item.url}`
                    }
                    alt={item.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Icon size={isFolder ? 43 : 38} strokeWidth={1.5} />
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

            <button
              onClick={() => (isFolder ? onDeleteFolder(item) : onDelete(item))}
              className="absolute right-2 top-2 rounded-lg bg-white/95 p-1.5 text-slate-400 opacity-0 shadow-sm transition hover:text-rose-600 group-hover:opacity-100"
              title={isFolder ? "Delete folder" : "Delete file"}
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}