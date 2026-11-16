import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Save,
  Search,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  Globe,
  Code2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  FileText,
  Languages as LanguagesIcon,
  Menu as MenuIcon,
  Layers,
  PlusCircle,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.194:3000";

const EMPTY_PAGE_FORM = {
  menuTranslationId: "",
  content: "",
  isPublished: false,
};

const EMPTY_LANG_FORM = {
  name: "",
  code: "",
  isPublished: false,
};

const EMPTY_TRANSLATION_FORM = {
  languageId: "",
  menuTitle: "",
  menuURL: "",
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
    const message =
      result?.message ||
      result?.error ||
      (typeof result === "string" ? result : null) ||
      `API error: ${response.status}`;
    throw new Error(message);
  }
  return result;
}

function getArrayData(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.pages)) return result.pages;
  if (Array.isArray(result?.menus)) return result.menus;
  if (Array.isArray(result?.languages)) return result.languages;
  return [];
}

function getItemId(item) {
  return item?.id ?? item?._id ?? item?.pageId ?? item?.menuId;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("pages");

  // Master Data
  const [menus, setMenus] = useState([]);
  const [translations, setTranslations] = useState([]); // All menu translations
  const [languages, setLanguages] = useState([]);
  const [defaultLanguage, setDefaultLanguage] = useState(null);

  // Pages State
  const [pages, setPages] = useState([]);
  const [pageForm, setPageForm] = useState(EMPTY_PAGE_FORM);
  const [editingPageId, setEditingPageId] = useState(null);
  const [pageSearch, setPageSearch] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");

  // Menus Management State
  const [menuTitle, setMenuTitle] = useState("");
  const [menuURL, setMenuURL] = useState("");
  const [menuPublished, setMenuPublished] = useState(true);
  const [parentId, setParentId] = useState("");

  // Translation Modal State
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [currentMenuForTranslation, setCurrentMenuForTranslation] = useState(null);
  const [translationForm, setTranslationForm] = useState(EMPTY_TRANSLATION_FORM);

  // Languages Management State
  const [langForm, setLangForm] = useState(EMPTY_LANG_FORM);
  const [editingLangId, setEditingLangId] = useState(null);

  // Global UI States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [apiHealth, setApiHealth] = useState(null);

  useEffect(() => {
    apiRequest("/health")
      .then((res) => setApiHealth(res))
      .catch(() => setApiHealth({ success: false, message: "Offline" }));
  }, []);

  const fetchMasterData = async () => {
    try {
      const [menuRes, langRes] = await Promise.all([
        apiRequest("/api/menus"),
        apiRequest("/api/languages"),
      ]);
      
      const fetchedMenus = getArrayData(menuRes);
      const fetchedLangs = getArrayData(langRes);

      setMenus(fetchedMenus);
      setLanguages(fetchedLangs);

      // Default Language set karo (pehli language jo published hai, ya pehli language)
      if (fetchedLangs.length > 0 && !defaultLanguage) {
        const publishedLang = fetchedLangs.find(l => l.isPublished) || fetchedLangs[0];
        setDefaultLanguage(publishedLang);
      }

      // Extract all translations
      const allTranslations = [];
      fetchedMenus.forEach((menu) => {
        if (menu.translations && Array.isArray(menu.translations)) {
          menu.translations.forEach((t) => {
            allTranslations.push({
              id: t.id,
              menuId: menu.id,
              languageId: t.languageId,
              menuTitle: t.menuTitle,
              menuURL: t.menuURL,
              languageName: t.language?.name || "Unknown",
              languageCode: t.language?.code || "??",
            });
          });
        }
      });
      setTranslations(allTranslations);

    } catch (err) {
      console.error("Master data load error:", err);
      setError(err.message || "Master data load nahi ho paya.");
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await fetchMasterData();
      if (activeTab === "pages") {
        const result = await apiRequest("/api/pages");
        setPages(getArrayData(result));
      }
    } catch (err) {
      setError(err.message || "Data load karne mein samasya aayi.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetAllForms = () => {
    setPageForm(EMPTY_PAGE_FORM);
    setEditingPageId(null);
    setMenuTitle("");
    setMenuURL("");
    setMenuPublished(true);
    setParentId("");
    setLangForm(EMPTY_LANG_FORM);
    setEditingLangId(null);
    setMessage("");
    setError("");
  };

  // --- PAGE HANDLERS ---
  const handlePageSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!pageForm.menuTranslationId) {
      setError("Kripya Menu Translation select karein.");
      return;
    }

    const payload = {
      menuTranslationId: Number(pageForm.menuTranslationId),
      content: pageForm.content,
      isPublished: pageForm.isPublished,
    };

    setSaving(true);
    try {
      if (editingPageId !== null) {
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
      resetAllForms();
      loadData();
    } catch (err) {
      setError(err.message || "Page save nahi ho paya.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPage = async (page) => {
    const id = getItemId(page);
    try {
      const res = await apiRequest(`/api/pages/${id}`);
      const p = res?.data ?? res?.page ?? res;
      setEditingPageId(id);
      setPageForm({
        menuTranslationId: p?.menuTranslationId ?? page?.menuTranslationId ?? "",
        content: p?.content ?? page?.content ?? "",
        isPublished: p?.isPublished ?? page?.isPublished ?? false,
      });
    } catch (err) {
      setError(err.message || "Page details load nahi hue.");
    }
  };

  const handleDeletePage = async (page) => {
    const id = getItemId(page);
    if (!window.confirm("Is page ko delete karna hai?")) return;
    try {
      await apiRequest(`/api/pages/${id}`, { method: "DELETE" });
      setMessage("Page soft-delete ho gaya.");
      loadData();
    } catch (err) {
      setError(err.message || "Page delete nahi hua.");
    }
  };

  const handleTogglePublishPage = async (page) => {
    const id = getItemId(page);
    const published = page?.isPublished ?? false;
    try {
      await apiRequest(
        `/api/pages/${id}/${published ? "unpublish" : "publish"}`,
        { method: "PATCH" }
      );
      setMessage(published ? "Page unpublished." : "Page published.");
      loadData();
    } catch (err) {
      setError(err.message || "Publish status update nahi hua.");
    }
  };

  // --- MENU HANDLERS ---
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!menuTitle.trim() || !menuURL.trim()) {
      setError("Menu Title aur Menu URL required hain.");
      return;
    }

    if (!defaultLanguage) {
      setError("Kripya pehle Languages tab mein ek language add karein.");
      return;
    }

    const payload = {
      languageId: defaultLanguage.id,
      menuTitle: menuTitle.trim(),
      menuURL: menuURL.trim(),
      parentId: parentId ? Number(parentId) : null,
      isPublished: menuPublished,
    };

    setSaving(true);
    try {
      await apiRequest("/api/menus", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Menu successfully create ho gaya!");
      setMenuTitle("");
      setMenuURL("");
      setParentId("");
      loadData();
    } catch (err) {
      setError(err.message || "Menu save nahi ho paya.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async (menu) => {
    const id = getItemId(menu);
    const title = menu.translations?.[0]?.menuTitle || `Menu #${id}`;
    if (!window.confirm(`"${title}" menu ko delete karna hai?`)) return;
    try {
      await apiRequest(`/api/menus/${id}`, { method: "DELETE" });
      setMessage("Menu soft-delete ho gaya.");
      loadData();
    } catch (err) {
      setError(err.message || "Menu delete nahi hua.");
    }
  };

  const handleTogglePublishMenu = async (menu) => {
    const id = getItemId(menu);
    const published = menu?.isPublished ?? false;
    try {
      await apiRequest(
        `/api/menus/${id}/${published ? "unpublish" : "publish"}`,
        { method: "PATCH" }
      );
      setMessage(published ? "Menu unpublished." : "Menu published.");
      loadData();
    } catch (err) {
      setError(err.message || "Menu publish status update nahi hua.");
    }
  };

  // --- ADD TRANSLATION HANDLERS ---
  const openTranslationModal = (menu) => {
    setCurrentMenuForTranslation(menu);
    setTranslationForm(EMPTY_TRANSLATION_FORM);
    setIsTranslationModalOpen(true);
  };

  const closeTranslationModal = () => {
    setIsTranslationModalOpen(false);
    setCurrentMenuForTranslation(null);
    setTranslationForm(EMPTY_TRANSLATION_FORM);
  };

  const handleTranslationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!translationForm.languageId || !translationForm.menuTitle.trim() || !translationForm.menuURL.trim()) {
      setError("Saare fields required hain.");
      return;
    }

    const menuId = getItemId(currentMenuForTranslation);
    const payload = {
      languageId: Number(translationForm.languageId),
      menuTitle: translationForm.menuTitle.trim(),
      menuURL: translationForm.menuURL.trim(),
    };

    setSaving(true);
    try {
      await apiRequest(`/api/menus/${menuId}/translations`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Menu translation successfully add ho gayi!");
      closeTranslationModal();
      loadData();
    } catch (err) {
      setError(err.message || "Translation save nahi ho payi.");
    } finally {
      setSaving(false);
    }
  };

  // Filter languages for translation modal (exclude languages already added)
  const getAvailableLanguagesForMenu = (menu) => {
    if (!menu || !menu.translations) return languages;
    const existingLangIds = menu.translations.map(t => t.languageId);
    return languages.filter(l => !existingLangIds.includes(l.id));
  };

  // --- LANGUAGE HANDLERS ---
  const handleLangSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!langForm.name.trim() || !langForm.code.trim()) {
      setError("Language Name aur Code required hain.");
      return;
    }

    setSaving(true);
    try {
      if (editingLangId !== null) {
        await apiRequest(`/api/languages/${editingLangId}`, {
          method: "PUT",
          body: JSON.stringify(langForm),
        });
        setMessage("Language successfully update ho gayi.");
      } else {
        await apiRequest("/api/languages", {
          method: "POST",
          body: JSON.stringify(langForm),
        });
        setMessage("Language successfully create ho gayi.");
      }
      resetAllForms();
      loadData();
    } catch (err) {
      setError(err.message || "Language save nahi ho payi.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditLang = (lang) => {
    const id = getItemId(lang);
    setEditingLangId(id);
    setLangForm({
      name: lang?.name ?? "",
      code: lang?.code ?? "",
      isPublished: lang?.isPublished ?? false,
    });
  };

  const handleTogglePublishLang = async (lang) => {
    const id = getItemId(lang);
    const published = lang?.isPublished ?? false;
    try {
      await apiRequest(
        `/api/languages/${id}/${published ? "unpublish" : "publish"}`,
        { method: "PATCH" }
      );
      setMessage(published ? "Language unpublished." : "Language published.");
      loadData();
    } catch (err) {
      setError(err.message || "Language status update nahi hua.");
    }
  };

  // Filtered Pages
  const filteredPages = pages.filter((p) => {
    const translation = translations.find((t) => t.id === p.menuTranslationId);
    const title = translation?.menuTitle || "";
    return title.toLowerCase().includes(pageSearch.toLowerCase());
  });

  const getTranslationLabel = (t) => `${t.menuTitle} (${t.languageName})`;

  const previewDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; margin: 0; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        ${pageForm.content}
      </body>
    </html>
  `;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3 text-white shadow-md shadow-blue-200">
              <Globe size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">GIC Admin CMS</h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    apiHealth?.success
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      apiHealth?.success ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  ></span>
                  {apiHealth?.success ? "API Online" : "Connecting..."}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Multi-language CMS with Menu Translations
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 transition"
            >
              <RefreshCw size={16} />
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto max-w-7xl px-6 flex gap-4">
          <button
            onClick={() => { setActiveTab("pages"); resetAllForms(); }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
              activeTab === "pages" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText size={18} /> Pages Management
          </button>
          <button
            onClick={() => { setActiveTab("menus"); resetAllForms(); }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
              activeTab === "menus" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <MenuIcon size={18} /> Menus & Translations
          </button>
          <button
            onClick={() => { setActiveTab("languages"); resetAllForms(); }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition ${
              activeTab === "languages" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <LanguagesIcon size={18} /> Languages Setup
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-6">
        {message && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-sm">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* --- PAGES TAB --- */}
        {activeTab === "pages" && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Code2 size={20} className="text-blue-600" />
                    {editingPageId !== null ? "Edit Page Content" : "Create Page Content"}
                  </h2>
                  {editingPageId !== null && (
                    <button
                      type="button"
                      onClick={resetAllForms}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-rose-600 transition"
                    >
                      <X size={16} /> Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handlePageSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Select Menu Translation *
                    </label>
                    <select
                      value={pageForm.menuTranslationId}
                      onChange={(e) => setPageForm({ ...pageForm, menuTranslationId: e.target.value })}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 bg-white text-sm"
                    >
                      <option value="">-- Choose Menu Translation --</option>
                      {translations.map((t) => (
                        <option key={t.id} value={t.id}>
                          {getTranslationLabel(t)} - {t.menuURL}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">HTML Content *</label>
                    <textarea
                      value={pageForm.content}
                      onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                      rows={10}
                      spellCheck={false}
                      required
                      placeholder="<section><h1>Welcome to GIC</h1></section>"
                      className="w-full resize-y rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm text-emerald-400 outline-none focus:border-blue-500"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3.5 bg-slate-50">
                    <input
                      type="checkbox"
                      checked={pageForm.isPublished}
                      onChange={(e) => setPageForm({ ...pageForm, isPublished: e.target.checked })}
                      className="h-4 w-4 accent-blue-600 rounded"
                    />
                    <div>
                      <span className="block text-sm font-medium">Publish Page Immediately</span>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-200"
                  >
                    {saving ? <RefreshCw size={18} className="animate-spin" /> : editingPageId !== null ? <Save size={18} /> : <Plus size={18} />}
                    {saving ? "Saving..." : editingPageId !== null ? "Update Page" : "Create Page"}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-base">HTML Live Preview</h3>
                  <select
                    value={previewMode}
                    onChange={(e) => setPreviewMode(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  >
                    <option value="desktop">Desktop View</option>
                    <option value="mobile">Mobile View</option>
                  </select>
                </div>
                <div className={`mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white ${previewMode === "mobile" ? "max-w-[375px]" : "w-full"}`}>
                  <iframe title="HTML Preview" srcDoc={previewDocument} sandbox="allow-scripts" className="h-87.5 w-full" />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col h-fit">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold">Existing Pages</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredPages.length} pages found
                </span>
              </div>

              <div className="mb-4 relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="Search by menu title..."
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
                  <RefreshCw size={20} className="animate-spin" /> Loading pages...
                </div>
              ) : filteredPages.length === 0 ? (
                <div className="py-20 text-center text-sm text-slate-500">Koi page available nahi hai.</div>
              ) : (
                <div className="space-y-3 max-h-187.5 overflow-y-auto pr-1">
                  {filteredPages.map((page, index) => {
                    const id = getItemId(page);
                    const isPublished = page?.isPublished ?? false;
                    const translationId = page?.menuTranslationId;
                    const translation = translations.find(t => t.id === translationId);

                    return (
                      <div key={id ?? index} className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 bg-slate-50/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {translation?.menuTitle || `Translation ID: ${translationId}`}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              URL: {translation?.menuURL || "/"} | Lang: {translation?.languageName || "N/A"}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                {isPublished ? "Published" : "Draft"}
                              </span>
                              {id && <span className="text-xs text-slate-400 font-mono">Page ID: {id}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button title="Edit" onClick={() => handleEditPage(page)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 transition">
                              <Pencil size={16} />
                            </button>
                            <button title={isPublished ? "Unpublish" : "Publish"} onClick={() => handleTogglePublishPage(page)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-100 transition">
                              {isPublished ? <Eye size={16} /> : <ExternalLink size={16} />}
                            </button>
                            <button title="Delete" onClick={() => handleDeletePage(page)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-100 transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- MENUS TAB --- */}
        {activeTab === "menus" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Layers size={20} className="text-blue-600" />
                Create New Menu
              </h2>

              {!defaultLanguage ? (
                <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm border border-amber-200">
                  Menu banane se pehle kripya <strong>Languages</strong> tab mein ek language add karein.
                </div>
              ) : (
                <form onSubmit={handleMenuSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Primary Language</label>
                    <input
                      type="text"
                      value={defaultLanguage.name}
                      disabled
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed text-sm"
                    />
                    <p className="mt-1 text-xs text-slate-500">Naya menu isi language mein banega.</p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Parent Menu (Optional)</label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">-- Root Menu (Top Level) --</option>
                      {menus.filter(m => !m.isDeleted).map((m) => (
                        <option key={getItemId(m)} value={getItemId(m)}>
                          {m.translations?.[0]?.menuTitle || `Menu #${getItemId(m)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <hr className="border-slate-200 my-2" />

                  <div>
                    <label className="mb-1 block text-sm font-medium">Menu Title ({defaultLanguage.code}) *</label>
                    <input
                      value={menuTitle}
                      onChange={(e) => setMenuTitle(e.target.value)}
                      required
                      placeholder="e.g. About Us"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Menu URL ({defaultLanguage.code}) *</label>
                    <input
                      value={menuURL}
                      onChange={(e) => setMenuURL(e.target.value)}
                      required
                      placeholder="e.g. /about-us"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={menuPublished} onChange={(e) => setMenuPublished(e.target.checked)} className="h-4 w-4 accent-blue-600 rounded" />
                    <span className="text-sm font-medium">Published</span>
                  </label>

                  <button type="submit" disabled={saving} className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-200 flex items-center justify-center gap-2">
                    {saving ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                    {saving ? "Creating..." : "Create Menu"}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Menus & Translations</h2>
                <button onClick={loadData} className="p-2 border rounded-lg hover:bg-slate-50 text-sm flex items-center gap-1.5">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-500">Loading menus...</div>
              ) : menus.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Koi menu available nahi hai.</div>
              ) : (
                <div className="space-y-3 max-h-150 overflow-y-auto pr-1">
                  {menus.map((menu) => {
                    const menuId = getItemId(menu);
                    const isPub = menu?.isPublished ?? false;
                    const availableLangs = getAvailableLanguagesForMenu(menu);
                    const hasAllTranslations = availableLangs.length === 0;

                    return (
                      <div key={menuId} className="border rounded-xl p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">ID: {menuId}</span>
                            {menu.parentId && <span className="text-xs text-slate-500">(Child of #{menu.parentId})</span>}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${isPub ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {isPub ? "Published" : "Draft"}
                            </span>
                            <button onClick={() => handleTogglePublishMenu(menu)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => handleDeleteMenu(menu)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Translations List */}
                        <div className="space-y-1 mt-3 pl-2 border-l-2 border-slate-300">
                          {menu.translations?.map((t) => (
                            <div key={t.id} className="text-sm flex items-center gap-2 text-slate-600">
                              <span className="font-medium text-slate-800">{t.language?.name}:</span>
                              <span>{t.menuTitle}</span>
                              <span className="text-xs font-mono text-slate-400">({t.menuURL})</span>
                            </div>
                          ))}
                        </div>

                        {/* Add Translation Button */}
                        {!hasAllTranslations && (
                          <button
                            onClick={() => openTranslationModal(menu)}
                            className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <PlusCircle size={14} /> Add Translation
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- LANGUAGES TAB --- */}
        {activeTab === "languages" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
              <h2 className="text-lg font-bold mb-4">{editingLangId !== null ? "Edit Language" : "Add Language"}</h2>
              <form onSubmit={handleLangSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Language Name *</label>
                  <input value={langForm.name} onChange={(e) => setLangForm({ ...langForm, name: e.target.value })} required placeholder="e.g. Hindi" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Language Code *</label>
                  <input value={langForm.code} onChange={(e) => setLangForm({ ...langForm, code: e.target.value })} required placeholder="e.g. hi" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500" />
                </div>
                <label className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={langForm.isPublished} onChange={(e) => setLangForm({ ...langForm, isPublished: e.target.checked })} className="h-4 w-4 accent-blue-600" />
                  <span className="text-sm font-medium">Published</span>
                </label>
                <button type="submit" disabled={saving} className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition">
                  {saving ? "Saving..." : editingLangId !== null ? "Update Language" : "Create Language"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Languages List</h2>
              {loading ? (
                <div className="py-12 text-center text-slate-500">Loading languages...</div>
              ) : languages.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Koi language available nahi hai.</div>
              ) : (
                <div className="space-y-3">
                  {languages.map((lang, idx) => {
                    const id = getItemId(lang);
                    const pub = lang?.isPublished ?? false;
                    return (
                      <div key={id || idx} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                        <div>
                          <h3 className="font-semibold">{lang.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">Code: {lang.code}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${pub ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {pub ? "Published" : "Draft"}
                          </span>
                          <button onClick={() => handleEditLang(lang)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleTogglePublishLang(lang)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg">
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- TRANSLATION MODAL --- */}
      {isTranslationModalOpen && currentMenuForTranslation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Translation for Menu #{getItemId(currentMenuForTranslation)}</h3>
              <button onClick={closeTranslationModal} className="text-slate-400 hover:text-rose-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTranslationSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Language *</label>
                <select
                  value={translationForm.languageId}
                  onChange={(e) => setTranslationForm({ ...translationForm, languageId: e.target.value })}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 bg-white text-sm"
                >
                  <option value="">-- Select Language --</option>
                  {getAvailableLanguagesForMenu(currentMenuForTranslation).map((l) => (
                    <option key={getItemId(l)} value={getItemId(l)}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Menu Title *</label>
                <input
                  value={translationForm.menuTitle}
                  onChange={(e) => setTranslationForm({ ...translationForm, menuTitle: e.target.value })}
                  required
                  placeholder="e.g. हमारे बारे में"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Menu URL *</label>
                <input
                  value={translationForm.menuURL}
                  onChange={(e) => setTranslationForm({ ...translationForm, menuURL: e.target.value })}
                  required
                  placeholder="e.g. /hi/hamare-bare-mein"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeTranslationModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50">
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Saving..." : "Save Translation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}