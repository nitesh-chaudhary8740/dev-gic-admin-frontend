import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  List,
  GitBranch,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  ChevronRight,
  ChevronDown,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  Save,
  Languages as LanguagesIcon,
  Star,
  Globe2,
  LoaderCircle,
} from "lucide-react";

// ======================================
// API — menuApi.js
// ======================================
import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuPublish,
  setDefaultMenu,
  getMenuParentUrlPath,
  createMenuTranslation,
  updateMenuTranslation,
} from "../api/menuApi";

// ======================================
// API — languageApi.js (reuse)
// ======================================
import { getLanguages } from "../api/languageApi";

// ======================================
// HELPERS
// ======================================
const EMPTY_MENU_FORM = {
  title: "",
  slug: "",
  parentId: "",
  isPublished: false,
  isDefault: false,
};

const EMPTY_TRANSLATION = { languageId: "", menuTitle: "", menuURL: "" };

const getId = (item) => item?.id ?? item?._id;

const getList = (response) =>
  Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : [];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const getTranslation = (menu, langId) =>
  menu?.translations?.find((t) => String(t.languageId) === String(langId));

const extractErrorMessage = (err, fallback = "Request failed.") =>
  err?.response?.data?.message || err?.message || fallback;

export default function Menus() {
  const [menus, setMenus] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [defaultLangId, setDefaultLangId] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState(null);

  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Parent URL path (menu modal)
  const [parentPathData, setParentPathData] = useState(null);
  const [parentPathError, setParentPathError] = useState("");
  const [loadingParentPath, setLoadingParentPath] = useState(false);

  // Parent URL path (translation modal)
  const [transParentPathData, setTransParentPathData] = useState(null);
  const [transParentPathError, setTransParentPathError] = useState("");
  const [loadingTransParentPath, setLoadingTransParentPath] = useState(false);

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_FORM);
  const originalFullURLRef = useRef("");

  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [selectedMenuForTrans, setSelectedMenuForTrans] = useState(null);
  const [transForm, setTransForm] = useState(EMPTY_TRANSLATION);

  // --------------------------------------------------
  // TRANSLATION: available language options
  // --------------------------------------------------
  const translationLanguageOptions = useMemo(() => {
    if (!selectedMenuForTrans) return languages;
    return languages.map((l) => {
      const isDefaultLang = String(getId(l)) === String(defaultLangId);
      const existing = getTranslation(selectedMenuForTrans, getId(l));
      return {
        ...l,
        isDefaultLang,
        hasTranslation: Boolean(existing),
      };
    });
  }, [languages, selectedMenuForTrans, defaultLangId]);

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [menusRes, langsRes] = await Promise.all([
        getMenus(),
        getLanguages(),
      ]);

      const mList = getList(menusRes);
      const lList = getList(langsRes);

      setMenus(mList);
      setLanguages(lList);

      const defLang =
        lList.find((l) => l.isDefault) ||
        lList.find((l) => l.isPublished) ||
        lList[0];

      if (defLang) {
        setDefaultLangId(String(getId(defLang)));
        setDefaultLanguage(defLang);
      }

      setSelectedLanguageId(
        (prev) => prev || (defLang ? String(getId(defLang)) : "")
      );

      setExpandedIds(
        new Set(mList.filter((m) => !m.parentId).map((m) => String(getId(m))))
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --------------------------------------------------
  // MENU LEVELS
  // --------------------------------------------------
  const menuLevels = useMemo(() => {
    const levels = {};
    const getLevel = (menuId) => {
      if (levels[menuId]) return levels[menuId];
      const menu = menus.find((m) => getId(m) === menuId);
      if (!menu || !menu.parentId) {
        levels[menuId] = 1;
        return 1;
      }
      const parentLevel = getLevel(menu.parentId);
      levels[menuId] = parentLevel + 1;
      return levels[menuId];
    };
    menus.forEach((m) => getLevel(getId(m)));
    return levels;
  }, [menus]);

  // --------------------------------------------------
  // HIERARCHY OPTIONS
  // --------------------------------------------------
  const buildTree = (flatMenus) => {
    const map = new Map(
      flatMenus.map((m) => [String(getId(m)), { ...m, children: [] }])
    );
    const roots = [];
    flatMenus.forEach((m) => {
      const pId = m.parentId;
      if (pId && map.has(String(pId))) {
        map.get(String(pId)).children.push(map.get(String(getId(m))));
      } else {
        roots.push(map.get(String(getId(m))));
      }
    });
    return roots;
  };

  const getHierarchyOptions = (excludeId = null) => {
    const options = [];
    const walk = (nodes, depth = 0) => {
      nodes.forEach((node) => {
        const id = getId(node);
        if (id !== excludeId) {
          const level = menuLevels[id];
          const trans =
            getTranslation(node, defaultLangId) || node.translations?.[0];
          options.push({
            id,
            title: trans?.menuTitle || node.menuTitle || `Menu #${id}`,
            level,
            depth,
            disabled: level >= 4,
          });
          if (node.children?.length > 0) walk(node.children, depth + 1);
        }
      });
    };
    walk(buildTree(menus));
    return options;
  };

  const filteredMenus = menus.filter((m) => {
    const t = getTranslation(m, selectedLanguageId);
    return (t?.menuTitle || m.menuTitle || "")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const tree = buildTree(filteredMenus);
  const defaultMenu = menus.find((m) => m.isDefault);

  // --------------------------------------------------
  // FETCH PARENT URL PATH (Menu Modal)
  // --------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchParentPath = async () => {
      if (!menuForm.parentId || !defaultLangId) {
        setParentPathData(null);
        setParentPathError("");
        return;
      }

      setLoadingParentPath(true);
      setParentPathError("");

      try {
        const res = await getMenuParentUrlPath({
          parentId: menuForm.parentId,
          languageId: defaultLangId,
        });
        if (!cancelled) setParentPathData(res.data);
      } catch (err) {
        if (!cancelled) {
          setParentPathError(extractErrorMessage(err));
          setParentPathData(null);
        }
      } finally {
        if (!cancelled) setLoadingParentPath(false);
      }
    };

    fetchParentPath();
    return () => {
      cancelled = true;
    };
  }, [menuForm.parentId, defaultLangId]);

  // --------------------------------------------------
  // FETCH PARENT URL PATH (Translation Modal)
  // --------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchTransParentPath = async () => {
      if (
        !isTransModalOpen ||
        !selectedMenuForTrans ||
        !transForm.languageId
      ) {
        setTransParentPathData(null);
        setTransParentPathError("");
        return;
      }

      const menu = menus.find(
        (m) => getId(m) === getId(selectedMenuForTrans)
      );

      if (!menu?.parentId) {
        setTransParentPathData(null);
        setTransParentPathError("");
        return;
      }

      setLoadingTransParentPath(true);
      setTransParentPathError("");

      try {
        const res = await getMenuParentUrlPath({
          parentId: menu.parentId,
          languageId: transForm.languageId,
        });
        if (!cancelled) setTransParentPathData(res.data);
      } catch (err) {
        if (!cancelled) {
          setTransParentPathError(extractErrorMessage(err));
          setTransParentPathData(null);
        }
      } finally {
        if (!cancelled) setLoadingTransParentPath(false);
      }
    };

    fetchTransParentPath();
    return () => {
      cancelled = true;
    };
  }, [isTransModalOpen, selectedMenuForTrans, transForm.languageId, menus]);

  // --------------------------------------------------
  // EDIT MODE: Slug compute
  // --------------------------------------------------
  useEffect(() => {
    if (
      !editingMenu ||
      !menuForm.parentId ||
      !parentPathData?.parentURL ||
      loadingParentPath
    ) {
      return;
    }

    const originalFullURL = originalFullURLRef.current;
    const parentURL = parentPathData.parentURL;

    if (originalFullURL && originalFullURL.startsWith(parentURL)) {
      const slugPart = originalFullURL.slice(parentURL.length);
      if (slugPart && slugPart !== menuForm.slug) {
        setMenuForm((prev) => ({ ...prev, slug: slugPart }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentPathData, loadingParentPath, editingMenu, menuForm.parentId]);

  // --------------------------------------------------
  // HANDLERS
  // --------------------------------------------------
  const handleToggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(String(id)) ? next.delete(String(id)) : next.add(String(id));
      return next;
    });
  };

  const openMenuModal = (menu = null) => {
    setEditingMenu(menu);
    setParentPathData(null);
    setParentPathError("");
    originalFullURLRef.current = "";

    if (menu) {
      const defTrans =
        getTranslation(menu, defaultLangId) || menu.translations?.[0];
      originalFullURLRef.current = defTrans?.menuURL || "";
      setMenuForm({
        title: defTrans?.menuTitle || "",
        slug: "",
        parentId: menu.parentId || "",
        isPublished: menu.isPublished,
        isDefault: Boolean(menu.isDefault),
      });
    } else {
      setMenuForm(EMPTY_MENU_FORM);
    }

    setIsMenuModalOpen(true);
    setError("");
    setMessage("");
  };

  const submitMenu = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (menuForm.parentId && menuLevels[Number(menuForm.parentId)] >= 4) {
      setError("Level 4 se aage (Level 5) menu add nahi kar sakte.");
      setSaving(false);
      return;
    }

    try {
      let fullURL;

      if (menuForm.parentId) {
        if (!parentPathData?.parentURL) {
          setError("Parent URL path fetch nahi ho paya.");
          setSaving(false);
          return;
        }
        const slug = (menuForm.slug || "").trim();
        fullURL = `${parentPathData.parentURL}${
          slug.startsWith("/") ? slug : "/" + slug
        }`;
      } else {
        const slug = (menuForm.slug || "").trim();
        const langPrefix = `/${defaultLanguage?.code || "en"}`;
        fullURL =
          slug === "/" || !slug
            ? `${langPrefix}/`
            : `${langPrefix}${slug.startsWith("/") ? slug : "/" + slug}`;
      }

      if (editingMenu) {
        await updateMenu(getId(editingMenu), {
          parentId: menuForm.parentId ? Number(menuForm.parentId) : null,
          isPublished: menuForm.isPublished,
        });

        const defTrans = getTranslation(editingMenu, defaultLangId);
        if (defTrans) {
          await updateMenuTranslation(
            getId(editingMenu),
            getId(defTrans),
            { menuTitle: menuForm.title, menuURL: fullURL }
          );
        }

        if (menuForm.isDefault && !editingMenu.isDefault) {
          await setDefaultMenu(getId(editingMenu));
        }

        setMessage("Menu updated successfully.");
      } else {
        await createMenu({
          menuTitle: menuForm.title,
          menuURL: fullURL,
          parentId: menuForm.parentId ? Number(menuForm.parentId) : null,
          isPublished: menuForm.isPublished,
          isDefault: menuForm.isDefault,
        });

        setMessage("Menu created successfully.");
      }

      setIsMenuModalOpen(false);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenu = async (menu) => {
    if (!window.confirm("Are you sure you want to delete this menu?")) return;

    try {
      await deleteMenu(getId(menu));
      setMessage("Menu deleted.");
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const togglePublish = async (menu) => {
    try {
      await toggleMenuPublish(getId(menu), menu.isPublished);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleSetDefault = async (menu) => {
    if (menu.isDefault) {
      setMessage("Yeh menu already default hai.");
      return;
    }
    if (!menu.isPublished) {
      setError("Pehle menu ko publish karo, phir default set karo.");
      return;
    }

    setError("");
    setMessage("");
    setSettingDefaultId(getId(menu));

    try {
      await setDefaultMenu(getId(menu));
      setMessage("Menu set as default (home page).");
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const openTransModal = (menu) => {
    setSelectedMenuForTrans(menu);
    setTransForm(EMPTY_TRANSLATION);
    setIsTransModalOpen(true);
    setTransParentPathData(null);
    setTransParentPathError("");
    setError("");
    setMessage("");
  };

  const submitTranslation = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let fullURL;

      if (transParentPathData?.parentURL) {
        const slug = transForm.menuURL || "";
        fullURL = `${transParentPathData.parentURL}${
          slug.startsWith("/") ? slug : "/" + slug
        }`;
      } else {
        const langCode =
          languages.find(
            (l) => String(getId(l)) === String(transForm.languageId)
          )?.code || "xx";
        const slug = transForm.menuURL || "";
        fullURL = `/${langCode}${
          slug.startsWith("/") ? slug : "/" + slug
        }`;
      }

      const existing = getTranslation(
        selectedMenuForTrans,
        transForm.languageId
      );

      if (existing) {
        await updateMenuTranslation(
          getId(selectedMenuForTrans),
          getId(existing),
          { menuTitle: transForm.menuTitle, menuURL: fullURL }
        );
        setMessage("Translation updated.");
      } else {
        await createMenuTranslation(getId(selectedMenuForTrans), {
          languageId: Number(transForm.languageId),
          menuTitle: transForm.menuTitle,
          menuURL: fullURL,
        });
        setMessage("Translation added.");
      }

      setIsTransModalOpen(false);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // RENDER TREE NODE
  // --------------------------------------------------
  const renderNode = (menu, depth = 0) => {
    const id = getId(menu);
    const trans = getTranslation(menu, selectedLanguageId);
    const hasKids = menu.children?.length > 0;
    const isExp = expandedIds.has(String(id));
    const isDefault = Boolean(menu.isDefault);
    const isSettingDefault = settingDefaultId === id;

    return (
      <React.Fragment key={id}>
        <div
          className="flex items-center gap-3 border-b border-slate-100 p-3 hover:bg-slate-50"
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          <button
            onClick={() => handleToggleExpand(id)}
            disabled={!hasKids}
            className={`p-1 rounded hover:bg-slate-200 ${
              !hasKids && "opacity-0"
            }`}
          >
            {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <FolderTree
            size={18}
            className={isDefault ? "text-amber-500" : "text-blue-500"}
          />

          <div className="flex-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              {trans?.menuTitle || menu.menuTitle || "Untitled"}
              {isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Star size={10} className="fill-amber-500 text-amber-500" />{" "}
                  Home
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              {trans?.menuURL || menu.menuURL}
            </p>
          </div>

          <span
            className={`px-2 py-1 text-xs rounded-full ${
              menu.isPublished
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {menu.isPublished ? "Published" : "Draft"}
          </span>

          <div className="flex gap-1">
            {!isDefault && menu.isPublished && (
              <button
                onClick={() => handleSetDefault(menu)}
                disabled={isSettingDefault}
                className="p-1.5 text-amber-600 hover:bg-amber-100 rounded"
                title="Set as default"
              >
                {isSettingDefault ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Star size={16} />
                )}
              </button>
            )}
            <button
              onClick={() => openTransModal(menu)}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
              title="Translations"
            >
              <LanguagesIcon size={16} />
            </button>
            <button
              onClick={() => openMenuModal(menu)}
              className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => togglePublish(menu)}
              disabled={isDefault}
              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded disabled:opacity-40"
              title={
                isDefault
                  ? "Default menu cannot be unpublished"
                  : "Toggle Publish"
              }
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => handleDeleteMenu(menu)}
              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {hasKids && isExp && menu.children.map((c) => renderNode(c, depth + 1))}
      </React.Fragment>
    );
  };

  // --------------------------------------------------
  // PREVIEW URLS
  // --------------------------------------------------
  const previewURL = useMemo(() => {
    if (menuForm.parentId && parentPathData?.parentURL) {
      const slug = menuForm.slug || "";
      return `${parentPathData.parentURL}${
        slug.startsWith("/") ? slug : "/" + slug
      }`;
    }
    if (!menuForm.parentId) {
      const langPrefix = `/${defaultLanguage?.code || "en"}`;
      const slug = menuForm.slug || "";
      if (!slug || slug === "/") return `${langPrefix}/`;
      return `${langPrefix}${slug.startsWith("/") ? slug : "/" + slug}`;
    }
    return "—";
  }, [menuForm.parentId, menuForm.slug, parentPathData, defaultLanguage]);

  const transPreviewURL = useMemo(() => {
    const langCode =
      languages.find(
        (l) => String(getId(l)) === String(transForm.languageId)
      )?.code || "xx";
    const slug = transForm.menuURL || "";
    if (transParentPathData?.parentURL) {
      return `${transParentPathData.parentURL}${
        slug.startsWith("/") ? slug : "/" + slug
      }`;
    }
    return `/${langCode}${slug.startsWith("/") ? slug : "/" + slug}`;
  }, [transForm.menuURL, transForm.languageId, transParentPathData, languages]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-slate-500">
            Manage navigation and translations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 border rounded-lg hover:bg-slate-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => openMenuModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
          >
            <Plus size={18} /> Add Menu
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {message && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total menus</p>
            <FolderTree size={19} className="text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {menus.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Published</p>
            <CheckCircle2 size={19} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {menus.filter((m) => m.isPublished).length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Default (Home)</p>
            <Star size={19} className="text-amber-500" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900 truncate">
            {defaultMenu
              ? getTranslation(defaultMenu, defaultLangId)?.menuTitle ||
                `Menu #${getId(defaultMenu)}`
              : "—"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <LanguagesIcon size={16} /> Language:
          </label>
          <select
            value={selectedLanguageId}
            onChange={(e) => setSelectedLanguageId(e.target.value)}
            className={inputClass + " w-48"}
          >
            {languages.map((l) => (
              <option key={getId(l)} value={getId(l)}>
                {l.displayName || l.name} ({l.code}) {l.isDefault ? "★" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className={inputClass + " pl-9 w-64"}
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView("table")}
              className={`p-1.5 rounded ${
                view === "table"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500"
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setView("tree")}
              className={`p-1.5 rounded ${
                view === "tree"
                  ? "bg-white shadow text-blue-600"
                  : "text-slate-500"
              }`}
            >
              <GitBranch size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading menus...</div>
        ) : view === "table" ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">URL</th>
                <th className="p-4">Status</th>
                <th className="p-4">Default</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenus.map((m) => {
                const t = getTranslation(m, selectedLanguageId);
                const isDefault = Boolean(m.isDefault);
                const isSettingDefault = settingDefaultId === getId(m);

                return (
                  <tr key={getId(m)} className="hover:bg-slate-50">
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        {t?.menuTitle || m.menuTitle || "—"}
                        {isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <Star
                              size={10}
                              className="fill-amber-500 text-amber-500"
                            />{" "}
                            Home
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {t?.menuURL || m.menuURL || "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          m.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {m.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-4">
                      {isDefault ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <Star
                            size={12}
                            className="fill-amber-500 text-amber-500"
                          />{" "}
                          Default
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetDefault(m)}
                          disabled={isSettingDefault || !m.isPublished}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSettingDefault ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Star size={12} />
                          )}
                          Set default
                        </button>
                      )}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button
                        onClick={() => openTransModal(m)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <LanguagesIcon size={16} />
                      </button>
                      <button
                        onClick={() => openMenuModal(m)}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => togglePublish(m)}
                        disabled={isDefault}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded disabled:opacity-40"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(m)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div>{tree.map((m) => renderNode(m))}</div>
        )}
      </div>

      {/* Menu Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingMenu ? "Edit Menu" : "Create Menu"}
            </h2>

            {defaultLanguage && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                <Globe2 size={14} />
                <span>
                  Menu{" "}
                  <strong>
                    {defaultLanguage.displayName || defaultLanguage.name}
                  </strong>{" "}
                  ({defaultLanguage.code}) mein banega.
                </span>
              </div>
            )}

            <form onSubmit={submitMenu} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Parent Menu</label>
                <select
                  value={menuForm.parentId}
                  onChange={(e) =>
                    setMenuForm({
                      ...menuForm,
                      parentId: e.target.value,
                      slug: "",
                    })
                  }
                  className={inputClass}
                >
                  <option value="">-- Root Level --</option>
                  {getHierarchyOptions(getId(editingMenu)).map((opt) => (
                    <option
                      key={opt.id}
                      value={opt.id}
                      disabled={opt.disabled}
                    >
                      {opt.depth > 0 ? "— " : ""}
                      {"  ".repeat(opt.depth)}
                      {opt.title} (L{opt.level})
                      {opt.disabled ? " [Max Depth]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {menuForm.parentId && (
                <>
                  {loadingParentPath && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <LoaderCircle size={13} className="animate-spin" />
                      Parent URL fetch ho raha hai...
                    </div>
                  )}
                  {parentPathError && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                      <AlertCircle size={13} className="inline mr-1" />
                      {parentPathError}
                    </div>
                  )}
                  {parentPathData && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                      <p className="font-semibold mb-1">Parent hierarchy:</p>
                      <p className="font-mono text-[11px]">
                        {parentPathData.hierarchy
                          .map((h) => h.menuTitle)
                          .join(" → ")}
                      </p>
                      <p className="mt-1.5">
                        Parent URL:{" "}
                        <code className="bg-emerald-100 px-1 rounded">
                          {parentPathData.parentURL}
                        </code>
                      </p>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-sm font-medium">Menu Title *</label>
                <input
                  required
                  value={menuForm.title}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, title: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Board of Directors"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Menu URL Slug *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 max-w-[55%] truncate">
                    {menuForm.parentId
                      ? parentPathData?.parentURL ||
                        `/${defaultLanguage?.code || "en"}/...`
                      : `/${defaultLanguage?.code || "en"}`}
                  </span>
                  <input
                    required
                    value={menuForm.slug}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, slug: e.target.value })
                    }
                    className={inputClass + " rounded-l-none"}
                    placeholder="/board-of-directors"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Final URL:{" "}
                  <code className="bg-slate-100 px-1 rounded">{previewURL}</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isPublished}
                    onChange={(e) =>
                      setMenuForm({
                        ...menuForm,
                        isPublished: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm">Published</span>
                </label>

                {!editingMenu && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={menuForm.isDefault}
                      onChange={(e) =>
                        setMenuForm({
                          ...menuForm,
                          isDefault: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Star size={12} className="text-amber-500" /> Default (home)
                    </span>
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}{" "}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Translation Modal */}
      {isTransModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Manage Translations</h2>

            <div className="mb-4 bg-slate-50 p-3 rounded border text-sm">
              <p className="font-semibold text-slate-700">Base Menu:</p>
              <p>
                {selectedMenuForTrans?.translations?.[0]?.menuTitle} (
                {selectedMenuForTrans?.translations?.[0]?.menuURL})
              </p>
            </div>

            <form onSubmit={submitTranslation} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Language</label>
                <select
                  required
                  value={transForm.languageId}
                  onChange={(e) => {
                    const langId = e.target.value;
                    const existing = getTranslation(
                      selectedMenuForTrans,
                      langId
                    );
                    setTransForm({
                      languageId: langId,
                      menuTitle: existing?.menuTitle || "",
                      menuURL: existing?.menuURL || "",
                    });
                  }}
                  className={inputClass}
                >
                  <option value="">Select...</option>
                  {translationLanguageOptions.map((l) => {
                    const langId = getId(l);
                    return (
                      <option key={langId} value={langId}>
                        {l.displayName || l.name} ({l.code})
                        {l.isDefaultLang
                          ? " ★ (Default - already exists)"
                          : ""}
                        {!l.isDefaultLang && l.hasTranslation
                          ? " ✓ (exists)"
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {transForm.languageId && (
                <>
                  <div>
                    <label className="text-sm font-medium">
                      Translated Title *
                    </label>
                    <input
                      required
                      value={transForm.menuTitle}
                      onChange={(e) =>
                        setTransForm({
                          ...transForm,
                          menuTitle: e.target.value,
                        })
                      }
                      className={inputClass}
                      placeholder="हमारे बारे में"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      Translated URL Slug *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 max-w-[55%] truncate">
                        {loadingTransParentPath ? (
                          <LoaderCircle size={12} className="animate-spin" />
                        ) : transParentPathData ? (
                          transParentPathData.parentURL
                        ) : (
                          `/${
                            languages.find(
                              (l) =>
                                String(getId(l)) ===
                                String(transForm.languageId)
                            )?.code || "xx"
                          }`
                        )}
                      </span>

                      <input
                        required
                        value={transForm.menuURL}
                        onChange={(e) =>
                          setTransForm({
                            ...transForm,
                            menuURL: e.target.value,
                          })
                        }
                        className={inputClass + " rounded-l-none"}
                        placeholder="/nigamiya-prabandhan"
                      />
                    </div>

                    {transParentPathError && (
                      <p className="mt-1 text-xs text-rose-600">
                        {transParentPathError}
                      </p>
                    )}

                    {!loadingTransParentPath && !transParentPathError && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        Final URL:{" "}
                        <code className="bg-slate-100 px-1 rounded">
                          {transPreviewURL}
                        </code>
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTransModalOpen(false)}
                  className="px-4 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !transForm.languageId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}