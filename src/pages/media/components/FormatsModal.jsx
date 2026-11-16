import { AlertCircle } from "lucide-react";
import Modal from "./Modal";
import { formatBytes } from "../utils/mediaHelpers";

export default function FormatsModal({
  open, onClose, formats, formatLoadingId, onToggleFormat,
}) {
  if (!open) return null;

  return (
    <Modal title="Allowed media formats" onClose={onClose} width="max-w-2xl">
      <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        Disabling a format blocks future uploads of that extension. Enabling a
        format should only be done when server-side file signature validation
        supports it.
      </div>

      {formats.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No media formats found.
        </p>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Extension</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Allowed Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formats.map((format) => (
                <tr key={format.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    .{format.extension}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-slate-500">
                    {format.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatBytes(format.allowedSize)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        format.isAllowed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {format.isAllowed ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={formatLoadingId === format.id}
                      onClick={() => onToggleFormat(format)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {formatLoadingId === format.id
                        ? "Saving..."
                        : format.isAllowed
                          ? "Disable"
                          : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}