
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Eye,
  FileText,
  Languages,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.194:3000";

const EMPTY_FORM = {
  content: "",
  isPublished: false,
};

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let result = null;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = text;
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        (typeof result === "string" ? result : `API error: ${response.status}`)
    );
  }

  return result;
}

function getArrayData(result, key) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.[key])) return result[key];
  return [];
}

function getId(item) {
  return item?.id ?? item?._id ?? item?.pageId ?? item?.menuId;
}

function sameId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

function getParentId(menu) {
  return menu?.parentId ?? menu?.parent_id ?? menu?.parent?.id ?? null;
}

function getTranslation(menu, languageId) {
  return (menu?.translations ?? []).find((translation) =>
    sameId(
      translation.languageId ?? translation.language?.id,
      languageId
    )
  );
}

function getTranslationTitle(menu, languageId) {
  return (
    getTranslation(menu, languageId)?.menuTitle ||
    `Menu #${getId(menu)}`
  );
}

function getPageTranslationId(page) {
  return page?.menuTranslationId ?? page?.menu_translation_id;
}

function getMenuPath(menu, menus) {
  // Returns [top-level menu, submenu, submenu, submenu]
  const path = [];
  let current = menu;
  const visited = new Set();

  while (current && path.length < 4) {
    const id = getId(current);
    if (id == null || visited.has(String(id))) break;

    visited.add(String(id));
    path.unshift(String(id));

    const parentId = getParentId(current);
    current = parentId == null
      ? null
      : menus.find((item) => sameId(getId(item), parentId));
  }

  return path;
}

