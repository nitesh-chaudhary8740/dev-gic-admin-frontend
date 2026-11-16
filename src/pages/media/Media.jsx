import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Folder, LoaderCircle, X } from "lucide-react";

import MediaHeader from "./components/MediaHeader";
import MediaStats from "./components/MediaStats";
import MediaToolbar from "./components/MediaToolbar";
import MediaGrid from "./components/MediaGrid";
import MediaList from "./components/MediaList";
import FolderModal from "./components/FolderModal";
import UploadModal from "./components/UploadModal";
import ConflictModal from "./components/ConflictModal";
import FormatsModal from "./components/FormatsModal";

import {
  API_BASE_URL,
  MEDIA_API,
  apiRequest,
  getContents,
  getFormats,
  joinLocation,
  bytesToHuman, // 🔴 YEH IMPORT ADD KIYA HAI
} from "./utils/mediaHelpers";

export default function Media() {
  const [items, setItems] = useState([]);
  const [formats, setFormats] = useState([]);

  const [location, setLocation] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingFolder, setSavingFolder] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customFileName, setCustomFileName] = useState("");

  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");
  const [pendingConflictFile, setPendingConflictFile] = useState(null);

  const [formatModalOpen, setFormatModalOpen] = useState(false);
  const [formatLoadingId, setFormatLoadingId] = useState(null);

  const fileInputRef = useRef(null);

  // ======================================
  // LOAD MEDIA CONTENTS
  // ======================================
  const loadContents = useCallback(async (targetLocation = "") => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ location: targetLocation });
      const response = await apiRequest(
        `${MEDIA_API}/contents?${query.toString()}`
      );
      setItems(getContents(response));
    } catch (err) {
      setItems([]);
      setError(err.message || "Unable to load media contents.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFormats = useCallback(async () => {
    try {
      const response = await apiRequest(`${MEDIA_API}/formats`);
      setFormats(getFormats(response));
    } catch (err) {
      setError(err.message || "Unable to load media formats.");
    }
  }, []);

  useEffect(() => {
    loadContents(location);
  }, [location, loadContents]);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  // ======================================
  // FILTER + SORT
  // ======================================
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    if (!term) return sorted;
    return sorted.filter((item) =>
      (item.name || "").toLowerCase().includes(term)
    );
  }, [items, search]);

  const breadcrumbs = useMemo(() => {
    const parts = location ? location.split("/").filter(Boolean) : [];
    return [
      { label: "Media Library", path: "" },
      ...parts.map((part, index) => ({
        label: part,
        path: parts.slice(0, index + 1).join("/"),
      })),
    ];
  }, [location]);

  // ======================================
  // UPLOAD
  // ======================================
  const openUploadModal = () => {
    setSelectedFile(null);
    setCustomFileName("");
    setUploadModalOpen(true);
    setError("");
    setMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitUpload = async (conflictAction = "cancel") => {
    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");

    const body = new FormData();
    body.append("file", selectedFile);
    body.append("location", location);
    if (customFileName.trim()) body.append("fileName", customFileName.trim());
    body.append("conflictAction", conflictAction);

    try {
      await apiRequest(`${MEDIA_API}/upload`, { method: "POST", body });
      setUploadModalOpen(false);
      setConflictModalOpen(false);
      setPendingConflictFile(null);
      setSelectedFile(null);
      setMessage("File uploaded successfully.");
      await loadContents(location);
    } catch (err) {
      if (err.status === 409 || err.code === "FILE_ALREADY_EXISTS") {
        setPendingConflictFile({ file: selectedFile, fileName: customFileName });
        setConflictMessage(err.message || "A file with this name already exists.");
        setConflictModalOpen(true);
        setUploadModalOpen(false);
      } else {
        // 🔴 YAHAN CHANGE HUA HAI: Error message formatting fix
        const rawMessage = err.message || "Unable to upload file.";
        
        // Ye regex "0.30 MB" jaisi values dhoondh kar unhe "307 KB" mein badal dega
        const cleanMessage = rawMessage.replace(
          /(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)\b/gi,
          (_, num, unit) => {
            const multipliers = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
            const bytes = parseFloat(num) * multipliers[unit.toUpperCase()];
            return bytesToHuman(bytes);
          }
        );
        
        setError(cleanMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const resolveConflict = async (action) => {
    if (!pendingConflictFile) return;
    setConflictModalOpen(false);
    setUploading(true);
    setError("");
    setMessage("");

    const body = new FormData();
    body.append("file", pendingConflictFile.file);
    body.append("location", location);
    if (pendingConflictFile.fileName?.trim())
      body.append("fileName", pendingConflictFile.fileName.trim());
    body.append("conflictAction", action);

    try {
      await apiRequest(`${MEDIA_API}/upload`, { method: "POST", body });
      setPendingConflictFile(null);
      setSelectedFile(null);
      setUploadModalOpen(false);
      setMessage(
        action === "replace"
          ? "File replaced successfully."
          : "File uploaded with a new name."
      );
      await loadContents(location);
    } catch (err) {
      setError(err.message || "Unable to complete upload.");
      if (err.status === 409) setConflictModalOpen(true);
    } finally {
      setUploading(false);
    }
  };

  // ======================================
  // FOLDER
  // ======================================
  const createFolder = async (event) => {
    event.preventDefault();
    if (!folderName.trim()) return;
    setSavingFolder(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(`${MEDIA_API}/folders`, {
        method: "POST",
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentPath: location,
        }),
      });
      setFolderModalOpen(false);
      setFolderName("");
      setMessage("Folder created successfully.");
      await loadContents(location);
    } catch (err) {
      setError(err.message || "Unable to create folder.");
    } finally {
      setSavingFolder(false);
    }
  };

  // ======================================
  // DELETE FILE
  // ======================================
  const deleteFile = async (item) => {
    if (!window.confirm(`Delete "${item.name}" permanently?`)) return;

    setError("");
    setMessage("");

    try {
      const filePath = item.path || item.id?.replace(/^file:/, "");
      if (!filePath) throw new Error("File path is missing.");

      await apiRequest(
        `${MEDIA_API}/files/${encodeURIComponent(filePath)}`,
        { method: "DELETE" }
      );

      setMessage("File deleted successfully.");
      await loadContents(location);
    } catch (err) {
      setError(err.message || "Unable to delete file.");
    }
  };

  // ======================================
  // DELETE FOLDER
  // ======================================
  const deleteFolder = async (item) => {
    if (
      !window.confirm(
        `Delete folder "${item.name}"? Only empty folders can be deleted.`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const folderPath = item.path || joinLocation(location, item.name);

      await apiRequest(`${MEDIA_API}/folders`, {
        method: "DELETE",
        body: JSON.stringify({ location: folderPath }),
      });

      setMessage("Folder deleted successfully.");
      await loadContents(location);
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete folder. It may not be empty."
      );
    }
  };

  // ======================================
  // TOGGLE FORMAT
  // ======================================
  const toggleFormat = async (format) => {
    setFormatLoadingId(format.id);
    setError("");
    setMessage("");

    try {
      const newStatus = !format.isAllowed;

      await apiRequest(`${MEDIA_API}/formats/${format.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isAllowed: newStatus }),
      });

      await loadFormats();

      setMessage(
        `${format.extension.toUpperCase()} ${
          newStatus ? "enabled" : "disabled"
        } successfully.`
      );
    } catch (err) {
      setError(err.message || "Unable to update format.");
    } finally {
      setFormatLoadingId(null);
    }
  };

  // ======================================
  // OPEN FORMAT MODAL
  // ======================================
  const openFormats = async () => {
    setFormatModalOpen(true);
    await loadFormats();
  };

  // ======================================
  // OPEN ITEM
  // ======================================
  const openItem = (item) => {
    if (item.type === "folder") {
      setSearch("");
      setLocation(item.path || joinLocation(location, item.name));
    } else if (item.url) {
      const url = item.url.startsWith("http")
        ? item.url
        : `${API_BASE_URL}${item.url}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // ======================================
  // COUNTS
  // ======================================
  const totalFiles = items.filter((item) => item.type === "file").length;
  const totalFolders = items.filter((item) => item.type === "folder").length;
  const allowedFormats = formats.filter((f) => f.isAllowed).length;

  // ======================================
  // UI
  // ======================================
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* HEADER */}
      <MediaHeader
        onOpenFormats={openFormats}
        onOpenFolderModal={() => setFolderModalOpen(true)}
        onOpenUploadModal={openUploadModal}
      />

      {/* ERROR */}
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

      {/* SUCCESS MESSAGE */}
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

      {/* STATISTICS */}
      <MediaStats
        totalFiles={totalFiles}
        totalFolders={totalFolders}
        allowedFormats={allowedFormats}
        formatsLength={formats.length}
      />

      {/* MEDIA EXPLORER */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* TOOLBAR */}
        <MediaToolbar
          location={location}
          breadcrumbs={breadcrumbs}
          search={search}
          view={view}
          loading={loading}
          onLocationChange={setLocation}
          onSearchChange={setSearch}
          onViewChange={setView}
          onRefresh={() => loadContents(location)}
        />

        {/* CONTENT */}
        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={25} className="animate-spin text-blue-600" />
            Loading media library...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
              <Folder size={30} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-800">
              {search ? "No matching items" : "This folder is empty"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Upload a file or create a folder to start organizing your media."}
            </p>
            {!search && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setFolderModalOpen(true)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Create folder
                </button>
                <button
                  onClick={openUploadModal}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Upload file
                </button>
              </div>
            )}
          </div>
        ) : view === "grid" ? (
          <MediaGrid
            items={filteredItems}
            onOpen={openItem}
            onDelete={deleteFile}
            onDeleteFolder={deleteFolder}
          />
        ) : (
          <MediaList
            items={filteredItems}
            onOpen={openItem}
            onDelete={deleteFile}
            onDeleteFolder={deleteFolder}
          />
        )}
      </section>

      {/* FOOTER */}
      <div className="flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Files are served from the public media directory.</span>
        <span>
          {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"} shown
        </span>
      </div>

      {/* MODALS */}
      <FolderModal
        open={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        folderName={folderName}
        onFolderNameChange={setFolderName}
        location={location}
        saving={savingFolder}
        onSubmit={createFolder}
      />

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        uploading={uploading}
        location={location}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        customFileName={customFileName}
        onCustomFileNameChange={setCustomFileName}
        fileInputRef={fileInputRef}
        onSubmit={submitUpload}
      />

      <ConflictModal
        open={conflictModalOpen}
        uploading={uploading}
        conflictMessage={conflictMessage}
        onResolve={resolveConflict}
        onCancel={() => {
          setConflictModalOpen(false);
          setPendingConflictFile(null);
        }}
      />

      <FormatsModal
        open={formatModalOpen}
        onClose={() => setFormatModalOpen(false)}
        formats={formats}
        formatLoadingId={formatLoadingId}
        onToggleFormat={toggleFormat}
      />
    </div>
  );
}