import { Trash2 } from "lucide-react";
import { formatBytes, formatDate, getFileIcon } from "../utils/mediaHelpers";

export default function MediaList({ items, onOpen, onDelete, onDeleteFolder }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Type</th>
            <th className="px-5 py-3 font-semibold">Size</th>
            <th className="px-5 py-3 font-semibold">Modified</th>
            <th className="px-5 py-3 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const Icon = getFileIcon(item);
            const isFolder = item.type === "folder";

            return (
              <tr
                key={`${item.type}-${item.id || item.path || item.name}`}
                className="hover:bg-slate-50"
              >
                <td className="px-5 py-3">
                  <button
                    onClick={() => onOpen(item)}
                    className="flex items-center gap-3 text-sm font-medium text-slate-800 hover:text-blue-700"
                  >
                    <Icon
                      size={19}
                      className={isFolder ? "text-amber-500" : "text-slate-400"}
                    />
                    <span className="max-w-md truncate">{item.name}</span>
                  </button>
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">
                  {isFolder ? "Folder" : (item.format || "File").toUpperCase()}
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">
                  {isFolder ? "—" : formatBytes(item.size)}
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">
                  {formatDate(item.updatedAt || item.createdAt)}
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() =>
                      isFolder ? onDeleteFolder(item) : onDelete(item)
                    }
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}