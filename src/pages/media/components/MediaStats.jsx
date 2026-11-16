export default function MediaStats({ totalFiles, totalFolders, allowedFormats, formatsLength }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Current folder files
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{totalFiles}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Subfolders
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{totalFolders}</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Allowed formats
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatsLength ? allowedFormats : "—"}
        </p>
      </div>
    </div>
  );
}