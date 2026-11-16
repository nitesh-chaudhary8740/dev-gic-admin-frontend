import { FolderPlus, HardDrive, Settings2, Upload, Files } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MediaHeader({
  onOpenFolderModal,
  onOpenSingleUpload,
  onOpenBulkUpload,
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          <HardDrive size={21} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Media Library
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage public images, documents, audio and video files.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => navigate("/admin/media/formats")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Settings2 size={16} />
          Formats
        </button>

        <button
          onClick={onOpenFolderModal}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <FolderPlus size={16} />
          New folder
        </button>

        {/* 🟢 Bulk Upload Button */}
        <button
          onClick={onOpenBulkUpload}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          <Files size={16} />
          Bulk Upload
        </button>

        {/* 🟢 Single Upload Button */}
        <button
          onClick={onOpenSingleUpload}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Upload size={16} />
          Upload File
        </button>
      </div>
    </div>
  );
}