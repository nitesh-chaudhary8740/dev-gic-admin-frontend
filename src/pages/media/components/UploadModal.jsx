import { useRef } from "react";
import { LoaderCircle, Upload, X, AlertCircle } from "lucide-react";
import Modal from "./Modal";
import { formatBytes, inputClass } from "../utils/mediaHelpers";

export default function UploadModal({
  open,
  onClose,
  uploading,
  location,
  selectedFiles,
  onFilesChange,
  customFileName,
  onCustomFileNameChange,
  onSubmit,
  uploadProgress,
  isBulkMode = false,
  onCancelUpload,
}) {
  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    onFilesChange(files);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isActuallyBulk = isBulkMode || selectedFiles.length > 1;
  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <Modal
      title={isActuallyBulk ? "Bulk Upload Media" : "Upload Single File"}
      onClose={() => !uploading && onClose()}
      width={isActuallyBulk ? "max-w-xl" : "max-w-md"}
    >
      <div className="space-y-4">
        {/* Destination */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Destination folder
          </label>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {location || "Media root"}
          </div>
        </div>

        {/* File Input */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Select files{" "}
            {isBulkMode && (
              <span className="text-slate-400 font-normal">(Max 100)</span>
            )}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple={isBulkMode}
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full cursor-pointer rounded-lg border border-slate-200 text-sm text-slate-600 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>

        {/* File List */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
              <span>{selectedFiles.length} file(s) selected</span>
              <span>Total: {formatBytes(totalSize)}</span>
            </div>
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded px-1 py-1.5 text-sm hover:bg-slate-100"
              >
                <span className="truncate pr-2 text-slate-700">{file.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROGRESS UI (Only during Bulk Upload) */}
        {uploading && isActuallyBulk && uploadProgress && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 space-y-2">
            <div className="flex justify-between text-xs font-medium text-blue-800">
              <span className="truncate pr-2">
                {uploadProgress.currentFile || "Processing..."}
              </span>
              <span>
                {uploadProgress.processed} / {uploadProgress.total} files
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-blue-600">{uploadProgress.message}</p>
              <button
                onClick={onCancelUpload}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
              >
                Cancel Upload
              </button>
            </div>
          </div>
        )}

        {/* Custom Name (Only single mode) */}
        {!isActuallyBulk && !uploading && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Custom file name{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              value={customFileName}
              onChange={(e) => onCustomFileNameChange(e.target.value)}
              className={inputClass}
              placeholder="homepage-banner"
            />
          </div>
        )}

        {/* Info Box */}
        <div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p>
            {isActuallyBulk
              ? "Files will be uploaded sequentially with auto-rename on conflict. Files exceeding 50 MB will be skipped."
              : "If a file already exists, you will be asked whether to replace it or upload with a new name."}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={uploading || selectedFiles.length === 0}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            {uploading
              ? "Uploading..."
              : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}