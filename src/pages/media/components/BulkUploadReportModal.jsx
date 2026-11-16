import { CheckCircle2, XCircle, AlertCircle, MinusCircle } from "lucide-react";
import Modal from "./Modal";

export default function BulkUploadReportModal({ open, report, onClose }) {
  if (!open || !report) return null;

  const successCount = report.filter(r => r.status === "success").length;
  const failedCount = report.filter(r => r.status === "failed").length;
  const skippedCount = report.filter(r => r.status === "skipped").length;

  return (
    <Modal title="Bulk Upload Report" onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex gap-4 rounded-lg bg-slate-50 p-3 text-sm font-medium">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 size={16} />
            {successCount} Success
          </div>
          <div className="flex items-center gap-1.5 text-rose-700">
            <XCircle size={16} />
            {failedCount} Failed
          </div>
          <div className="flex items-center gap-1.5 text-amber-700">
            <MinusCircle size={16} />
            {skippedCount} Skipped
          </div>
        </div>

        {/* Details List */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white">
          {report.map((r, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-0 hover:bg-slate-50"
            >
              <div className="flex items-start gap-2 truncate pr-2">
                {r.status === "success" && <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 shrink-0" />}
                {r.status === "failed" && <XCircle size={16} className="mt-0.5 text-rose-600 shrink-0" />}
                {r.status === "skipped" && <AlertCircle size={16} className="mt-0.5 text-amber-600 shrink-0" />}
                <span className="truncate text-slate-700" title={r.name}>{r.name}</span>
              </div>
              <span className={`text-xs shrink-0 ${r.status === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {r.status === "success" ? "Uploaded" : r.reason}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}