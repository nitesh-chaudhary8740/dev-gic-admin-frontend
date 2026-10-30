import React, { useCallback, useEffect, useState } from "react";
import {
  Menu as MenuIcon, List, GitBranch, Search, RefreshCw, Plus, Pencil, 
  ChevronRight, ChevronDown, FolderTree, FileText, CheckCircle2, AlertCircle, 
  X, Trash2, Eye, PlusCircle, Save, Languages
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://192.168.1.194:3000";

const EMPTY_MENU_FORM = { title: "", url: "", parentId: "", isPublished: false };
const EMPTY_TRANSLATION = { languageId: "", menuTitle: "", menuURL: "" };

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Request failed.");
  return result;
}

const getId = (item) => item?.id ?? item?._id;
const getList = (response) => Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : []);
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const getTranslation = (menu, langId) => menu?.translations?.find(t => String(t.languageId) === String(langId));

export default function Menus() {
  const [menus, setMenus] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [defaultLangId, setDefaultLangId] = useState("");
  
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Modals State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_FORM);
  
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [selectedMenuForTrans, setSelectedMenuForTrans] = useState(null);
  const [transForm, setTransForm] = useState(EMPTY_TRANSLATION);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [menusRes, langsRes] = await Promise.all([
        apiRequest("/api/menus"),
        apiRequest("/api/languages"),
      ]);
      const mList = getList(menusRes);
      const lList = getList(langsRes);
      
      setMenus(mList);
      setLanguages(lList);

      const defLang = lList.find(l => l.isPublished) || lList[0];
      if (defLang) setDefaultLangId(String(getId(defLang)));
      
      setSelectedLanguageId(prev => prev || (defLang ? String(getId(defLang)) : ""));
      setExpandedIds(new Set(mList.filter(m => !m.parentId).map(m => String(getId(m)))));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // =========================================================================
  // HELPER: Calculate Menu Levels & Format Hierarchy
  // =========================================================================
  
  // Calculates level (1, 2, 3, 4) for each menu
  const getMenuLevels = () => {
    const levels = {};
    const getLevel = (menuId) => {
      if (levels[menuId]) return levels[menuId];
      const menu = menus.find(m => getId(m) === menuId);
      if (!menu || !menu.parentId) {
        levels[menuId] = 1;
        return 1;
      }
      const parentLevel = getLevel(menu.parentId);
      levels[menuId] = parentLevel + 1;
      return levels[menuId];
    };
    menus.forEach(m => getLevel(getId(m)));
    return levels;
  };

  const menuLevels = getMenuLevels();

  // Builds a flat list with hierarchy prefix for <select> dropdown
  const getHierarchyOptions = (excludeId = null) => {
    const options = [];
    
    const buildOptions = (nodes, depth = 0) => {
      nodes.forEach(node => {
        const id = getId(node);
        if (id !== excludeId) {
          const level = menuLevels[id];
          const trans = getTranslation(node, defaultLangId) || node.translations?.[0];
          
          // Level 4 cannot be selected as parent (Max depth limit)
          const isLevel4 = level >= 4;
          
          options.push({
            id,
            title: trans?.menuTitle || node.menuTitle || `Menu #${id}`,
            level,
            depth,
            disabled: isLevel4,
          });
          
          if (node.children?.length > 0) {
            buildOptions(node.children, depth + 1);
          }
        }
      });
    };

    buildOptions(buildTree(menus));
    return options;
  };

  // =========================================================================
  // BASIC HELPERS
  // =========================================================================

  const buildTree = (flatMenus) => {
    const map = new Map(flatMenus.map(m => [String(getId(m)), { ...m, children: [] }]));
    const roots = [];
    flatMenus.forEach(m => {
      const pId = m.parentId;
      if (pId && map.has(String(pId))) map.get(String(pId)).children.push(map.get(String(getId(m))));
      else roots.push(map.get(String(getId(m))));
    });
    return roots;
  };

  const filteredMenus = menus.filter(m => {
    const t = getTranslation(m, selectedLanguageId);
    return (t?.menuTitle || m.menuTitle || "").toLowerCase().includes(search.toLowerCase());
  });

  const tree = buildTree(filteredMenus);

  // --- HANDLERS ---
  const handleToggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(String(id)) ? next.delete(String(id)) : next.add(String(id));
      return next;
    });
  };

  // Menu CRUD
  const openMenuModal = (menu = null) => {
    setEditingMenu(menu);
    if (menu) {
      const defTrans = getTranslation(menu, defaultLangId) || menu.translations?.[0];
      setMenuForm({
        title: defTrans?.menuTitle || "",
        url: defTrans?.menuURL || "",
        parentId: menu.parentId || "",
        isPublished: menu.isPublished,
      });
    } else {
      setMenuForm(EMPTY_MENU_FORM);
    }
    setIsMenuModalOpen(true);
    setError(""); setMessage("");
  };

  const submitMenu = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    
    // Frontend check: Don't allow creating if parent is level 4
    if (menuForm.parentId) {
      const parentLevel = menuLevels[Number(menuForm.parentId)];
      if (parentLevel >= 4) {
        setError("Level 4 se aage (Level 5) menu add nahi kar sakte. Kripya koi aur parent select karein.");
        setSaving(false);
        return;
      }
    }

    try {
      if (editingMenu) {
        await apiRequest(`/api/menus/${getId(editingMenu)}`, {
          method: "PATCH",
          body: JSON.stringify({ parentId: menuForm.parentId ? Number(menuForm.parentId) : null, isPublished: menuForm.isPublished }),
        });
        const defTrans = getTranslation(editingMenu, defaultLangId);
        if (defTrans) {
           await apiRequest(`/api/menus/${getId(editingMenu)}/translations/${getId(defTrans)}`, {
             method: "PATCH",
             body: JSON.stringify({ menuTitle: menuForm.title, menuURL: menuForm.url }),
           });
        }
        setMessage("Menu updated successfully.");
      } else {
        await apiRequest("/api/menus", {
          method: "POST",
          body: JSON.stringify({
            languageId: Number(defaultLangId),
            menuTitle: menuForm.title,
            menuURL: menuForm.url,
            parentId: menuForm.parentId ? Number(menuForm.parentId) : null,
            isPublished: menuForm.isPublished,
          }),
        });
        setMessage("Menu created successfully.");
      }
      setIsMenuModalOpen(false);
      loadData();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const handleDeleteMenu = async (menu) => {
    if (!window.confirm("Are you sure you want to delete this menu?")) return;
    try {
      await apiRequest(`/api/menus/${getId(menu)}`, { method: "DELETE" });
      setMessage("Menu deleted."); loadData();
    } catch (err) { setError(err.message); }
  };

  const togglePublish = async (menu) => {
    try {
      await apiRequest(`/api/menus/${getId(menu)}/${menu.isPublished ? 'unpublish' : 'publish'}`, { method: "PATCH" });
      loadData();
    } catch (err) { setError(err.message); }
  };

  // Translation CRUD
  const openTransModal = (menu) => {
    setSelectedMenuForTrans(menu);
    setTransForm(EMPTY_TRANSLATION);
    setIsTransModalOpen(true);
    setError(""); setMessage("");
  };

  const submitTranslation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = getTranslation(selectedMenuForTrans, transForm.languageId);
      if (existing) {
        await apiRequest(`/api/menus/${getId(selectedMenuForTrans)}/translations/${getId(existing)}`, {
          method: "PATCH",
          body: JSON.stringify({ menuTitle: transForm.menuTitle, menuURL: transForm.menuURL }),
        });
        setMessage("Translation updated.");
      } else {
        await apiRequest(`/api/menus/${getId(selectedMenuForTrans)}/translations`, {
          method: "POST",
          body: JSON.stringify({ languageId: Number(transForm.languageId), menuTitle: transForm.menuTitle, menuURL: transForm.menuURL }),
        });
        setMessage("Translation added.");
      }
      setIsTransModalOpen(false);
      loadData();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  // Render Tree Node
  const renderNode = (menu, depth = 0) => {
    const id = getId(menu);
    const trans = getTranslation(menu, selectedLanguageId);
    const hasKids = menu.children?.length > 0;
    const isExp = expandedIds.has(String(id));

    return (
      <React.Fragment key={id}>
        <div className="flex items-center gap-3 border-b border-slate-100 p-3 hover:bg-slate-50" style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <button onClick={() => handleToggleExpand(id)} disabled={!hasKids} className={`p-1 rounded hover:bg-slate-200 ${!hasKids && 'opacity-0'}`}>
            {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <FolderTree size={18} className="text-blue-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{trans?.menuTitle || menu.menuTitle || "Untitled"}</p>
            <p className="text-xs text-slate-500">{trans?.menuURL || menu.menuURL}</p>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${menu.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {menu.isPublished ? 'Published' : 'Draft'}
          </span>
          <div className="flex gap-1">
             <button onClick={() => openTransModal(menu)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Translations"><Languages size={16} /></button>
             <button onClick={() => openMenuModal(menu)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded" title="Edit"><Pencil size={16} /></button>
             <button onClick={() => togglePublish(menu)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded" title="Toggle Publish"><Eye size={16} /></button>
             <button onClick={() => handleDeleteMenu(menu)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded" title="Delete"><Trash2 size={16} /></button>
          </div>
        </div>
        {hasKids && isExp && menu.children.map(c => renderNode(c, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-slate-500">Manage navigation and translations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 border rounded-lg hover:bg-slate-50"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
          <button onClick={() => openMenuModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Plus size={18} /> Add Menu</button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-lg flex items-center gap-2"><AlertCircle size={18}/>{error}</div>}
      {message && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2"><CheckCircle2 size={18}/>{message}</div>}

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium flex items-center gap-2"><Languages size={16}/> Language:</label>
          <select value={selectedLanguageId} onChange={e => setSelectedLanguageId(e.target.value)} className={inputClass + " w-48"}>
            {languages.map(l => <option key={getId(l)} value={getId(l)}>{l.name} ({l.code})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className={inputClass + " pl-9 w-64"} />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setView("table")} className={`p-1.5 rounded ${view === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><List size={18} /></button>
            <button onClick={() => setView("tree")} className={`p-1.5 rounded ${view === 'tree' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><GitBranch size={18} /></button>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? <div className="p-10 text-center">Loading menus...</div> : view === "table" ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="p-4">Title</th><th className="p-4">URL</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenus.map(m => {
                const t = getTranslation(m, selectedLanguageId);
                return (
                  <tr key={getId(m)} className="hover:bg-slate-50">
                    <td className="p-4 font-medium">{t?.menuTitle || m.menuTitle || "—"}</td>
                    <td className="p-4 text-slate-500">{t?.menuURL || m.menuURL || "—"}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-xs rounded-full ${m.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{m.isPublished ? 'Published' : 'Draft'}</span></td>
                    <td className="p-4 flex justify-end gap-2">
                       <button onClick={() => openTransModal(m)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"><Languages size={16}/></button>
                       <button onClick={() => openMenuModal(m)} className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"><Pencil size={16}/></button>
                       <button onClick={() => togglePublish(m)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"><Eye size={16}/></button>
                       <button onClick={() => handleDeleteMenu(m)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div>{tree.map(m => renderNode(m))}</div>
        )}
      </div>

      {/* Menu Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">{editingMenu ? "Edit Menu" : "Create Menu"}</h2>
            <form onSubmit={submitMenu} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Parent Menu</label>
                <select 
                  value={menuForm.parentId} 
                  onChange={e => setMenuForm({...menuForm, parentId: e.target.value})} 
                  className={inputClass}
                >
                  <option value="">-- Root Level --</option>
                  {/* HIERARCHY DROPDOWN WITH LEVEL RESTRICTION */}
                  {getHierarchyOptions(getId(editingMenu)).map(opt => (
                    <option 
                      key={opt.id} 
                      value={opt.id} 
                      disabled={opt.disabled}
                      className={opt.disabled ? "text-slate-400" : ""}
                    >
                      {opt.depth > 0 ? "— " : ""}
                      {"  ".repeat(opt.depth)}
                      {opt.title} (L{opt.level})
                      {opt.disabled ? " [Max Depth Reached]" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Level 4 menus cannot have children.</p>
              </div>
              <div>
                <label className="text-sm font-medium">Menu Title *</label>
                <input required value={menuForm.title} onChange={e => setMenuForm({...menuForm, title: e.target.value})} className={inputClass} placeholder="About Us" />
              </div>
              <div>
                <label className="text-sm font-medium">Menu URL *</label>
                <input required value={menuForm.url} onChange={e => setMenuForm({...menuForm, url: e.target.value})} className={inputClass} placeholder="/about-us" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={menuForm.isPublished} onChange={e => setMenuForm({...menuForm, isPublished: e.target.checked})} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm">Published</span>
              </label>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                  {saving ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16} />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Translation Modal */}
      {isTransModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Manage Translations</h2>
            <div className="mb-4 bg-slate-50 p-3 rounded border text-sm">
              <p className="font-semibold text-slate-700">Base Menu:</p>
              <p>{selectedMenuForTrans?.translations?.[0]?.menuTitle} ({selectedMenuForTrans?.translations?.[0]?.menuURL})</p>
            </div>
            <form onSubmit={submitTranslation} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Language</label>
                <select required value={transForm.languageId} onChange={e => {
                  const langId = e.target.value;
                  const existing = getTranslation(selectedMenuForTrans, langId);
                  setTransForm({
                    languageId: langId,
                    menuTitle: existing?.menuTitle || "",
                    menuURL: existing?.menuURL || ""
                  });
                }} className={inputClass}>
                  <option value="">Select...</option>
                  {languages.map(l => <option key={getId(l)} value={getId(l)}>{l.name}</option>)}
                </select>
              </div>
              {transForm.languageId && (
                <>
                  <div>
                    <label className="text-sm font-medium">Translated Title *</label>
                    <input required value={transForm.menuTitle} onChange={e => setTransForm({...transForm, menuTitle: e.target.value})} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Translated URL *</label>
                    <input required value={transForm.menuURL} onChange={e => setTransForm({...transForm, menuURL: e.target.value})} className={inputClass} />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsTransModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" disabled={saving || !transForm.languageId} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                  {saving ? <RefreshCw size={16} className="animate-spin"/> : <Save size={16} />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}