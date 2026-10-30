
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Languages as LanguagesIcon,
  Plus,
  Search,
  Pencil,
  X,
  Check,
  RefreshCw,
  Globe2,
  CheckCircle2,
  CircleDashed,
  AlertCircle,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.194:3000";

const EMPTY_FORM = {
  name: "",
  code: "",
  isPublished: true,
};

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof result === "object"
        ? result.message || "Request failed."
        : result || "Request failed."
    );
  }

  return result;
}

function getArrayData(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.languages)) return response.languages;
  return [];
}

function getLanguageId(language) {
  return language?.id ?? language?._id;
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

function Languages() {
  const [languages, setLanguages] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/api/languages");
      setLanguages(getArrayData(response));
    } catch (err) {
      setError(err.message || "Languages load nahi ho paayin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const filteredLanguages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return languages;

    return languages.filter(
      (language) =>
        String(language.name || "").toLowerCase().includes(query) ||
        String(language.code || "").toLowerCase().includes(query)
    );
  }, [languages, search]);

  const publishedCount = languages.filter(
    (language) => language.isPublished
  ).length;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError("");
    setMessage("");
  };

  const handleEdit = (language) => {
    setEditingId(getLanguageId(language));
    setForm({
      name: language.name || "",
      code: language.code || "",
      isPublished: Boolean(language.isPublished),
    });
    setShowForm(true);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.name.trim() || !form.code.trim()) {
      setError("Language name aur code dono required hain.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      isPublished: form.isPublished,
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await apiRequest(`/api/languages/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setMessage("Language successfully update ho gayi.");
      } else {
        await apiRequest("/api/languages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Language successfully create ho gayi.");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await loadLanguages();
    } catch (err) {
      setError(err.message || "Language save nahi ho paayi.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (language) => {
    const id = getLanguageId(language);

    if (id == null) {
      setError("Language ID nahi mila.");
      return;
    }

    setError("");
    setMessage("");
    setTogglingId(id);

    try {
      const action = language.isPublished ? "unpublish" : "publish";

      await apiRequest(`/api/languages/${id}/${action}`, {
        method: "PATCH",
      });

      setMessage(
        language.isPublished
          ? "Language unpublished."
          : "Language published."
      );

      await loadLanguages();
    } catch (err) {
      setError(err.message || "Language status update nahi hua.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
            <span>Administration</span>
            <span>/</span>
            <span className="text-slate-600">Languages</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Languages
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage website languages and their publication status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadLanguages}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Add language
          </button>
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"
        >
          <CheckCircle2 size={18} />
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Total languages
            </p>
            <Globe2 size={19} className="text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {languages.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Configured languages
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Published</p>
            <CheckCircle2 size={19} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {publishedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Available for publishing
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Draft</p>
            <CircleDashed size={19} className="text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {languages.length - publishedCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Currently unpublished
          </p>
        </div>
      </div>

      {/* Add / edit form */}
      {showForm && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {editingId !== null ? "Edit language" : "Add new language"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Enter the language name and its code.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="language-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Language name <span className="text-red-500">*</span>
                </label>
                <input
                  id="language-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. English"
                  className={inputClass}
                  required
                  maxLength={100}
                />
              </div>

              <div>
                <label
                  htmlFor="language-code"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Language code <span className="text-red-500">*</span>
                </label>
                <input
                  id="language-code"
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    setForm({ ...form, code: event.target.value })
                  }
                  placeholder="e.g. en"
                  className={inputClass}
                  required
                  maxLength={20}
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Use the code format expected by your backend.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) =>
                  setForm({
                    ...form,
                    isPublished: event.target.checked,
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
              <span>
                <span className="block text-sm font-medium text-slate-700">
                  Publish language
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Enable this language for the website.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save changes"
                    : "Create language"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Language listing */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              All languages
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredLanguages.length} of {languages.length} languages
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search languages..."
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading languages...
          </div>
        ) : filteredLanguages.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <LanguagesIcon size={23} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-800">
              {search ? "No languages found" : "No languages yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another language name or code."
                : "Add your first language to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Language
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Code
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredLanguages.map((language, index) => {
                  const id = getLanguageId(language);
                  const isPublished = Boolean(language.isPublished);
                  const isToggling = togglingId === id;

                  return (
                    <tr
                      key={id ?? `${language.code}-${index}`}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold uppercase text-slate-600">
                            {(language.name || "?").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {language.name || "Unnamed language"}
                            </p>
                            {id != null && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                ID: {id}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <code className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                          {language.code || "—"}
                        </code>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            isPublished
                              ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              : "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                          }
                        >
                          <span
                            className={
                              isPublished
                                ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                                : "h-1.5 w-1.5 rounded-full bg-amber-500"
                            }
                          />
                          {isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Edit language"
                            aria-label={`Edit ${language.name}`}
                            onClick={() => handleEdit(language)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title={isPublished ? "Unpublish" : "Publish"}
                            disabled={isToggling || id == null}
                            onClick={() => handleTogglePublish(language)}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                          >
                            {isToggling ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              isPublished ? (
                                <CircleDashed size={17} />
                              ) : (
                                <CheckCircle2 size={17} />
                              )
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Languages;
