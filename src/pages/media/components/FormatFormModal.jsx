import { useEffect, useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import Modal from "./Modal";
import {
  MEDIA_CATEGORIES,
  inputClass,
  bytesToHuman,
} from "../utils/mediaHelpers";

const emptyForm = {
  extension: "",
  category: "image",
  mimeTypes: [],
  allowedSizeMB: 5,
};

export default function FormatFormModal({
  open,
  mode = "create", // "create" | "edit"
  initialData,
  loading = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [mimeInput, setMimeInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      setForm({
        extension: initialData.extension || "",
        category: initialData.category || "image",
        mimeTypes: initialData.mimeTypes || [],
        allowedSizeMB: initialData.allowedSize
          ? Number((initialData.allowedSize / (1024 * 1024)).toFixed(2))
          : 5,
      });
    } else {
      setForm(emptyForm);
    }

    setMimeInput("");
    setErrors({});
  }, [open, mode, initialData]);

  if (!open) return null;

  const addMime = () => {
    const value = mimeInput.trim().toLowerCase();
    if (!value) return;
    if (form.mimeTypes.includes(value)) {
      setMimeInput("");
      return;
    }
    setForm((f) => ({ ...f, mimeTypes: [...f.mimeTypes, value] }));
    setMimeInput("");
  };

  const removeMime = (mime) => {
    setForm((f) => ({
      ...f,
      mimeTypes: f.mimeTypes.filter((m) => m !== mime),
    }));
  };

  const validate = () => {
    const e = {};

    if (!form.extension.trim()) {
      e.extension = "Extension required.";
    } else if (!/^[a-z0-9]{1,20}$/i.test(form.extension.trim())) {
      e.extension = "Only letters/numbers, max 20 chars.";
    }

    if (!MEDIA_CATEGORIES.includes(form.category)) {
      e.category = "Invalid category.";
    }

    if (form.mimeTypes.length === 0) {
      e.mimeTypes = "At least one MIME type required.";
    }

    const size = Number(form.allowedSizeMB);
    if (!Number.isFinite(size) || size <= 0) {
      e.allowedSizeMB = "Size must be a positive number (MB).";
    } else if (size * 1024 * 1024 > Number.MAX_SAFE_INTEGER) {
      e.allowedSizeMB = "Size too large.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (evt) => {
    evt.preventDefault();
    if (!validate()) return;

    onSubmit({
      extension: form.extension.trim().toLowerCase(),
      category: form.category,
      mimeTypes: form.mimeTypes,
      allowedSize: Math.round(Number(form.allowedSizeMB) * 1024 * 1024),
    });
  };

  return (
    <Modal
      title={mode === "edit" ? "Edit media format" : "Add media format"}
      onClose={() => !loading && onClose()}
      width="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Extension + Category */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Extension
            </label>
            <input
              value={form.extension}
              onChange={(e) =>
                setForm((f) => ({ ...f, extension: e.target.value }))
              }
              className={inputClass}
              placeholder="e.g. webp"
              disabled={mode === "edit"}
            />
            {errors.extension && (
              <p className="mt-1 text-xs text-rose-600">{errors.extension}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className={inputClass}
            >
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MIME types */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            MIME types
          </label>

          <div className="flex gap-2">
            <input
              value={mimeInput}
              onChange={(e) => setMimeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMime();
                }
              }}
              className={inputClass}
              placeholder="e.g. image/webp"
            />
            <button
              type="button"
              onClick={addMime}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 text-sm font-medium text-white hover:bg-slate-900"
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {form.mimeTypes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.mimeTypes.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                >
                  {m}
                  <button
                    type="button"
                    onClick={() => removeMime(m)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {errors.mimeTypes && (
            <p className="mt-1 text-xs text-rose-600">{errors.mimeTypes}</p>
          )}
        </div>

        {/* Allowed size */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Max file size (MB)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.allowedSizeMB}
            onChange={(e) =>
              setForm((f) => ({ ...f, allowedSizeMB: e.target.value }))
            }
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">
            Stored as:{" "}
            <span className="font-mono">
              {bytesToHuman(
                Math.round(Number(form.allowedSizeMB || 0) * 1024 * 1024)
              )}
            </span>
          </p>
          {errors.allowedSizeMB && (
            <p className="mt-1 text-xs text-rose-600">{errors.allowedSizeMB}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <LoaderCircle size={15} className="animate-spin" />}
            {mode === "edit" ? "Save changes" : "Create format"}
          </button>
        </div>
      </form>
    </Modal>
  );
}