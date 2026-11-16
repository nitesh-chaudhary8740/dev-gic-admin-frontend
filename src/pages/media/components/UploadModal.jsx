import { LoaderCircle, Upload } from "lucide-react";
import Modal from "./Modal";
import { formatBytes, inputClass } from "../utils/mediaHelpers";

export default function UploadModal({
  open, onClose, uploading, location,
  selectedFile, onFileChange,
  customFileName, onCustomFileNameChange,
  fileInputRef, onSubmit,
}) {
  if (!open) return null;

  return (
    <Modal title="Upload media" onClose={() => !uploading && onClose()}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Destination folder
          </label>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {location || "Media root"}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Select file
          </label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="block w-full cursor-pointer rounded-lg border border-slate-200 text-sm text-slate-600 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          {selectedFile && (
            <p className="mt-2 text-xs text-slate-500">
              {selectedFile.name} · {formatBytes(selectedFile.size)}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Custom file name{" "}
            <span className="font-normal text-slate-400">
              (optional, without extension)
            </span>
          </label>
          <input
            value={customFileName}
            onChange={(e) => onCustomFileNameChange(e.target.value)}
            className={inputClass}
            placeholder="homepage-banner"
          />
        </div>

        <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-700">
          If a file with the same name already exists, you will be asked whether
          to replace it or upload with a new name.
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            disabled={uploading || !selectedFile}
            onClick={() => onSubmit("cancel")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            Upload
          </button>
        </div>
      </div>
    </Modal>
  );
}