export default function Pages() {
  const [menus, setMenus] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [pages, setPages] = useState([]);

  const [languageId, setLanguageId] = useState("");
  const [menuPath, setMenuPath] = useState(["", "", "", ""]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingPageId, setEditingPageId] = useState(null);
  const [search, setSearch] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menuResult, languageResult, pageResult] = await Promise.all([
        apiRequest("/api/menus"),
        apiRequest("/api/languages"),
        apiRequest("/api/pages"),
      ]);

      const nextMenus = getArrayData(menuResult, "menus");
      const nextLanguages = getArrayData(languageResult, "languages");
      const nextPages = getArrayData(pageResult, "pages");

      setMenus(nextMenus);
      setLanguages(nextLanguages);
      setPages(nextPages);

      setLanguageId((current) => {
        if (current && nextLanguages.some((l) => sameId(getId(l), current))) {
          return current;
        }

        const defaultLanguage =
          nextLanguages.find((l) => l.isPublished) ?? nextLanguages[0];

        return defaultLanguage ? String(getId(defaultLanguage)) : "";
      });
    } catch (err) {
      setError(err.message || "Pages load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedMenuIds = menuPath.filter(Boolean);

  // Current menu = deepest selected menu.
  const selectedMenuId = selectedMenuIds.at(-1) || "";

  const selectedMenu = useMemo(
    () => menus.find((menu) => sameId(getId(menu), selectedMenuId)),
    [menus, selectedMenuId]
  );

  const selectedTranslation = useMemo(
    () => selectedMenu
      ? getTranslation(selectedMenu, languageId)
      : null,
    [selectedMenu, languageId]
  );

  const selectedTranslationId = selectedTranslation
    ? getId(selectedTranslation)
    : "";

  const existingPage = useMemo(
    () => pages.find((page) =>
      sameId(getPageTranslationId(page), selectedTranslationId)
    ),
    [pages, selectedTranslationId]
  );

  // Dropdown options: each level only shows direct children
  // of the previously selected menu.
  const menuOptions = useMemo(() => {
    return [0, 1, 2, 3].map((level) => {
      const parentId = level === 0 ? null : menuPath[level - 1];

      return menus.filter((menu) => {
        const menuParentId = getParentId(menu);

        if (level === 0) {
          return menuParentId == null || menuParentId === "";
        }

        return sameId(menuParentId, parentId);
      });
    });
  }, [menus, menuPath]);

  // Load content when the selected menu or language changes.
  useEffect(() => {
    if (!selectedTranslationId) {
      setForm(EMPTY_FORM);
      setEditingPageId(null);
      return;
    }

    if (existingPage) {
      setForm({
        content: existingPage.content ?? "",
        isPublished: existingPage.isPublished ?? false,
      });
      setEditingPageId(getId(existingPage));
    } else {
      setForm(EMPTY_FORM);
      setEditingPageId(null);
    }

    setError("");
    setMessage("");
  }, [selectedTranslationId, existingPage]);

  const chooseMenu = (level, value) => {
    setMenuPath((current) => {
      const next = [...current];
      next[level] = value;

      // Clear every child selection when a parent changes.
      for (let i = level + 1; i < next.length; i += 1) {
        next[i] = "";
      }

      return next;
    });
  };

  const resetEditor = () => {
    setMenuPath(["", "", "", ""]);
    setForm(EMPTY_FORM);
    setEditingPageId(null);
    setError("");
    setMessage("");
  };

  const handleLanguageChange = (value) => {
    setLanguageId(value);
    setMenuPath(["", "", "", ""]);
    setForm(EMPTY_FORM);
    setEditingPageId(null);
    setError("");
    setMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!languageId) {
      setError("Pehle language select karein.");
      return;
    }

    if (!selectedTranslationId) {
      setError(
        "Selected menu ke liye is language ki translation available nahi hai."
      );
      return;
    }

    setSaving(true);

    const payload = {
      menuTranslationId: Number(selectedTranslationId),
      content: form.content,
      isPublished: form.isPublished,
    };

    try {
      if (editingPageId != null) {
        await apiRequest(`/api/pages/${editingPageId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Page successfully update ho gaya.");
      } else {
        await apiRequest("/api/pages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Page successfully create ho gaya.");
      }

      await loadData();
    } catch (err) {
      setError(err.message || "Page save nahi ho paya.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (page) => {
    const translationId = getPageTranslationId(page);
    const matchedMenu = menus.find((menu) =>
      (menu.translations ?? []).some((translation) =>
        sameId(getId(translation), translationId)
      )
    );

    const matchedTranslation = matchedMenu
      ? (matchedMenu.translations ?? []).find((translation) =>
          sameId(getId(translation), translationId)
        )
      : null;

    if (!matchedMenu || !matchedTranslation) {
      setError(
        "Is page ki menu translation nahi mili. Menu/language data check karein."
      );
      return;
    }

    setLanguageId(String(
      matchedTranslation.languageId ?? matchedTranslation.language?.id
    ));
    setMenuPath([
      ...getMenuPath(matchedMenu, menus),
      "",
      "",
      "",
    ].slice(0, 4));
    setEditingPageId(getId(page));
    setForm({
      content: page.content ?? "",
      isPublished: page.isPublished ?? false,
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (page) => {
    if (!window.confirm("Kya aap is page ko delete karna chahte hain?")) {
      return;
    }

    try {
      await apiRequest(`/api/pages/${getId(page)}`, {
        method: "DELETE",
      });
      setMessage("Page delete ho gaya.");
      await loadData();
    } catch (err) {
      setError(err.message || "Page delete nahi ho paya.");
    }
  };

  const translationLookup = useMemo(() => {
    const map = new Map();

    menus.forEach((menu) => {
      (menu.translations ?? []).forEach((translation) => {
        map.set(String(getId(translation)), {
          menu,
          translation,
        });
      });
    });

    return map;
  }, [menus]);

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();

    return pages.filter((page) => {
      const linked = translationLookup.get(
        String(getPageTranslationId(page))
      );

      if (!linked) return `page #${getId(page)}`.includes(query);

      const language = languages.find((item) =>
        sameId(
          getId(item),
          linked.translation.languageId ?? linked.translation.language?.id
        )
      );

      const searchableText = [
        linked.translation.menuTitle,
        linked.translation.menuURL,
        language?.name,
        language?.code,
      ].join(" ").toLowerCase();

      return searchableText.includes(query);
    });
  }, [pages, translationLookup, languages, search]);

  const previewDocument = `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: Arial, sans-serif; padding: 16px; margin: 0; overflow-wrap: anywhere; }
  img, video, iframe { max-width: 100%; }
  img { height: auto; }
</style>
</head>
<body>${form.content}</body>
</html>`;

  const levels = [
    "Top-level menu",
    "Submenu — Level 1",
    "Submenu — Level 2",
    "Submenu — Level 3",
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={26} />
            <h1 className="text-2xl font-bold text-slate-900">Pages</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Menu hierarchy select karke language-specific HTML content manage karein.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="admin-button-secondary inline-flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <section className="admin-card space-y-5">
        <div className="flex items-center gap-2">
          <Languages size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold">Language & Menu Selection</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-1">
            <label className="admin-label">Language *</label>
            <select
              value={languageId}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="admin-input"
              disabled={loading}
            >
              <option value="">Select language</option>
              {languages.map((language) => (
                <option key={getId(language)} value={getId(language)}>
                  {language.name} ({language.code})
                </option>
              ))}
            </select>
          </div>

          {levels.map((label, level) => (
            <div key={label}>
              <label className="admin-label">{label}</label>
              <select
                value={menuPath[level]}
                onChange={(event) => chooseMenu(level, event.target.value)}
                className="admin-input"
                disabled={
                  loading ||
                  !languageId ||
                  (level > 0 && !menuPath[level - 1])
                }
              >
                <option value="">
                  {level === 0 ? "Select top menu" : "None / Select submenu"}
                </option>
                {menuOptions[level].map((menu) => {
                  const translation = getTranslation(menu, languageId);

                  return (
                    <option key={getId(menu)} value={getId(menu)}>
                      {getTranslationTitle(menu, languageId)}
                      {!translation ? " — translation missing" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>

        {selectedMenu && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Selected menu
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {selectedMenuIds.map((id) => {
                  const menu = menus.find((item) => sameId(getId(item), id));
                  return getTranslationTitle(menu, languageId);
                }).join("  /  ")}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {selectedTranslation
                  ? `URL: ${selectedTranslation.menuURL || "Not set"}`
                  : "Is menu ke liye selected language ki translation nahi hai."}
              </p>
            </div>

            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              existingPage
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}>
              {existingPage ? "Existing page" : "New page"}
            </span>
          </div>
        )}

        {!loading && languages.length === 0 && (
          <p className="text-sm text-amber-700">
            Pehle Languages page par language add karein.
          </p>
        )}

        {!loading && menus.length === 0 && (
          <p className="text-sm text-amber-700">
            Pehle Menus page par menu create karein.
          </p>
        )}

        {selectedMenu && !selectedTranslation && (
          <p className="text-sm text-amber-700">
            Is menu ki selected language translation missing hai. Pehle Menus page par translation add karein.
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 items-start gap-6 2xl:grid-cols-2">
        <form onSubmit={handleSave} className="admin-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {editingPageId != null ? "Edit HTML Content" : "HTML Content"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedTranslation
                  ? `Content for ${selectedTranslation.menuTitle}`
                  : "Pehle language aur menu select karein."}
              </p>
            </div>
            <Code2 size={22} className="text-blue-600" />
          </div>

          <div>
            <label className="admin-label">HTML *</label>
            <textarea
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  content: event.target.value,
                }))
              }
              rows={18}
              spellCheck={false}
              required
              disabled={!selectedTranslation}
              placeholder="<section><h1>Welcome to GIC</h1><p>Page content...</p></section>"
              className="admin-input min-h-80 resize-y font-mono text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">
              HTML source yahan edit karein. Preview ko trusted content ke saath hi use karein.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isPublished: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-blue-600"
              disabled={!selectedTranslation}
            />
            <span>
              <span className="block text-sm font-medium">Publish page</span>
              <span className="block text-xs text-slate-500">
                Enable karne par API ko isPublished: true bheja jayega.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || loading || !selectedTranslation}
              className="admin-button-primary inline-flex items-center gap-2"
            >
              {saving
                ? <LoaderCircle size={17} className="animate-spin" />
                : <Save size={17} />}
              {saving ? "Saving..." : editingPageId != null ? "Update Page" : "Create Page"}
            </button>

            <button
              type="button"
              onClick={resetEditor}
              className="admin-button-secondary"
            >
              Clear selection
            </button>
          </div>
        </form>

        <section className="admin-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">HTML Live Preview</h2>
              <p className="mt-1 text-sm text-slate-500">
                Current editor content ka preview
              </p>
            </div>

            <select
              value={previewMode}
              onChange={(event) => setPreviewMode(event.target.value)}
              className="admin-input w-auto"
            >
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>

          <div className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white ${
            previewMode === "mobile" ? "max-w-sm" : "w-full"
          }`}>
            <iframe
              title="HTML content preview"
              srcDoc={previewDocument}
              sandbox=""
              className="h-[520px] w-full bg-white"
            />
          </div>
          <p className="text-xs text-slate-500">
            Preview sandboxed hai; scripts aur forms iframe mein execute nahi honge.
          </p>
        </section>
      </section>

      <section className="admin-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Existing Pages</h2>
            <p className="mt-1 text-sm text-slate-500">
              Kisi page ko edit karne par uski language aur menu path restore ho jayega.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {filteredPages.length} pages
          </span>
        </div>

        <div className="relative mb-4 max-w-md">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search page, menu URL or language..."
            className="admin-input pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <LoaderCircle size={18} className="animate-spin" />
            Loading pages...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full min-w-[720px]">
              <thead>
                <tr>
                  <th>Menu / Page</th>
                  <th>Language</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => {
                  const linked = translationLookup.get(
                    String(getPageTranslationId(page))
                  );
                  const language = linked
                    ? languages.find((item) =>
                        sameId(
                          getId(item),
                          linked.translation.languageId ??
                            linked.translation.language?.id
                        )
                      )
                    : null;

                  return (
                    <tr key={getId(page)}>
                      <td>
                        <div className="font-medium text-slate-900">
                          {linked?.translation.menuTitle || `Page #${getId(page)}`}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {linked ? `Menu ID: ${getId(linked.menu)}` : `Translation ID: ${getPageTranslationId(page)}`}
                        </div>
                      </td>
                      <td>
                        {language
                          ? `${language.name} (${language.code})`
                          : "Unknown"}
                      </td>
                      <td className="max-w-52 truncate font-mono text-xs">
                        {linked?.translation.menuURL || "—"}
                      </td>
                      <td>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          page.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {page.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(page)}
                            title="Edit page"
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(page)}
                            title="Delete page"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-500">
                      Koi page nahi mila.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
