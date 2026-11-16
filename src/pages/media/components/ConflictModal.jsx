import { AlertCircle } from "lucide-react";
import Modal from "./Modal";

export default function ConflictModal({
  open, uploading, conflictMessage, onResolve, onCancel,
}) {
  if (!open) return null;

  return (
    <Modal
      title="File already exists"
      onClose={() => {
        if (!uploading) onCancel();
      }}
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{conflictMessage}</p>
            <p className="mt-1 text-xs">Choose how you want to continue.</p>
          </div>
        </div>

        <div className="grid gap-2">
          <button
            disabled={uploading}
            onClick={() => onResolve("replace")}
            className="rounded-lg border border-slate-200 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
          >
            <span className="block text-sm font-semibold text-slate-800">
              Replace existing file
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Overwrite the file currently stored with this name.
            </span>
          </button>

          <button
            disabled={uploading}
            onClick={() => onResolve("rename")}
            className="rounded-lg border border-slate-200 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
          >
            <span className="block text-sm font-semibold text-slate-800">
              Upload with a new name
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Automatically generate the next available suffix.
            </span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            disabled={uploading}
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel upload
          </button>
        </div>
      </div>
    </Modal>
  );
}