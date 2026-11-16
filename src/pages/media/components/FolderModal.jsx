import { LoaderCircle } from "lucide-react";
import Modal from "./Modal";
import { inputClass } from "../utils/mediaHelpers";

export default function FolderModal({
  open, onClose, folderName, onFolderNameChange, location, saving, onSubmit,
}) {
  if (!open) return null;

  return (
    <Modal title="Create new folder" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Folder name
          </label>
          <input
            autoFocus
            required
            value={folderName}
            onChange={(e) => onFolderNameChange(e.target.value)}
            className={inputClass}
            placeholder="e.g. banners"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Create inside:{" "}
            <span className="font-mono">{location || "media/"}</span>
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            disabled={saving || !folderName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <LoaderCircle size={15} className="animate-spin" />}
            Create folder
          </button>
        </div>
      </form>
    </Modal>
  );
}