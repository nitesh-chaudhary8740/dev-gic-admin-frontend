import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import FormatFormModal from "./components/FormatFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import {
  MEDIA_API,
  apiRequest,
  getFormats,
  inputClass,
  bytesToHuman,
} from "./utils/mediaHelpers";

export default function MediaFormats() {
  const navigate = useNavigate();

  const [formats, setFormats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingFormat, setEditingFormat] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  // ======================================
  // LOAD
  // ======================================
  const loadFormats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest(`${MEDIA_API}/formats`);
      setFormats(getFormats(response));
    } catch (err) {
      setFormats([]);
      setError(err.message || "Unable to load formats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  // ======================================
  // FILTER
  // ======================================
  const filteredFormats = useMemo(() => {
    const term = search.trim().toLowerCase();
    return formats.filter((f) => {
      const matchCat =
        categoryFilter === "all" || f.category === categoryFilter;
      const matchTerm =
        !term ||
        f.extension?.toLowerCase().includes(term) ||
        f.category?.toLowerCase().includes(term) ||
        (f.mimeTypes || []).some((m) => m.toLowerCase().includes(term));
      return matchCat && matchTerm;
    });
  }, [formats, search, categoryFilter]);

  // ======================================
  // CATEGORIES (dynamic from data)
  // ======================================
  const categories = useMemo(() => {
    const set = new Set(formats.map((f) => f.category));
    return Array.from(set).sort();
  }, [formats]);

  // ======================================
  // ADD / EDIT
  // ======================================
  const openCreate = () => {
    setFormMode("create");
    setEditingFormat(null);
    setFormModalOpen(true);
    setError("");
    setMessage("");
  };

  const openEdit = (format) => {
    setFormMode("edit");
    setEditingFormat(format);
    setFormModalOpen(true);
    setError("");
    setMessage("");
  };

  const submitFormat = async (payload) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (formMode === "edit" && editingFormat) {
        await apiRequest(`${MEDIA_API}/formats/${editingFormat.id}`, {
          method: "PUT",
          body: JSON.stringify({
            mimeTypes: payload.mimeTypes,
            category: payload.category,
            allowedSize: payload.allowedSize,
          }),
        });
        setMessage("Format updated successfully.");
      } else {
        await apiRequest(`${MEDIA_API}/formats`, {
          method: "POST",
          body: JSON.stringify({
            extension: payload.extension,
            mimeTypes: payload.mimeTypes,
            category: payload.category,
            allowedSize: payload.allowedSize,
          }),
        });
        setMessage("Format created successfully.");
      }

      setFormModalOpen(false);
      setEditingFormat(null);
      await loadFormats();
    } catch (err) {
      setError(err.message || "Unable to save format.");
    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // TOGGLE
  // ======================================
  const toggleFormat = async (format) => {
    setTogglingId(format.id);
    setError("");
    setMessage("");
    try {
      await apiRequest(`${MEDIA_API}/formats/${format.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isAllowed: !format.isAllowed }),
      });
      await loadFormats();
      setMessage(
        `${format.extension.toUpperCase()} ${
          format.isAllowed ? "disabled" : "enabled"
        }.`
      );
    } catch (err) {
      setError(err.message || "Unable to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ======================================
  // DELETE
  // ======================================
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(`${MEDIA_API}/formats/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setMessage(`Format ".${deleteTarget.extension}" deleted.`);
      setDeleteTarget(null);
      await loadFormats();
    } catch (err) {
      setError(err.message || "Unable to delete format.");
    } finally {
      setDeleting(false);
    }
  };

  // ======================================
  // UI
  // ======================================
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/media")}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            title="Back to Media"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
              <Settings2 size={21} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Media Formats
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Manage allowed file extensions, categories and size limits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadFormats}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Add format
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-rose-500 hover:text-rose-700"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {message && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>{message}</span>
          <button
            onClick={() => setMessage("")}
            className="ml-auto text-emerald-500 hover:text-emerald-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-2.5 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search extension, category or MIME..."
            className={`${inputClass} pl-9`}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`${inputClass} sm:w-48`}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={25} className="animate-spin text-blue-600" />
            Loading formats...
          </div>
        ) : filteredFormats.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Settings2 size={30} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              {search || categoryFilter !== "all"
                ? "No formats match filters"
                : "No formats yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search || categoryFilter !== "all"
                ? "Try clearing filters."
                : "Add your first media format to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Extension</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Allowed size</th>
                  <th className="px-5 py-3 font-semibold">MIME types</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFormats.map((format) => (
                  <tr key={format.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-semibold text-slate-800">
                      .{format.extension}
                    </td>
                    <td className="px-5 py-3 text-sm capitalize text-slate-500">
                      {format.category}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {bytesToHuman(format.allowedSize)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(format.mimeTypes || []).map((m) => (
                          <span
                            key={m}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
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
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          disabled={togglingId === format.id}
                          onClick={() => toggleFormat(format)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {togglingId === format.id
                            ? "..."
                            : format.isAllowed
                            ? "Disable"
                            : "Enable"}
                        </button>
                        <button
                          onClick={() => openEdit(format)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(format)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="text-xs text-slate-400">
        {filteredFormats.length} format
        {filteredFormats.length === 1 ? "" : "s"} shown
      </div>

      {/* MODALS */}
      <FormatFormModal
        open={formModalOpen}
        mode={formMode}
        initialData={editingFormat}
        loading={saving}
        onClose={() => setFormModalOpen(false)}
        onSubmit={submitFormat}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete media format"
        message={
          deleteTarget
            ? `Delete ".${deleteTarget.extension}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete format"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}