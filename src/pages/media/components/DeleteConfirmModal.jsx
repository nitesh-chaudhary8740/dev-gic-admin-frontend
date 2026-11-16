import { AlertCircle, LoaderCircle } from "lucide-react";
import Modal from "./Modal";

export default function DeleteConfirmModal({
  open,
  title = "Confirm delete",
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={() => !loading && onClose()}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{message}</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            disabled={loading}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {loading && <LoaderCircle size={15} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}